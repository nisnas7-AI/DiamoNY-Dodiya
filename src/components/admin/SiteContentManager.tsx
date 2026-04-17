import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, Sparkles, Eye, Edit, FileText, Upload, Image, LayoutTemplate, Link2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";
import { sanitizeOptionalText, sanitizePlainText, upsertSiteContentByKey } from "@/lib/admin-upsert";
import FourCsLinksManager from "./FourCsLinksManager";
import CaseStudyEditor from "./CaseStudyEditor";

interface SiteContent {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  is_active: boolean | null;
  metadata: {
    meta_title?: string;
    meta_description?: string;
    phone?: string;
    image_url?: string;
    cta_text?: string;
    cta_url?: string;
    layout?: "classic" | "editorial";
  } | null;
}

const aboutLayoutOptions = [
  { 
    value: "classic", 
    label: "Classic Split", 
    description: "תצוגה צד-לצד קלאסית עם טיפוגרפיה אלגנטית" 
  },
  { 
    value: "editorial", 
    label: "Editorial Overlap (מומלץ)", 
    description: "תמונה גדולה עם כרטיס טקסט צף שיוצר עומק" 
  },
];

const contentPages = [
  { key: "about", label: "אודותינו", description: "אזור האודות בעמוד הבית" },
  { key: "returns-policy", label: "מדיניות החזרות", description: "עמוד מדיניות החזרות והחלפות" },
  { key: "terms", label: "תקנון ואחריות", description: "עמוד תקנון ומדיניות אחריות" },
  { key: "gold-buying", label: "קונה זהב במזומן", description: "עמוד קניית זהב - תוכן ו-SEO" },
  { key: "gold-buying-popup", label: "פופאפ קניית זהב", description: "תוכן הפופאפ של קניית זהב" },
  { key: "accessibility-statement", label: "הצהרת נגישות", description: "עמוד הצהרת הנגישות של האתר" },
];

