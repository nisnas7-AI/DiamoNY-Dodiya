import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, GripVertical, Sparkles, Loader2 } from "lucide-react";

interface TimelineStep {
  day: string;
  action: string;
}

interface SpecItem {
  label: string;
  value: string;
}

interface StoryImage {
  url: string;
  linked_section: "part_1" | "part_2";
}

const CaseStudyEditor = () => {
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState("");
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState("");

  // Editorial fields
  const [specs, setSpecs] = useState<SpecItem[]>([{ label: "", value: "" }]);
  const [pullQuote, setPullQuote] = useState("");
  const [storyPart1, setStoryPart1] = useState("");
  const [storyPart2, setStoryPart2] = useState("");
  const [storyImages, setStoryImages] = useState<StoryImage[]>([]);

  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useQuery({
    queryKey: ["admin-case-study"],
    queryFn: async () => {
      const keys = [
        "case-study-client",
        "case-study-timeline",
        "case-study-result-image",
        "case-study-editorial",
      ];
      const { data, error } = await supabase
        .from("site_content")
        .select("key, content, metadata")
        .in("key", keys);

      if (error) throw error;

      const map: Record<string, { content: string | null; metadata: Record<string, unknown> | null }> = {};
      for (const row of data || []) {
        map[row.key] = { content: row.content, metadata: row.metadata as Record<string, unknown> | null };
      }

      if (!loaded) {
        setClientName(map["case-study-client"]?.content || "");
        const tlMeta = map["case-study-timeline"]?.metadata as { steps?: TimelineStep[] } | null;
        setSteps(tlMeta?.steps || [{ day: "", action: "" }]);
        const imgMeta = map["case-study-result-image"]?.metadata as { image_url?: string } | null;
        setResultImageUrl(imgMeta?.image_url || "");

        // Editorial
        const ed = map["case-study-editorial"]?.metadata as {
          specs?: SpecItem[];
          pull_quote?: string;
          story_part_1?: string;
          story_part_2?: string;
          story_images?: StoryImage[];
        } | null;
        if (ed) {
          setSpecs(ed.specs?.length ? ed.specs : [{ label: "", value: "" }]);
          setPullQuote(ed.pull_quote || "");
          setStoryPart1(ed.story_part_1 || "");
          setStoryPart2(ed.story_part_2 || "");
          setStoryImages(ed.story_images || []);
        }
        setLoaded(true);
      }

      return map;
    },
  });

  // Timeline helpers
  const addStep = () => setSteps((s) => [...s, { day: "", action: "" }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof TimelineStep, v: string) =>
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, [field]: v } : step)));

  // Spec helpers
  const addSpec = () => setSpecs((s) => [...s, { label: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: keyof SpecItem, v: string) =>
    setSpecs((s) => s.map((item, idx) => (idx === i ? { ...item, [field]: v } : item)));

  // Image helpers
  const addImage = () => setStoryImages((s) => [...s, { url: "", linked_section: "part_1" }]);
  const removeImage = (i: number) => setStoryImages((s) => s.filter((_, idx) => idx !== i));
  const updateImage = (i: number, field: keyof StoryImage, v: string) =>
    setStoryImages((s) => s.map((img, idx) => (idx === i ? { ...img, [field]: v } : img)));

  // AI Edit
  const handleAIEdit = async () => {
    const combined = [storyPart1, storyPart2].filter(Boolean).join("\n\n");
    if (!combined.trim()) {
      toast.error("יש למלא לפחות חלק אחד מהסיפור לפני שכתוב AI");
      return;
    }
    setAiGenerating(true);
    try {
      const response = await supabase.functions.invoke("ai-seo", {
        body: {
          type: "edit_story",
          content: combined,
          context: `Luxury jewelry case study for ${clientName || "a bespoke client"}. Rewrite in a luxurious, editorial marketing tone optimized for SEO. Return as two paragraphs separated by a blank line.`,
        },
      });

      if (response.error) throw response.error;

      const result = response.data?.result || response.data?.content || "";
      if (result) {
        const parts = result.split(/\n\n+/);
        setStoryPart1(parts[0]?.trim() || storyPart1);
        if (parts.length > 1) setStoryPart2(parts.slice(1).join("\n\n").trim());
        toast.success("הסיפור שוכתב בהצלחה בטון שיווקי יוקרתי");
      }
    } catch (err) {
      console.error("AI rewrite error:", err);
      toast.error("שגיאה בשכתוב AI");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upserts = [
        { key: "case-study-client", title: "Case Study - Client", content: clientName, metadata: {} },
        { key: "case-study-timeline", title: "Case Study - Timeline", content: "", metadata: { steps: steps.filter((s) => s.day || s.action) } },
        { key: "case-study-result-image", title: "Case Study - Result Image", content: "", metadata: { image_url: resultImageUrl } },
        {
          key: "case-study-editorial",
          title: "Case Study - Editorial",
          content: "",
          metadata: {
            specs: specs.filter((s) => s.label || s.value),
            pull_quote: pullQuote,
            story_part_1: storyPart1,
            story_part_2: storyPart2,
            story_images: storyImages.filter((img) => img.url),
          },
        },
      ];

      for (const row of upserts) {
        const { error } = await supabase
          .from("site_content")
          .upsert([{ key: row.key, title: row.title, content: row.content, metadata: JSON.parse(JSON.stringify(row.metadata)) }], { onConflict: "key" });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["case-study-data"] });
      queryClient.invalidateQueries({ queryKey: ["admin-case-study"] });
      toast.success("תיאור המקרה נשמר בהצלחה");
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשמירת תיאור המקרה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          📋 עריכת תיאור מקרה (Case Study)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Client Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">שם / תיאור הלקוח</label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="לקוחה מתל-אביב, טבעת אירוסין..." />
        </div>

        {/* ── EDITORIAL SECTION ── */}
        <div className="border border-accent/30 rounded-xl p-5 space-y-6 bg-accent/5">
          <h3 className="font-heading text-base font-semibold text-foreground">✨ סיפור אדיטוריאלי</h3>

          {/* Specs */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">מפרט (Specs)</label>
            <div className="space-y-2">
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={spec.label} onChange={(e) => updateSpec(i, "label", e.target.value)} placeholder="סוג זהב" className="w-32 flex-shrink-0" />
                  <Input value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="18K Solid Gold" className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeSpec(i)} disabled={specs.length <= 1}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addSpec} className="mt-2"><Plus className="w-4 h-4 ml-1" />הוסף מפרט</Button>
          </div>

          {/* Story Part 1 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">סיפור – חלק 1</label>
            <Textarea value={storyPart1} onChange={(e) => setStoryPart1(e.target.value)} placeholder="תארו את ההשראה, הרקע והחזון של הלקוח..." rows={5} />
          </div>

          {/* Pull Quote */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">ציטוט מרכזי (Pull-Quote)</label>
            <Input value={pullQuote} onChange={(e) => setPullQuote(e.target.value)} placeholder="&quot;מסע בוטיק מחזון גולמי לאלגנטיות נצחית&quot;" />
          </div>

          {/* Story Part 2 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">סיפור – חלק 2</label>
            <Textarea value={storyPart2} onChange={(e) => setStoryPart2(e.target.value)} placeholder="תארו את תהליך היצירה, האומנות והתוצאה..." rows={5} />
          </div>

          {/* Story Images */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">תמונות לסיפור</label>
            <div className="space-y-2">
              {storyImages.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={img.url} onChange={(e) => updateImage(i, "url", e.target.value)} placeholder="https://..." dir="ltr" className="flex-1" />
                  <select
                    value={img.linked_section}
                    onChange={(e) => updateImage(i, "linked_section", e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="part_1">חלק 1</option>
                    <option value="part_2">חלק 2</option>
                  </select>
                  <Button variant="ghost" size="icon" onClick={() => removeImage(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addImage} className="mt-2"><Plus className="w-4 h-4 ml-1" />הוסף תמונה</Button>
          </div>

          {/* AI Edit Button */}
          <Button
            variant="outline"
            className="w-full bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700"
            onClick={handleAIEdit}
            disabled={aiGenerating || (!storyPart1 && !storyPart2)}
          >
            {aiGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
            {aiGenerating ? "משכתב בטון יוקרתי..." : "✨ שכתוב AI — טון שיווקי יוקרתי"}
          </Button>
        </div>

        {/* ── TIMELINE ── */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">שלבי ציר הזמן</label>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 flex-shrink-0" />
                <Input value={step.day} onChange={(e) => updateStep(i, "day", e.target.value)} placeholder={`יום ${i + 1}`} className="w-24 flex-shrink-0" />
                <Input value={step.action} onChange={(e) => updateStep(i, "action", e.target.value)} placeholder="תיאור הפעולה..." className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => removeStep(i)} disabled={steps.length <= 1}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addStep} className="mt-3"><Plus className="w-4 h-4 ml-1" />הוסף שלב</Button>
        </div>

        {/* Result Image */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">תמונת התוצאה הסופית (URL)</label>
          <Input value={resultImageUrl} onChange={(e) => setResultImageUrl(e.target.value)} placeholder="https://..." dir="ltr" />
          {resultImageUrl && <img src={resultImageUrl} alt="תצוגה מקדימה" className="mt-3 max-w-xs rounded-lg border border-border" />}
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 ml-2" />
          {saving ? "שומר..." : "שמור תיאור מקרה"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CaseStudyEditor;
