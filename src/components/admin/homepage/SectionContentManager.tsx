import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Loader2, Upload, Eye, Image as ImageIcon, X } from "lucide-react";
import { BrandRichTextEditor } from "@/components/admin/BrandRichTextEditor";
import { processImageForCatalog } from "@/lib/mediaProcessor";

interface SectionContent {
  id: string;
  section_key: string;
  section_name: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any> | null;
  background_image_url: string | null;
}

const MANAGED_SECTIONS = [
  { key: 'categories', name: 'הקולקציות שלנו', description: 'ניהול כותרות ותוכן סקציית הקולקציות' },
  { key: 'featured_products', name: 'מוצרים נבחרים', description: 'ניהול כותרות ותוכן סקציית המוצרים הנבחרים' },
];

const SectionContentManager = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('categories');
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch section settings
  const { data: sections, isLoading } = useQuery({
    queryKey: ["homepage-section-settings-cms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_section_settings")
        .select("*")
        .in("section_key", MANAGED_SECTIONS.map(s => s.key));
      
      if (error) throw error;
      return data as SectionContent[];
    },
  });

  // Local state for editing
  const [editedContent, setEditedContent] = useState<Record<string, Partial<SectionContent>>>({});

  const updateMutation = useMutation({
    mutationFn: async ({ sectionKey, data }: { sectionKey: string; data: Partial<SectionContent> }) => {
      const { error } = await supabase
        .from("homepage_section_settings")
        .update({
          title: data.title,
          subtitle: data.subtitle,
          content: data.content,
          background_image_url: data.background_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("section_key", sectionKey);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-section-settings-cms"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-section-settings"] });
      toast.success("הסקציה עודכנה בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הסקציה");
    },
  });

  const getSection = (key: string) => {
    return sections?.find(s => s.section_key === key);
  };

  const getEditedValue = <T extends keyof SectionContent>(key: string, field: T): SectionContent[T] => {
    const edited = editedContent[key]?.[field];
    if (edited !== undefined) return edited as SectionContent[T];
    
    const section = getSection(key);
    return section?.[field] ?? null as SectionContent[T];
  };

  const updateField = (sectionKey: string, field: keyof SectionContent, value: any) => {
    setEditedContent(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
      },
    }));
  };

  const updateContentField = (sectionKey: string, contentKey: string, value: string) => {
    const currentContent = getEditedValue(sectionKey, 'content') || {};
    updateField(sectionKey, 'content', {
      ...currentContent,
      [contentKey]: value,
    });
  };

  const handleImageUpload = async (sectionKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      // Process and upload
      const processed = await processImageForCatalog(file);
      const fileName = `section-${sectionKey}-${Date.now()}.${processed.format}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, processed.blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      updateField(sectionKey, 'background_image_url', publicUrl);
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (sectionKey: string) => {
    const section = getSection(sectionKey);
    const edited = editedContent[sectionKey];
    
    updateMutation.mutate({
      sectionKey,
      data: {
        title: edited?.title ?? section?.title,
        subtitle: edited?.subtitle ?? section?.subtitle,
        content: edited?.content ?? section?.content,
        background_image_url: edited?.background_image_url ?? section?.background_image_url,
      },
    });
  };

  const clearImage = (sectionKey: string) => {
    updateField(sectionKey, 'background_image_url', null);
    setImagePreview(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          ניהול תוכן סקציות
        </CardTitle>
        <CardDescription>
          ערוך את הכותרות, הטקסטים והתמונות של סקציות עמוד הבית
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="mb-6">
            {MANAGED_SECTIONS.map((section) => (
              <TabsTrigger key={section.key} value={section.key}>
                {section.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {MANAGED_SECTIONS.map((sectionMeta) => (
            <TabsContent key={sectionMeta.key} value={sectionMeta.key}>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">{sectionMeta.description}</p>

                {/* Title and Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>כותרת ראשית</Label>
                    <Input
                      value={getEditedValue(sectionMeta.key, 'title') || ''}
                      onChange={(e) => updateField(sectionMeta.key, 'title', e.target.value)}
                      placeholder="הזן כותרת..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>כותרת משנית</Label>
                    <Input
                      value={getEditedValue(sectionMeta.key, 'subtitle') || ''}
                      onChange={(e) => updateField(sectionMeta.key, 'subtitle', e.target.value)}
                      placeholder="הזן כותרת משנית..."
                    />
                  </div>
                </div>

                {/* Rich Text Description */}
                <div className="space-y-2">
                  <Label>תיאור עשיר (HTML)</Label>
                  <BrandRichTextEditor
                    content={(getEditedValue(sectionMeta.key, 'content') as any)?.description || ''}
                    onChange={(html) => updateContentField(sectionMeta.key, 'description', html)}
                    placeholder="הזן תיאור לסקציה..."
                    minHeight="150px"
                  />
                </div>

                {/* CTA Text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>טקסט כפתור CTA</Label>
                    <Input
                      value={(getEditedValue(sectionMeta.key, 'content') as any)?.cta_text || ''}
                      onChange={(e) => updateContentField(sectionMeta.key, 'cta_text', e.target.value)}
                      placeholder="לכל הקולקציה"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>קישור CTA</Label>
                    <Input
                      value={(getEditedValue(sectionMeta.key, 'content') as any)?.cta_url || '/catalog'}
                      onChange={(e) => updateContentField(sectionMeta.key, 'cta_url', e.target.value)}
                      placeholder="/catalog"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Background Image */}
                <div className="space-y-2">
                  <Label>תמונת רקע (אופציונלי)</Label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(sectionMeta.key, e)}
                        disabled={isUploading}
                      />
                    </div>
                    
                    {(imagePreview || getEditedValue(sectionMeta.key, 'background_image_url')) && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview || getEditedValue(sectionMeta.key, 'background_image_url') || ''}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => clearImage(sectionMeta.key)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => handleSave(sectionMeta.key)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    שמור שינויים
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SectionContentManager;
