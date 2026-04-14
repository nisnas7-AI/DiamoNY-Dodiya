import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";

interface ProcessStep {
  icon: string;
  step: number;
  title: string;
  description: string;
}

interface SectionContent {
  title?: string;
  subtitle?: string;
  steps?: ProcessStep[];
}

const ICON_OPTIONS = [
  { value: "MessageSquare", label: "💬 הודעה" },
  { value: "Palette", label: "🎨 פלטה" },
  { value: "Gem", label: "💎 יהלום" },
  { value: "Heart", label: "❤️ לב" },
  { value: "Star", label: "⭐ כוכב" },
  { value: "Crown", label: "👑 כתר" },
];

const CustomProcessManager = () => {
  const queryClient = useQueryClient();
  
  const { data: sectionData, isLoading } = useQuery({
    queryKey: ["homepage-section-settings", "custom_process"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_section_settings")
        .select("*")
        .eq("section_key", "custom_process")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state from data
  useState(() => {
    if (sectionData) {
      const content = sectionData.content as SectionContent || {};
      setTitle(sectionData.title || "מהסקיצה ועד התכשיט");
      setSubtitle(sectionData.subtitle || "THE BESPOKE EXPERIENCE");
      setSteps(content.steps || [
        { icon: "MessageSquare", step: 1, title: "פגישת ייעוץ", description: "נפגשים לשיחה אישית" },
        { icon: "Palette", step: 2, title: "עיצוב", description: "מעצבים את התכשיט" },
        { icon: "Gem", step: 3, title: "יצירה", description: "יוצרים את התכשיט" },
      ]);
    }
  });

  // Update state when data loads
  if (sectionData && !hasChanges && steps.length === 0) {
    const content = sectionData.content as SectionContent || {};
    if (content.steps) {
      setSteps(content.steps);
    } else {
      setSteps([
        { icon: "MessageSquare", step: 1, title: "פגישת ייעוץ", description: "נפגשים לשיחה אישית להבנת החזון והדרישות" },
        { icon: "Palette", step: 2, title: "עיצוב", description: "מעצבים את התכשיט המושלם עם הדמיה תלת מימדית" },
        { icon: "Gem", step: 3, title: "יצירה", description: "יוצרים את התכשיט בעבודת יד מקצועית" },
      ]);
    }
    if (sectionData.title) setTitle(sectionData.title);
    if (sectionData.subtitle) setSubtitle(sectionData.subtitle);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("homepage_section_settings")
        .update({
          title,
          subtitle,
          content: JSON.parse(JSON.stringify({ steps })),
        })
        .eq("section_key", "custom_process");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-section-settings"] });
      toast.success("השינויים נשמרו בהצלחה");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("שגיאה בשמירה");
    },
  });

  const updateStep = (index: number, field: keyof ProcessStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
    setHasChanges(true);
  };

  const addStep = () => {
    setSteps([...steps, {
      icon: "Star",
      step: steps.length + 1,
      title: "שלב חדש",
      description: "תיאור השלב",
    }]);
    setHasChanges(true);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      step: i + 1,
    }));
    setSteps(newSteps);
    setHasChanges(true);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;
    
    const newSteps = [...steps];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];
    
    // Update step numbers
    newSteps.forEach((step, i) => step.step = i + 1);
    setSteps(newSteps);
    setHasChanges(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">ניהול סקציית התהליך</h2>
        {hasChanges && (
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 ml-2" />
            שמור שינויים
          </Button>
        )}
      </div>

      {/* Title & Subtitle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">כותרות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>כותרת משנה (אנגלית)</Label>
            <Input
              value={subtitle}
              onChange={(e) => { setSubtitle(e.target.value); setHasChanges(true); }}
              placeholder="THE BESPOKE EXPERIENCE"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>כותרת ראשית</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
              placeholder="מהסקיצה ועד התכשיט"
            />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">שלבי התהליך</h3>
          <Button variant="outline" size="sm" onClick={addStep} disabled={steps.length >= 5}>
            <Plus className="h-4 w-4 ml-1" />
            הוסף שלב
          </Button>
        </div>

        {steps.map((step, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1}
                  >
                    ↓
                  </Button>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>אייקון</Label>
                    <select
                      value={step.icon}
                      onChange={(e) => updateStep(index, 'icon', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>מספר שלב</Label>
                    <Input
                      type="number"
                      value={step.step}
                      onChange={(e) => updateStep(index, 'step', parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת</Label>
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(index, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>תיאור</Label>
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStep(index)}
                  disabled={steps.length <= 2}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomProcessManager;
