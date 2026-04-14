import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GripVertical, Eye, EyeOff, Save, Upload, X } from "lucide-react";

interface SectionSetting {
  id: string;
  section_key: string;
  section_name: string;
  display_order: number;
  is_visible: boolean;
  padding_top: number;
  padding_bottom: number;
  background_color: string;
  background_opacity: number;
  background_image_url: string | null;
  font_size: number;
}

const SectionDesignManager = () => {
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState<Record<string, Partial<SectionSetting>>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const { data: sections, isLoading } = useQuery({
    queryKey: ["homepage-section-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_section_settings")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as SectionSetting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; data: Partial<SectionSetting> }) => {
      const { error } = await supabase
        .from("homepage_section_settings")
        .update(updates.data)
        .eq("id", updates.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-section-settings"] });
      toast.success("ההגדרות נשמרו בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בשמירת ההגדרות");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedSections: { id: string; display_order: number }[]) => {
      for (const section of orderedSections) {
        const { error } = await supabase
          .from("homepage_section_settings")
          .update({ display_order: section.display_order })
          .eq("id", section.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-section-settings"] });
      toast.success("הסדר עודכן");
    },
  });

  const getValue = (section: SectionSetting, field: keyof SectionSetting) => {
    return editedSettings[section.id]?.[field] ?? section[field];
  };

  const updateField = (sectionId: string, field: keyof SectionSetting, value: any) => {
    setEditedSettings(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value,
      },
    }));
  };

  const handleSave = (section: SectionSetting) => {
    const updates = editedSettings[section.id];
    if (updates) {
      updateMutation.mutate({ id: section.id, data: updates });
      setEditedSettings(prev => {
        const newState = { ...prev };
        delete newState[section.id];
        return newState;
      });
    }
  };

  const handleDragStart = (sectionKey: string) => {
    setDraggedItem(sectionKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetKey: string) => {
    if (!draggedItem || draggedItem === targetKey || !sections) return;

    const newSections = [...sections];
    const draggedIndex = newSections.findIndex(s => s.section_key === draggedItem);
    const targetIndex = newSections.findIndex(s => s.section_key === targetKey);

    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    const orderedSections = newSections.map((s, index) => ({
      id: s.id,
      display_order: index + 1,
    }));

    reorderMutation.mutate(orderedSections);
    setDraggedItem(null);
  };

  const handleImageUpload = async (sectionId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `section-bg-${sectionId}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('catalog-media')
      .upload(fileName, file);
    
    if (uploadError) {
      toast.error("שגיאה בהעלאת התמונה");
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('catalog-media')
      .getPublicUrl(fileName);
    
    updateField(sectionId, 'background_image_url', publicUrl);
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">עיצוב סקציות דף הבית</h2>
        <p className="text-sm text-muted-foreground">גרור כדי לשנות סדר</p>
      </div>

      {sections?.map((section) => (
        <Card
          key={section.id}
          draggable
          onDragStart={() => handleDragStart(section.section_key)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(section.section_key)}
          className={`transition-all ${draggedItem === section.section_key ? 'opacity-50 scale-95' : ''}`}
        >
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <CardTitle className="text-base">{section.section_name}</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getValue(section, 'is_visible') ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={getValue(section, 'is_visible') as boolean}
                    onCheckedChange={(checked) => updateField(section.id, 'is_visible', checked)}
                  />
                </div>
                {editedSettings[section.id] && (
                  <Button size="sm" onClick={() => handleSave(section)}>
                    <Save className="h-4 w-4 ml-1" />
                    שמור
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-4">
            {/* Padding Controls */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm">מרחק עליון: {getValue(section, 'padding_top')}px</Label>
                <Slider
                  value={[getValue(section, 'padding_top') as number]}
                  onValueChange={([value]) => updateField(section.id, 'padding_top', value)}
                  max={80}
                  step={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">מרחק תחתון: {getValue(section, 'padding_bottom')}px</Label>
                <Slider
                  value={[getValue(section, 'padding_bottom') as number]}
                  onValueChange={([value]) => updateField(section.id, 'padding_bottom', value)}
                  max={80}
                  step={4}
                />
              </div>
            </div>

            {/* Font Size Control - only for promo_banner */}
            {section.section_key === 'promo_banner' && (
              <div className="space-y-2">
                <Label className="text-sm">גודל פונט: {getValue(section, 'font_size') || 14}px</Label>
                <Slider
                  value={[(getValue(section, 'font_size') as number) || 14]}
                  onValueChange={([value]) => updateField(section.id, 'font_size', value)}
                  min={10}
                  max={28}
                  step={1}
                />
              </div>
            )}

            {/* Background Controls */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">צבע רקע</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={getValue(section, 'background_color') === 'transparent' ? '#ffffff' : getValue(section, 'background_color') as string}
                    onChange={(e) => updateField(section.id, 'background_color', e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateField(section.id, 'background_color', 'transparent')}
                    className={getValue(section, 'background_color') === 'transparent' ? 'border-primary' : ''}
                  >
                    שקוף
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">שקיפות: {getValue(section, 'background_opacity')}%</Label>
                <Slider
                  value={[getValue(section, 'background_opacity') as number]}
                  onValueChange={([value]) => updateField(section.id, 'background_opacity', value)}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">תמונת רקע</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(section.id, file);
                    }}
                    className="text-xs"
                  />
                  {getValue(section, 'background_image_url') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateField(section.id, 'background_image_url', null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">תצוגה מקדימה חיה</Label>
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                {/* Padding Top Indicator */}
                <div 
                  className="bg-blue-100/50 border-b border-dashed border-blue-300 flex items-center justify-center text-xs text-blue-600"
                  style={{ height: `${Math.max(8, (getValue(section, 'padding_top') as number) / 2)}px` }}
                >
                  {(getValue(section, 'padding_top') as number) > 16 && `${getValue(section, 'padding_top')}px`}
                </div>
                
                {/* Content Area */}
                <div 
                  className="relative min-h-[60px] flex items-center justify-center"
                  style={{
                    backgroundColor: getValue(section, 'background_color') === 'transparent' 
                      ? 'hsl(var(--background))' 
                      : getValue(section, 'background_color') as string,
                    opacity: (getValue(section, 'background_opacity') as number) / 100,
                    backgroundImage: getValue(section, 'background_image_url') 
                      ? `url(${getValue(section, 'background_image_url')})` 
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {section.section_key === 'promo_banner' ? (
                    <span 
                      className="text-center px-4"
                      style={{ 
                        fontSize: `${(getValue(section, 'font_size') as number) || 14}px`,
                        color: getValue(section, 'background_color') === 'transparent' || getValue(section, 'background_color') === '#ffffff' 
                          ? 'hsl(var(--foreground))' 
                          : '#ffffff'
                      }}
                    >
                      טקסט לדוגמה - משלוח חינם בכל הזמנה! 🎁
                    </span>
                  ) : (
                    <div className="text-center px-4">
                      <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                        {section.section_name}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Padding Bottom Indicator */}
                <div 
                  className="bg-blue-100/50 border-t border-dashed border-blue-300 flex items-center justify-center text-xs text-blue-600"
                  style={{ height: `${Math.max(8, (getValue(section, 'padding_bottom') as number) / 2)}px` }}
                >
                  {(getValue(section, 'padding_bottom') as number) > 16 && `${getValue(section, 'padding_bottom')}px`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SectionDesignManager;