const SiteContentManager = () => {
  const [selectedPage, setSelectedPage] = useState<string>(contentPages[0].key);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");
  const [isGeneratingAI, setIsGeneratingAI] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contents, isLoading } = useQuery({
    queryKey: ["site-contents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .in("key", contentPages.map(p => p.key));
      
      if (error) throw error;
      return data as SiteContent[];
    },
  });

  const [formData, setFormData] = useState<Record<string, {
    title: string;
    content: string;
    is_active: boolean;
    meta_title: string;
    meta_description: string;
    phone: string;
    image_url: string;
    cta_text: string;
    cta_url: string;
    layout: "classic" | "editorial";
  }>>({});

  // Initialize form data when contents load
  const getFormData = (key: string) => {
    if (formData[key]) return formData[key];
    
    const content = contents?.find(c => c.key === key);
    return {
      title: content?.title || contentPages.find(p => p.key === key)?.label || "",
      content: content?.content || "",
      is_active: content?.is_active ?? true,
      meta_title: content?.metadata?.meta_title || "",
      meta_description: content?.metadata?.meta_description || "",
      phone: content?.metadata?.phone || "054-6290534",
      image_url: content?.metadata?.image_url || "",
      cta_text: content?.metadata?.cta_text || "לפרטים נוספים",
      cta_url: content?.metadata?.cta_url || "/gold-buying",
      layout: (content?.metadata?.layout as "classic" | "editorial") || "editorial",
    };
  };

  const updateFormData = (key: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...getFormData(key),
        [field]: value,
      }
    }));
  };

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["site-contents"], ["site-content"]],
    successMessage: "התוכן נשמר בהצלחה",
    errorMessage: "שגיאה בשמירת התוכן",
    mutationFn: async ({ key, data }: { key: string; data: any }, signal) => {
      return upsertSiteContentByKey({
        key,
        title: sanitizePlainText(data.title),
        content: sanitizeOptionalText(data.content),
        is_active: Boolean(data.is_active),
        metadata: {
          meta_title: sanitizePlainText(data.meta_title),
          meta_description: sanitizeOptionalText(data.meta_description),
          phone: sanitizePlainText(data.phone),
          image_url: sanitizePlainText(data.image_url),
          cta_text: sanitizePlainText(data.cta_text),
          cta_url: sanitizePlainText(data.cta_url),
          layout: data.layout,
        },
        signal,
      });
    },
  });

  const generateAI = async (type: "meta_title" | "meta_description" | "improve_content") => {
    const data = getFormData(selectedPage);
    if (!data.content && type !== "meta_title") {
      toast.error("יש להזין תוכן לפני יצירת SEO");
      return;
    }

    setIsGeneratingAI(type);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("יש להתחבר מחדש");
        return;
      }

      const response = await supabase.functions.invoke("ai-seo", {
        body: {
          type,
          content: data.content,
          title: data.title,
        },
      });

      if (response.error) throw response.error;

      const result = response.data?.result;
      if (result) {
        if (type === "meta_title") {
          updateFormData(selectedPage, "meta_title", result);
        } else if (type === "meta_description") {
          updateFormData(selectedPage, "meta_description", result);
        } else if (type === "improve_content") {
          updateFormData(selectedPage, "content", result);
        }
        toast.success("התוכן נוצר בהצלחה");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("שגיאה ביצירת התוכן");
    } finally {
      setIsGeneratingAI(null);
    }
  };

  const currentData = getFormData(selectedPage);
  const currentPageInfo = contentPages.find(p => p.key === selectedPage);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <div className="flex flex-wrap gap-2">
        {contentPages.map((page) => (
          <Button
            key={page.key}
            variant={selectedPage === page.key ? "default" : "outline"}
            onClick={() => setSelectedPage(page.key)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {page.label}
          </Button>
        ))}
        <Button
          variant={selectedPage === "link-management" ? "default" : "outline"}
          onClick={() => setSelectedPage("link-management")}
          className="flex items-center gap-2"
        >
          <Link2 className="h-4 w-4" />
          ניהול קישורים
        </Button>
        <Button
          variant={selectedPage === "case-study" ? "default" : "outline"}
          onClick={() => setSelectedPage("case-study")}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          תיאור מקרה
        </Button>
      </div>

      {selectedPage === "link-management" ? (
        <Card dir="rtl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-[hsl(var(--brand-gold,39,58%,56%))]" />
              ניהול קישורים
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">ניהול קישורים פנימיים וחיצוניים באתר</p>
          </CardHeader>
          <CardContent>
            <FourCsLinksManager />
          </CardContent>
        </Card>
      ) : selectedPage === "case-study" ? (
        <CaseStudyEditor />
      ) : (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentPageInfo?.label}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{currentPageInfo?.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={currentData.is_active}
                  onCheckedChange={(checked) => updateFormData(selectedPage, "is_active", checked)}
                />
                <Label>פעיל</Label>
              </div>
              <Button
                onClick={() => saveMutation.mutate({ key: selectedPage, data: currentData })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                שמור
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">תוכן</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">הגדרות</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {/* View Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={viewMode === "edit" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("edit")}
                >
                  <Edit className="h-4 w-4 ml-1" />
                  עריכה
                </Button>
                <Button
                  variant={viewMode === "preview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("preview")}
                >
                  <Eye className="h-4 w-4 ml-1" />
                  תצוגה מקדימה
                </Button>
                <Button
                  variant={viewMode === "split" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("split")}
                >
                  פיצול
                </Button>
              </div>

              <div className={viewMode === "split" ? "grid grid-cols-2 gap-4" : ""}>
                {(viewMode === "edit" || viewMode === "split") && (
                  <div className="space-y-4">
                    <div>
                      <Label>כותרת העמוד</Label>
                      <Input
                        value={currentData.title}
                        onChange={(e) => updateFormData(selectedPage, "title", e.target.value)}
                        placeholder="כותרת העמוד"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>תוכן (Markdown)</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateAI("improve_content")}
                          disabled={isGeneratingAI === "improve_content"}
                        >
                          {isGeneratingAI === "improve_content" ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-1" />
                          ) : (
                            <Sparkles className="h-4 w-4 ml-1" />
                          )}
                          שפר תוכן עם AI
                        </Button>
                      </div>
                      <Textarea
                        value={currentData.content}
                        onChange={(e) => updateFormData(selectedPage, "content", e.target.value)}
                        placeholder="תוכן העמוד בפורמט Markdown"
                        className="min-h-[400px] font-mono text-sm"
                        dir="rtl"
                      />
                    </div>
                  </div>
                )}

                {(viewMode === "preview" || viewMode === "split") && (
                  <div className="border rounded-lg p-6 bg-card min-h-[400px] overflow-auto">
                    <article className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                      <ReactMarkdown>{currentData.content || "*אין תוכן להצגה*"}</ReactMarkdown>
                    </article>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab - available for all pages */}
            <TabsContent value="settings" className="space-y-4">
              {/* Layout Selector for About page */}
              {selectedPage === "about" && (
                <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <LayoutTemplate className="h-5 w-5 text-accent" />
                    <Label className="text-base font-semibold">תבנית עמוד</Label>
                  </div>
                  <Select
                    value={currentData.layout || "editorial"}
                    onValueChange={(value) => updateFormData(selectedPage, "layout", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחר תבנית" />
                    </SelectTrigger>
                    <SelectContent>
                      {aboutLayoutOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedPage === "gold-buying" || selectedPage === "gold-buying-popup") && (
                  <div>
                    <Label>מספר טלפון</Label>
                    <Input
                      value={currentData.phone}
                      onChange={(e) => updateFormData(selectedPage, "phone", e.target.value)}
                      placeholder="054-6290534"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground mt-1">מספר הטלפון ליצירת קשר</p>
                  </div>
                )}
                  <div className="md:col-span-2">
                    <Label>תמונה</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={currentData.image_url}
                        onChange={(e) => updateFormData(selectedPage, "image_url", e.target.value)}
                        placeholder="https://... או העלה תמונה"
                        dir="ltr"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setIsUploadingImage(true);
                          try {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `site-content/${selectedPage}-${Date.now()}.${fileExt}`;
                            
                            const { data, error } = await supabase.storage
                              .from("catalog-media")
                              .upload(fileName, file, { upsert: true });
                            
                            if (error) throw error;
                            
                            const { data: urlData } = supabase.storage
                              .from("catalog-media")
                              .getPublicUrl(data.path);
                            
                            updateFormData(selectedPage, "image_url", urlData.publicUrl);
                            toast.success("התמונה הועלתה בהצלחה");
                          } catch (error) {
                            console.error("Upload error:", error);
                            toast.error("שגיאה בהעלאת התמונה");
                          } finally {
                            setIsUploadingImage(false);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">הזן URL או העלה תמונה מהמחשב</p>
                  </div>
                </div>

                {selectedPage === "gold-buying-popup" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>טקסט כפתור CTA</Label>
                      <Input
                        value={currentData.cta_text}
                        onChange={(e) => updateFormData(selectedPage, "cta_text", e.target.value)}
                        placeholder="לפרטים נוספים"
                      />
                    </div>
                    <div>
                      <Label>קישור כפתור CTA</Label>
                      <Input
                        value={currentData.cta_url}
                        onChange={(e) => updateFormData(selectedPage, "cta_url", e.target.value)}
                        placeholder="/gold-buying"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}

                {currentData.image_url && (
                  <div className="mt-4">
                    <Label>תצוגה מקדימה</Label>
                    <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
                      <img
                        src={currentData.image_url}
                        alt="תצוגה מקדימה"
                        className="w-full h-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Meta Title</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAI("meta_title")}
                    disabled={isGeneratingAI === "meta_title"}
                  >
                    {isGeneratingAI === "meta_title" ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    ) : (
                      <Sparkles className="h-4 w-4 ml-1" />
                    )}
                    צור עם AI
                  </Button>
                </div>
                <Input
                  value={currentData.meta_title}
                  onChange={(e) => updateFormData(selectedPage, "meta_title", e.target.value)}
                  placeholder="כותרת SEO (מומלץ עד 60 תווים)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{currentData.meta_title.length}/60 תווים</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Meta Description</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAI("meta_description")}
                    disabled={isGeneratingAI === "meta_description"}
                  >
                    {isGeneratingAI === "meta_description" ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-1" />
                    ) : (
                      <Sparkles className="h-4 w-4 ml-1" />
                    )}
                    צור עם AI
                  </Button>
                </div>
                <Textarea
                  value={currentData.meta_description}
                  onChange={(e) => updateFormData(selectedPage, "meta_description", e.target.value)}
                  placeholder="תיאור SEO (מומלץ עד 160 תווים)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{currentData.meta_description.length}/160 תווים</p>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">תצוגה מקדימה בגוגל:</p>
                  <div className="bg-background p-4 rounded border">
                    <p className="text-primary text-lg hover:underline cursor-pointer">
                      {currentData.meta_title || currentData.title || "כותרת העמוד"}
                    </p>
                    <p className="text-sm text-green-700">diamony.me/{selectedPage}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentData.meta_description || "תיאור העמוד יופיע כאן..."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}

    </div>
  );
};

export default SiteContentManager;
