import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOKeywordFeedback from "./SEOKeywordFeedback";

interface AIStoryEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  originalStory: string;
  storyTitle: string;
  onApply: (editedStory: string) => void;
}

const TONE_OPTIONS = [
  { value: "romantic", label: "רומנטי יותר", icon: "💕" },
  { value: "technical", label: "טכני יותר", icon: "⚙️" },
  { value: "luxurious", label: "יוקרתי יותר", icon: "✨" },
  { value: "casual", label: "קליל ונגיש", icon: "🌿" },
];

export const AIStoryEditor = ({
  isOpen,
  onOpenChange,
  originalStory,
  storyTitle,
  onApply,
}: AIStoryEditorProps) => {
  const [tone, setTone] = useState("romantic");
  const [seoOptimize, setSeoOptimize] = useState(true);
  const [customInstruction, setCustomInstruction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("ai-seo", {
        body: {
          type: "edit_story",
          title: storyTitle,
          content: JSON.stringify({
            tone,
            seoOptimize,
            customInstruction,
            originalStory,
          }),
        },
      });

      if (response.error) throw response.error;

      const result = response.data?.result || "";
      if (result) {
        setPreviewContent(result);
        toast.success("הסיפור נערך בהצלחה!");
      } else {
        throw new Error("לא התקבל תוכן");
      }
    } catch (error) {
      console.error("AI edit error:", error);
      toast.error("שגיאה בעריכת הסיפור");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (previewContent) {
      onApply(previewContent);
      onOpenChange(false);
      setPreviewContent("");
      setCustomInstruction("");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setPreviewContent("");
    setCustomInstruction("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            עריכת AI לסיפור: {storyTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Story Preview */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">סיפור מקורי:</Label>
            <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed max-h-32 overflow-y-auto">
              {originalStory || "אין תוכן"}
            </div>
          </div>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label>בחר טון:</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SEO Optimization Toggle */}
          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                אופטימיזציה ל-SEO
              </Label>
              <p className="text-xs text-muted-foreground">
                שילוב טבעי של 50+ מילות מפתח כמו: יהלומי מעבדה, טבעות אירוסין, צורפות עילית
              </p>
            </div>
            <Switch checked={seoOptimize} onCheckedChange={setSeoOptimize} />
          </div>

          {/* Custom Instruction */}
          <div className="space-y-2">
            <Label>הוראה מיוחדת (אופציונלי):</Label>
            <Textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="לדוגמה: הדגש את חשיבות היהלום הטבעי והמסורת המשפחתית..."
              className="min-h-[80px]"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !originalStory}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 ml-2" />
            )}
            {isGenerating ? "מייצר גרסה חדשה..." : "ייצר גרסה חדשה ✨"}
          </Button>

          {/* Preview */}
          {previewContent && (
            <div className="space-y-3 animate-fade-in">
              <Label className="text-primary font-medium">תצוגה מקדימה:</Label>
              <div className="bg-background border-2 border-primary/30 rounded-lg p-4 text-sm leading-relaxed">
                {previewContent}
              </div>
              
              {/* SEO Keyword Feedback */}
              <SEOKeywordFeedback text={previewContent} showDetails />
              
              <div className="flex gap-2">
                <Button onClick={handleApply} className="flex-1">
                  החל שינויים
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
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

export default AIStoryEditor;
