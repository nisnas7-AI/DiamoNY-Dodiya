import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Sparkles, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FAQItem {
  question: string;
  answer: string;
}

interface BlogFAQBuilderProps {
  faqItems: FAQItem[];
  onChange: (items: FAQItem[]) => void;
  postTitle?: string;
  postContent?: string;
}

export const BlogFAQBuilder = ({
  faqItems,
  onChange,
  postTitle,
  postContent,
}: BlogFAQBuilderProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addFAQ = () => {
    onChange([...faqItems, { question: "", answer: "" }]);
  };

  const removeFAQ = (index: number) => {
    onChange(faqItems.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqItems];
    updated[index][field] = value;
    onChange(updated);
  };

  const generateFAQsWithAI = async () => {
    if (!postTitle && !postContent) {
      toast.error("נא להוסיף כותרת או תוכן לפני יצירת שאלות");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-seo", {
        body: {
          type: "generate_faq",
          title: postTitle || "",
          content: postContent?.substring(0, 2000) || "",
        },
      });

      if (error) throw error;

      if (data?.result) {
        // Parse the AI response - expecting JSON array
        try {
          let faqs: FAQItem[] = [];
          
          // Try to parse as JSON
          if (typeof data.result === "string") {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = data.result.match(/```json?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : data.result;
            faqs = JSON.parse(jsonStr.trim());
          } else if (Array.isArray(data.result)) {
            faqs = data.result;
          }

          if (faqs.length > 0) {
            onChange([...faqItems, ...faqs]);
            toast.success(`נוצרו ${faqs.length} שאלות נפוצות`);
          }
        } catch (parseError) {
          console.error("Failed to parse FAQ response:", parseError);
          toast.error("שגיאה בפענוח תשובת AI");
        }
      }
    } catch (error: any) {
      console.error("AI FAQ generation error:", error);
      toast.error(error.message || "שגיאה ביצירת שאלות נפוצות");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate JSON-LD schema from FAQ items
  const generateSchema = (): object | null => {
    const validItems = faqItems.filter(
      (item) => item.question.trim() && item.answer.trim()
    );

    if (validItems.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: validItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
  };

  const schema = generateSchema();

  return (
    <Card className="border-gold/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              שאלות נפוצות (FAQ Schema)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-right">
                    <p>שאלות נפוצות עוזרות למנועי חיפוש (Google) ולמנועי AI (ChatGPT, Perplexity) להציג את התוכן שלך כתשובה סמכותית</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              הוסף שאלות ותשובות לאופטימיזציית AEO
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateFAQsWithAI}
            disabled={isGenerating}
            className="border-gold/30 hover:border-gold hover:bg-gold/5"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Sparkles className="h-4 w-4 ml-2" />
            )}
            יצירה אוטומטית
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              אין עדיין שאלות נפוצות
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" size="sm" onClick={addFAQ}>
                <Plus className="h-4 w-4 ml-1" />
                הוסף ידנית
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateFAQsWithAI}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4 ml-1" />
                יצירה אוטומטית
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-muted/30 space-y-3"
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== index) {
                      const newItems = [...faqItems];
                      const [removed] = newItems.splice(draggedIndex, 1);
                      newItems.splice(index, 0, removed);
                      onChange(newItems);
                    }
                    setDraggedIndex(null);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-2 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">
                          שאלה {index + 1}
                        </Label>
                        <Input
                          value={item.question}
                          onChange={(e) => updateFAQ(index, "question", e.target.value)}
                          placeholder="מה היתרון של זהב 18K?"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">תשובה</Label>
                        <Textarea
                          value={item.answer}
                          onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                          placeholder="תשובה מפורטת שתוצג במנועי חיפוש..."
                          className="mt-1 min-h-[80px]"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeFAQ(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addFAQ} className="w-full">
              <Plus className="h-4 w-4 ml-2" />
              הוסף שאלה נוספת
            </Button>
          </>
        )}

        {/* Schema Preview */}
        {schema && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">JSON-LD Schema (נוצר אוטומטית)</Label>
              <Badge variant="secondary" className="text-xs">
                {faqItems.filter(i => i.question && i.answer).length} שאלות
              </Badge>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-[150px] ltr" dir="ltr">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlogFAQBuilder;
