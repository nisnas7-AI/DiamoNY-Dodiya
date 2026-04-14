import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Wand2, TrendingUp, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  analyzeKeywordPresence, 
  getSuggestedKeywords,
  generateSEOPromptInjection,
  BRAND_POWER_WORDS 
} from "@/lib/seoKeywords";
import SEOKeywordFeedback from "./SEOKeywordFeedback";

interface SEOOptimizerToolProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  originalText: string;
  contentTitle: string;
  categorySlug?: string;
  onApply: (optimizedText: string) => void;
}

export const SEOOptimizerTool = ({
  isOpen,
  onOpenChange,
  originalText,
  contentTitle,
  categorySlug,
  onApply,
}: SEOOptimizerToolProps) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState("");
  const [integratedKeywords, setIntegratedKeywords] = useState<string[]>([]);
  
  const originalAnalysis = analyzeKeywordPresence(originalText);
  const optimizedAnalysis = optimizedText ? analyzeKeywordPresence(optimizedText) : null;
  const suggestedKeywords = getSuggestedKeywords(originalText, categorySlug, 8);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const seoInjection = generateSEOPromptInjection(categorySlug);
      
      const response = await supabase.functions.invoke("ai-seo", {
        body: {
          type: "seo_optimize",
          title: contentTitle,
          content: JSON.stringify({
            originalText,
            suggestedKeywords,
            seoInjection,
          }),
        },
      });

      if (response.error) throw response.error;

      const result = response.data?.result || "";
      if (result) {
        setOptimizedText(result);
        
        // Find which new keywords were integrated
        const newAnalysis = analyzeKeywordPresence(result);
        const newKeywords = newAnalysis.found.filter(
          kw => !originalAnalysis.found.includes(kw)
        );
        const newPowerWords = newAnalysis.powerWordsFound.filter(
          pw => !originalAnalysis.powerWordsFound.includes(pw)
        );
        
        setIntegratedKeywords([...newKeywords, ...newPowerWords]);
        toast.success("הטקסט עבר אופטימיזציה ל-SEO!");
      } else {
        throw new Error("לא התקבלה תשובה מה-AI");
      }
    } catch (error) {
      console.error("SEO optimization error:", error);
      toast.error("שגיאה באופטימיזציה");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = () => {
    if (optimizedText) {
      onApply(optimizedText);
      onOpenChange(false);
      setOptimizedText("");
      setIntegratedKeywords([]);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setOptimizedText("");
    setIntegratedKeywords([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            אופטימיזציה ל-SEO: {contentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Text Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">טקסט מקורי:</Label>
            <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed max-h-32 overflow-y-auto">
              {originalText || "אין תוכן"}
            </div>
            <SEOKeywordFeedback text={originalText} showDetails={false} compact />
          </div>

          {/* Suggested Keywords */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              מילות מפתח מומלצות לשילוב:
            </Label>
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map((kw, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-sm bg-amber-50 border-amber-200 text-amber-700"
                >
                  {kw}
                </Badge>
              ))}
            </div>
          </div>

          {/* Power Words Reminder */}
          <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
            <Label className="flex items-center gap-2 text-violet-700 text-sm">
              <Wand2 className="h-4 w-4" />
              מילות כוח של המותג (חובה לשלב):
            </Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {BRAND_POWER_WORDS.slice(0, 6).map((pw, idx) => (
                <Badge 
                  key={idx} 
                  className="text-xs bg-violet-100 text-violet-700 border-violet-300"
                >
                  ✨ {pw}
                </Badge>
              ))}
            </div>
          </div>

          {/* Optimize Button */}
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || !originalText}
            className="w-full bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700"
            size="lg"
          >
            {isOptimizing ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4 ml-2" />
            )}
            {isOptimizing ? "מבצע אופטימיזציה..." : "בצע אופטימיזציה ל-SEO 🚀"}
          </Button>

          {/* Optimized Result */}
          {optimizedText && (
            <div className="space-y-4 animate-fade-in">
              {/* Integrated Keywords Highlight */}
              {integratedKeywords.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    מילות מפתח שנוספו:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {integratedKeywords.map((kw, idx) => (
                      <Badge 
                        key={idx} 
                        className="text-xs bg-green-100 text-green-700 border-green-300"
                      >
                        ✅ {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <Label className="text-primary font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                טקסט מאופטם:
              </Label>
              
              <Textarea
                value={optimizedText}
                onChange={(e) => setOptimizedText(e.target.value)}
                className="min-h-[150px] bg-background border-2 border-primary/30"
              />
              
              {/* SEO Score Comparison */}
              {optimizedAnalysis && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div className="text-sm">
                    <span className="text-muted-foreground">ציון SEO לפני: </span>
                    <span className="font-bold">{originalAnalysis.score}%</span>
                  </div>
                  <div className="text-xl">→</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">ציון SEO אחרי: </span>
                    <span className="font-bold text-green-600">{optimizedAnalysis.score}%</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    +{optimizedAnalysis.score - originalAnalysis.score}%
                  </Badge>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleApply} className="flex-1">
                  החל שינויים
                </Button>
                <Button variant="outline" onClick={handleOptimize} disabled={isOptimizing}>
                  נסה שוב
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SEOOptimizerTool;
