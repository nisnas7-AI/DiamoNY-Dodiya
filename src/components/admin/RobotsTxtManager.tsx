import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, Eye, History, RotateCcw, AlertTriangle, CheckCircle, Info, ExternalLink, ShieldAlert, Globe } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";

interface RobotsTxtHistory {
  id: string;
  content: string;
  edited_by: string | null;
  created_at: string;
  note: string | null;
}

interface ValidationResult {
  valid: boolean;
  hasHighRisk: boolean;
  warnings: { type: 'error' | 'warning' | 'info' | 'high-risk'; message: string }[];
}

// Dynamic base URL - uses environment or falls back to published domain
const getBaseUrl = (): string => {
  // In production, use the published URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  // Fallback to the published domain
  return 'https://diamony.me';
};

const DYNAMIC_SITEMAP_URL = `${getBaseUrl()}/sitemap.xml`;

const FALLBACK_CONTENT = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: ${DYNAMIC_SITEMAP_URL}`;

const validateRobotsTxt = (content: string): ValidationResult => {
  const warnings: ValidationResult['warnings'] = [];
  let hasHighRisk = false;
  
  // Check for User-agent directive
  if (!content.includes('User-agent:')) {
    warnings.push({ type: 'error', message: 'חסרה שורת User-agent - קריטי!' });
  }
  
  // Check for dangerous Disallow: / (blocks entire site) - HIGH RISK
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Check for "Disallow: /" that blocks entire site (but not Disallow: /admin etc.)
    if (trimmed === 'Disallow: /' || trimmed === 'Disallow:/' || trimmed === 'Disallow:') {
      hasHighRisk = true;
      warnings.push({ 
        type: 'high-risk', 
        message: 'אזהרה קריטית: אתה עומד לחסום את מנועי החיפוש מסריקת האתר כולו. זה ישפיע לרעה על הדירוג שלך בגוגל!' 
      });
      break;
    }
  }
  
  // Check for Sitemap
  if (!content.includes('Sitemap:')) {
    warnings.push({ type: 'info', message: 'מומלץ להוסיף שורת Sitemap' });
  }
  
  // Check for valid URL in Sitemap
  const sitemapMatch = content.match(/Sitemap:\s*(.+)/);
  if (sitemapMatch && !sitemapMatch[1].startsWith('http')) {
    warnings.push({ type: 'warning', message: 'כתובת ה-Sitemap צריכה להתחיל ב-https://' });
  }
  
  return {
    valid: warnings.filter(w => w.type === 'error').length === 0,
    hasHighRisk,
    warnings,
  };
};

const RobotsTxtManager = () => {
  const [content, setContent] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  // Fetch current robots.txt content
  const { data: currentContent, isLoading } = useQuery({
    queryKey: ["robots-txt-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "robots_txt")
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      const robotsContent = (data?.value as { content?: string })?.content || FALLBACK_CONTENT;
      setContent(robotsContent);
      return robotsContent;
    },
  });

  // Fetch history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["robots-txt-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("robots_txt_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as RobotsTxtHistory[];
    },
  });

  // Save mutation
  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["robots-txt-content"], ["robots-txt-history"]],
    successMessage: "robots.txt נשמר בהצלחה",
    errorMessage: (error) => `שגיאה בשמירה: ${error.message}`,
    mutationFn: async (newContent: string, signal) => {
      // First, save current to history
      if (currentContent && currentContent !== newContent) {
        const { error: historyError } = await supabase.from("robots_txt_history").insert({
          content: currentContent,
          note: "גרסה קודמת לפני עדכון",
        }).abortSignal(signal);
        if (historyError) throw historyError;
      }

      // Then update site_settings
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "robots_txt",
          value: { content: newContent },
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" })
        .abortSignal(signal);

      if (error) throw error;
    },
  });

  // Restore mutation
  const restoreMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["robots-txt-content"], ["robots-txt-history"]],
    successMessage: "הגרסה שוחזרה בהצלחה",
    errorMessage: (error) => `שגיאה בשחזור: ${error.message}`,
    mutationFn: async (historyItem: RobotsTxtHistory, signal) => {
      // Save current to history first
      if (currentContent) {
        const { error: historyError } = await supabase.from("robots_txt_history").insert({
          content: currentContent,
          note: "גרסה לפני שחזור",
        }).abortSignal(signal);
        if (historyError) throw historyError;
      }

      // Restore the selected version
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "robots_txt",
          value: { content: historyItem.content },
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" })
        .abortSignal(signal);

      if (error) throw error;
    },
    onSuccess: () => {
      setIsHistoryOpen(false);
    },
  });

  const handleSave = () => {
    const validation = validateRobotsTxt(content);
    if (!validation.valid) {
      toast.error("יש לתקן שגיאות קריטיות לפני השמירה");
      return;
    }
    if (validation.hasHighRisk && !riskAcknowledged) {
      toast.error("יש לאשר את ההבנה של הסיכונים לפני השמירה");
      return;
    }
    saveMutation.mutate(content);
    // Reset acknowledgment after save
    setRiskAcknowledged(false);
  };

  const handleReset = () => {
    setContent(FALLBACK_CONTENT);
    setRiskAcknowledged(false);
  };

  const validation = useMemo(() => validateRobotsTxt(content), [content]);
  
  // Reset risk acknowledgment when content changes and no longer has high risk
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const newValidation = validateRobotsTxt(newContent);
    if (!newValidation.hasHighRisk) {
      setRiskAcknowledged(false);
    }
  };

  // Dynamic sitemap URL for display
  const activeSitemapUrl = DYNAMIC_SITEMAP_URL;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* HIGH RISK Alert - Prominent red warning */}
      {validation.hasHighRisk && (
        <Card className="border-2 border-red-500 bg-red-50 animate-pulse-subtle">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  אזהרת סיכון גבוה - חסימת אינדוקס!
                </h3>
                <p className="text-red-700 mb-4">
                  אתה עומד לחסום את מנועי החיפוש מסריקת האתר כולו. 
                  <strong> זה ישפיע לרעה משמעותית על הדירוג שלך בגוגל ויסיר את האתר מתוצאות החיפוש!</strong>
                </p>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border border-red-200">
                  <Checkbox 
                    id="risk-acknowledge"
                    checked={riskAcknowledged}
                    onCheckedChange={(checked) => setRiskAcknowledged(checked as boolean)}
                    className="border-red-400 data-[state=checked]:bg-red-600"
                  />
                  <Label 
                    htmlFor="risk-acknowledge" 
                    className="text-red-800 font-medium cursor-pointer"
                  >
                    אני מבין/ה את הסיכונים ורוצה להמשיך בכל זאת
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standard Validation Warnings */}
      {validation.warnings.filter(w => w.type !== 'high-risk').length > 0 && (
        <Card className={validation.valid ? "border-yellow-200 bg-yellow-50" : "border-destructive bg-destructive/10"}>
          <CardContent className="pt-4">
            <ul className="space-y-2">
              {validation.warnings.filter(w => w.type !== 'high-risk').map((warning, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {warning.type === 'error' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  {warning.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  {warning.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                  <span className={
                    warning.type === 'error' ? 'text-destructive font-medium' : 
                    warning.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                  }>
                    {warning.message}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Active Sitemap URL Display */}
      <Card className="bg-green-50/50 border-green-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <Label className="text-sm text-green-800 font-medium">כתובת Sitemap פעילה:</Label>
              <div className="font-mono text-sm text-green-700 bg-green-100/50 px-3 py-1.5 rounded mt-1 inline-block" dir="ltr">
                {activeSitemapUrl}
              </div>
            </div>
            <a
              href={activeSitemapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>עריכת robots.txt</span>
            <div className="flex items-center gap-2">
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                צפה בקובץ
              </a>
            </div>
          </CardTitle>
          <CardDescription>
            קובץ זה מנחה את מנועי החיפוש אילו עמודים לסרוק. שינויים משתקפים מיידית.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className={`font-mono text-sm min-h-[300px] direction-ltr text-left ${
              validation.hasHighRisk ? 'border-red-300 focus:border-red-500 bg-red-50/30' : ''
            }`}
            dir="ltr"
            placeholder={FALLBACK_CONTENT}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending || !validation.valid || (validation.hasHighRisk && !riskAcknowledged)}
              className={validation.hasHighRisk && riskAcknowledged ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <Save className="h-4 w-4 ml-2" />
              {validation.hasHighRisk ? 'שמור (סיכון גבוה)' : 'שמור שינויים'}
            </Button>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="h-4 w-4 ml-2" />
                  תצוגה מקדימה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>תצוגה מקדימה - robots.txt</DialogTitle>
                </DialogHeader>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap direction-ltr text-left" dir="ltr">
                  {content || FALLBACK_CONTENT}
                </div>
                {validation.valid && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">הקובץ תקין</span>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="h-4 w-4 ml-2" />
                  היסטוריה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>היסטוריית גרסאות</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[500px] pr-4">
                  {historyLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : history && history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">
                                  {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                                </Badge>
                                {item.note && (
                                  <span className="text-xs text-muted-foreground">{item.note}</span>
                                )}
                              </div>
                              <pre className="text-xs bg-muted p-2 rounded max-h-24 overflow-hidden direction-ltr text-left" dir="ltr">
                                {item.content.substring(0, 200)}...
                              </pre>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <RotateCcw className="h-3 w-3 ml-1" />
                                  שחזר
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>שחזור גרסה</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    פעולה זו תחליף את התוכן הנוכחי בגרסה מתאריך{" "}
                                    {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: he })}.
                                    הגרסה הנוכחית תישמר בהיסטוריה.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row-reverse gap-2">
                                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => restoreMutation.mutate(item)}
                                    disabled={restoreMutation.isPending}
                                  >
                                    שחזר
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>אין היסטוריית גרסאות</p>
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 ml-2" />
              ברירת מחדל
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            מידע חשוב
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>שינויים משתקפים מיידית בכתובת /robots.txt</li>
            <li>במקרה של שגיאה, המערכת מחזירה תוכן ברירת מחדל אוטומטית</li>
            <li>הקובץ נשמר ב-cache למשך שעה (לביצועים)</li>
            <li>כל גרסה נשמרת בהיסטוריה וניתנת לשחזור</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RobotsTxtManager;
