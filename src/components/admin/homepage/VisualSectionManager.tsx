import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, Upload, Image as ImageIcon, X, Eye, RefreshCw, Camera, Sparkles } from "lucide-react";
import { BrandRichTextEditor } from "@/components/admin/BrandRichTextEditor";
import { processImageForCatalog } from "@/lib/mediaProcessor";
import { sanitizeHtml } from "@/lib/sanitize";

interface SectionContent {
  id: string;
  section_key: string;
  section_name: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any> | null;
  background_image_url: string | null;
  padding_top: number | null;
  padding_bottom: number | null;
  background_color: string | null;
}

interface HomepageCategory {
  id: string;
  name: string;
  name_en: string | null;
  image_url: string | null;
  link_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

const VisualSectionManager = () => {
  const queryClient = useQueryClient();
  const [editedSections, setEditedSections] = useState<Record<string, Partial<SectionContent>>>({});
  const [editedCategories, setEditedCategories] = useState<Record<string, Partial<HomepageCategory>>>({});
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch section settings
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["visual-section-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_section_settings")
        .select("*")
        .in("section_key", ["categories", "featured_products"]);
      
      if (error) throw error;
      return data as SectionContent[];
    },
  });

  // Fetch homepage categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["visual-homepage-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data as HomepageCategory[];
    },
  });

  // Save all changes mutation
  const saveAllMutation = useMutation({
    mutationFn: async () => {
      // Save section changes
      for (const [sectionKey, data] of Object.entries(editedSections)) {
        const section = sections?.find(s => s.section_key === sectionKey);
        if (section) {
          const { error } = await supabase
            .from("homepage_section_settings")
            .update({
              title: data.title ?? section.title,
              subtitle: data.subtitle ?? section.subtitle,
              content: data.content ?? section.content,
              background_image_url: data.background_image_url ?? section.background_image_url,
              updated_at: new Date().toISOString(),
            })
            .eq("section_key", sectionKey);
          
          if (error) throw error;
        }
      }

      // Save category changes
      for (const [categoryId, data] of Object.entries(editedCategories)) {
        const { error } = await supabase
          .from("homepage_categories")
          .update({
            name: data.name,
            image_url: data.image_url,
            link_url: data.link_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", categoryId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visual-section-settings"] });
      queryClient.invalidateQueries({ queryKey: ["visual-homepage-categories"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-section-settings"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-categories"] });
      setEditedSections({});
      setEditedCategories({});
      setHasChanges(false);
      toast.success("כל השינויים נשמרו בהצלחה!");
    },
    onError: () => {
      toast.error("שגיאה בשמירת השינויים");
    },
  });

  const getSection = (key: string) => sections?.find(s => s.section_key === key);
  
  const getSectionValue = <T extends keyof SectionContent>(key: string, field: T): SectionContent[T] => {
    const edited = editedSections[key]?.[field];
    if (edited !== undefined) return edited as SectionContent[T];
    const section = getSection(key);
    return section?.[field] ?? null as SectionContent[T];
  };

  const getCategoryValue = <T extends keyof HomepageCategory>(id: string, field: T): HomepageCategory[T] | undefined => {
    const edited = editedCategories[id]?.[field];
    if (edited !== undefined) return edited as HomepageCategory[T];
    const category = categories?.find(c => c.id === id);
    return category?.[field];
  };

  const updateSection = (sectionKey: string, field: keyof SectionContent, value: any) => {
    setEditedSections(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [field]: value },
    }));
    setHasChanges(true);
  };

  const updateSectionContent = (sectionKey: string, contentKey: string, value: string) => {
    const currentContent = getSectionValue(sectionKey, 'content') || {};
    updateSection(sectionKey, 'content', { ...currentContent, [contentKey]: value });
  };

  const updateCategory = (categoryId: string, field: keyof HomepageCategory, value: any) => {
    setEditedCategories(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleCategoryImageUpload = async (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategory(categoryId);
    try {
      const processed = await processImageForCatalog(file);
      const fileName = `category-${categoryId}-${Date.now()}.${processed.format}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, processed.blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      updateCategory(categoryId, 'image_url', publicUrl);
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingCategory(null);
    }
  };

  const triggerFileInput = (refKey: string) => {
    fileInputRefs.current[refKey]?.click();
  };

  const isLoading = sectionsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Central Save Button - Fixed at top */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">מראה ויזואלית - עמוד הבית</h2>
              <p className="text-sm text-muted-foreground">ערוך את הסקציות כפי שהן מופיעות באתר</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                יש שינויים שלא נשמרו
              </span>
            )}
            <Button
              onClick={() => saveAllMutation.mutate()}
              disabled={saveAllMutation.isPending || !hasChanges}
              size="lg"
              className="gap-2"
            >
              {saveAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              עדכן אתר
            </Button>
          </div>
        </div>
      </div>

      {/* Section: Our Collections - Visual Mirror */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-[#F9F9F9] border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="w-3 h-3 rounded-full bg-[#856404]" />
            הקולקציות שלנו
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-[#F9F9F9]">
          {/* Section Header Editor */}
          <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">כותרת ראשית</Label>
                <Input
                  value={getSectionValue('categories', 'title') || ''}
                  onChange={(e) => updateSection('categories', 'title', e.target.value)}
                  placeholder="הקולקציות שלנו"
                  className="text-lg font-serif"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">כותרת משנית</Label>
                <Input
                  value={getSectionValue('categories', 'subtitle') || ''}
                  onChange={(e) => updateSection('categories', 'subtitle', e.target.value)}
                  placeholder="גלו את הקולקציות הייחודיות שלנו"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">תיאור (טקסט עשיר)</Label>
              <BrandRichTextEditor
                content={(getSectionValue('categories', 'content') as any)?.description || ''}
                onChange={(html) => updateSectionContent('categories', 'description', html)}
                placeholder="תיאור הסקציה..."
                minHeight="100px"
              />
            </div>
          </div>

          {/* Categories Grid - Visual Mirror */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map((category) => (
              <div
                key={category.id}
                className="group relative bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Category Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  <img
                    src={getCategoryValue(category.id, 'image_url') || '/placeholder.svg'}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Glassmorphism Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Upload Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
                    <input
                      ref={(el) => { fileInputRefs.current[`cat-${category.id}`] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCategoryImageUpload(category.id, e)}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => triggerFileInput(`cat-${category.id}`)}
                      disabled={uploadingCategory === category.id}
                    >
                      {uploadingCategory === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      החלף תמונה
                    </Button>
                  </div>
                  
                  {/* Category Name Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <div className="backdrop-blur-md bg-white/20 rounded-lg p-2 border border-white/30 space-y-2">
                      <Input
                        value={getCategoryValue(category.id, 'name') || ''}
                        onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                        className="bg-transparent border-0 text-white text-center font-medium text-sm placeholder:text-white/70 focus-visible:ring-0"
                        placeholder="שם הקטגוריה"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Link URL Editor - Below image */}
                <div className="p-3 border-t">
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    קישור קטגוריה (URL)
                  </Label>
                  <Input
                    value={getCategoryValue(category.id, 'link_url') || '/catalog'}
                    onChange={(e) => updateCategory(category.id, 'link_url', e.target.value)}
                    placeholder="/catalog/rings"
                    className="text-xs h-8"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    דוגמה: /catalog/rings או /catalog/earrings
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section: Featured Products - Visual Mirror */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-[#121212] border-b border-white/10">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
            מוצרים נבחרים
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-[#121212]">
          {/* Section Header Editor */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/60">כותרת ראשית</Label>
                <Input
                  value={getSectionValue('featured_products', 'title') || ''}
                  onChange={(e) => updateSection('featured_products', 'title', e.target.value)}
                  placeholder="מוצרים נבחרים"
                  className="bg-white/10 border-white/20 text-white text-lg font-serif placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/60">כותרת משנית</Label>
                <Input
                  value={getSectionValue('featured_products', 'subtitle') || ''}
                  onChange={(e) => updateSection('featured_products', 'subtitle', e.target.value)}
                  placeholder="התכשיטים הנבחרים שלנו"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-white/60">תיאור (טקסט עשיר)</Label>
              <div className="bg-white rounded-lg">
                <BrandRichTextEditor
                  content={(getSectionValue('featured_products', 'content') as any)?.description || ''}
                  onChange={(html) => updateSectionContent('featured_products', 'description', html)}
                  placeholder="תיאור הסקציה..."
                  minHeight="100px"
                />
              </div>
            </div>
          </div>

          {/* Featured Products Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30"
              >
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">מוצר {i}</span>
                  <p className="text-xs text-white/20 mt-1">נטען מהקטלוג</p>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-white/40 text-sm mt-4">
            * המוצרים הנבחרים נטענים אוטומטית מהקטלוג לפי סימון "מוצר מומלץ"
          </p>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => saveAllMutation.mutate()}
          disabled={saveAllMutation.isPending || !hasChanges}
          size="lg"
          className="gap-2 px-8"
        >
          {saveAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          עדכן אתר
        </Button>
      </div>
    </div>
  );
};

export default VisualSectionManager;
