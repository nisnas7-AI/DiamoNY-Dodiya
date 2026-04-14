import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Upload, Loader2, GripVertical } from "lucide-react";

interface HomepageCategory {
  id: string;
  name: string;
  name_en: string | null;
  image_url: string | null;
  link_url: string | null;
  category_slug: string | null;
  display_order: number;
  is_active: boolean;
}

const HomepageCategoriesManager = () => {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data as HomepageCategory[];
    },
  });

  const [editedCategories, setEditedCategories] = useState<Record<string, Partial<HomepageCategory>>>({});

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HomepageCategory> }) => {
      const { error } = await supabase
        .from("homepage_categories")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-categories"] });
      toast.success("הקטגוריה עודכנה בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הקטגוריה");
    },
  });

  const handleImageUpload = async (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(categoryId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `category-${categoryId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      setEditedCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], image_url: publicUrl },
      }));
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    const edited = editedCategories[categoryId];
    if (!category) return;

    updateMutation.mutate({
      id: categoryId,
      data: {
        name: edited?.name ?? category.name,
        name_en: edited?.name_en ?? category.name_en,
        image_url: edited?.image_url ?? category.image_url,
        link_url: edited?.link_url ?? category.link_url,
      },
    });
  };

  const getCategoryValue = (category: HomepageCategory, field: keyof HomepageCategory) => {
    return editedCategories[category.id]?.[field] ?? category[field];
  };

  const updateCategoryField = (categoryId: string, field: keyof HomepageCategory, value: string) => {
    setEditedCategories(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        ערוך את הקטגוריות המוצגות בעמוד הבית. שנה שמות, תמונות וקישורים.
      </p>

      {categories?.map((category) => (
        <Card key={category.id}>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex items-center text-muted-foreground">
                <GripVertical className="h-5 w-5" />
              </div>

              <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {getCategoryValue(category, "image_url") ? (
                  <img
                    src={getCategoryValue(category, "image_url") as string}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    אין תמונה
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <Label>שם הקטגוריה (עברית)</Label>
                  <Input
                    value={getCategoryValue(category, "name") as string}
                    onChange={(e) => updateCategoryField(category.id, "name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>שם הקטגוריה (אנגלית)</Label>
                  <Input
                    value={(getCategoryValue(category, "name_en") as string) || ""}
                    onChange={(e) => updateCategoryField(category.id, "name_en", e.target.value)}
                  />
                </div>
                <div>
                  <Label>קישור</Label>
                  <Input
                    value={(getCategoryValue(category, "link_url") as string) || "/catalog"}
                    onChange={(e) => updateCategoryField(category.id, "link_url", e.target.value)}
                  />
                </div>
                <div>
                  <Label>תמונה חדשה</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(category.id, e)}
                    disabled={uploadingId === category.id}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <Button
                  size="sm"
                  onClick={() => handleSave(category.id)}
                  disabled={updateMutation.isPending}
                >
                  {uploadingId === category.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HomepageCategoriesManager;
