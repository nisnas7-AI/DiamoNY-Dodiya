import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Upload, Loader2, Sparkles, Image as ImageIcon, GripVertical, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SpecItem {
  label: string;
  value: string;
}

export interface StoryImage {
  url: string;
  alt_text: string;
  linked_section: "part1" | "part2" | "general";
}

export interface StructuredStoryData {
  specs: SpecItem[];
  pull_quote: string;
  story_part_1: string;
  story_part_2: string;
  story_images: StoryImage[];
}

interface StoryStructuredEditorProps {
  data: StructuredStoryData;
  onChange: (data: StructuredStoryData) => void;
  onAIRewrite: () => void;
  isAIGenerating?: boolean;
}

const DEFAULT_SPEC_LABELS = [
  "סוג זהב",
  "חיתוך יהלום",
  "צבע יהלום",
  "בהירות יהלום",
  "משקל קראט",
  "סוג אבן",
];

const StoryStructuredEditor = ({ data, onChange, onAIRewrite, isAIGenerating }: StoryStructuredEditorProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof StructuredStoryData>(key: K, value: StructuredStoryData[K]) => {
    onChange({ ...data, [key]: value });
  };

  // --- Specs ---
  const addSpec = () => {
    const nextLabel = DEFAULT_SPEC_LABELS.find(
      (l) => !data.specs.some((s) => s.label === l)
    ) || "";
    updateField("specs", [...data.specs, { label: nextLabel, value: "" }]);
  };

  const updateSpec = (index: number, field: keyof SpecItem, val: string) => {
    const updated = [...data.specs];
    updated[index] = { ...updated[index], [field]: val };
    updateField("specs", updated);
  };

  const removeSpec = (index: number) => {
    updateField("specs", data.specs.filter((_, i) => i !== index));
  };

  // --- Images ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: StoryImage[] = [];
      for (const file of Array.from(files).slice(0, 5 - data.story_images.length)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `story-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("catalog-media")
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("catalog-media")
          .getPublicUrl(path);

        newImages.push({
          url: publicData.publicUrl,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          linked_section: "general",
        });
      }
      updateField("story_images", [...data.story_images, ...newImages]);
      toast.success(`${newImages.length} תמונות הועלו`);
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בהעלאת תמונה");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    updateField("story_images", data.story_images.filter((_, i) => i !== index));
  };

  const updateImageSection = (index: number, section: StoryImage["linked_section"]) => {
    const updated = [...data.story_images];
    updated[index] = { ...updated[index], linked_section: section };
    updateField("story_images", updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. Specs List Editor */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            מפרט טכני (Specs)
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            <Plus className="h-3.5 w-3.5 ml-1" />
            הוסף מפרט
          </Button>
        </div>
        {data.specs.length === 0 && (
          <p className="text-xs text-muted-foreground">לחץ על "הוסף מפרט" כדי להתחיל</p>
        )}
        <div className="space-y-2">
          {data.specs.map((spec, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={spec.label}
                onChange={(e) => updateSpec(i, "label", e.target.value)}
                placeholder="שם המפרט (לדוג׳ סוג זהב)"
                className="flex-1 text-sm"
              />
              <Input
                value={spec.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
                placeholder="ערך (לדוג׳ 14K לבן)"
                className="flex-1 text-sm"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(i)} className="shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Pull-Quote */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Quote className="h-4 w-4 text-muted-foreground" />
          ציטוט מרכזי (Pull-Quote)
        </Label>
        <Input
          value={data.pull_quote}
          onChange={(e) => updateField("pull_quote", e.target.value)}
          placeholder="משפט שיווקי בולט שיוצג כציטוט מודגש בעמוד המוצר..."
          className="text-sm font-medium"
        />
      </div>

      {/* 3. Story Part 1 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">סיפור – חלק ראשון</Label>
        <Textarea
          value={data.story_part_1}
          onChange={(e) => updateField("story_part_1", e.target.value)}
          placeholder="הפסקה הראשונה של סיפור המוצר. השתמש ב-{{product_name}} להחלפה אוטומטית..."
          className="min-h-[120px] text-sm leading-relaxed"
        />
      </div>

      {/* 4. Story Part 2 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">סיפור – חלק שני</Label>
        <Textarea
          value={data.story_part_2}
          onChange={(e) => updateField("story_part_2", e.target.value)}
          placeholder="הפסקה השנייה של סיפור המוצר. ניתן להשאיר ריק אם לא נדרש..."
          className="min-h-[120px] text-sm leading-relaxed"
        />
      </div>

      {/* AI Edit Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700"
        onClick={onAIRewrite}
        disabled={isAIGenerating || (!data.story_part_1 && !data.story_part_2)}
      >
        {isAIGenerating ? (
          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 ml-2" />
        )}
        {isAIGenerating ? "משכתב בטון יוקרתי..." : "AI Edit – שכתוב יוקרתי + SEO ✨"}
      </Button>

      {/* 5. Story Images */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          תמונות סיפור
        </Label>
        <p className="text-xs text-muted-foreground">
          העלה תמונות וקשר אותן לחלק ספציפי בסיפור
        </p>

        {data.story_images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {data.story_images.map((img, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <img src={img.url} alt={img.alt_text} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 left-1 h-6 w-6"
                    onClick={() => removeImage(i)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <CardContent className="p-2 space-y-1">
                  <select
                    value={img.linked_section}
                    onChange={(e) => updateImageSection(i, e.target.value as StoryImage["linked_section"])}
                    className="w-full text-xs border rounded px-2 py-1 bg-background"
                  >
                    <option value="general">כללי</option>
                    <option value="part1">חלק ראשון</option>
                    <option value="part2">חלק שני</option>
                  </select>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || data.story_images.length >= 5}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 ml-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 ml-1" />
            )}
            {uploading ? "מעלה..." : "העלה תמונות"}
          </Button>
          <span className="text-xs text-muted-foreground mr-2">
            {data.story_images.length}/5 תמונות
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground border-t pt-3">
        💡 טיפ: השתמש ב-<code className="bg-muted px-1 rounded">{"{{product_name}}"}</code> בשדות הסיפור – יוחלף אוטומטית בשם המוצר
      </p>
    </div>
  );
};

export default StoryStructuredEditor;
