import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, FolderOpen, GripVertical, ChevronLeft, Upload, X, Image, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Category {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  is_hidden: boolean;
  is_updating_soon: boolean;
  display_order: number;
  parent_id: string | null;
  mto_story: string | null;
}

const CategoryManager = () => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    slug: "",
    description: "",
    image_url: "",
    is_active: true,
    is_hidden: false,
    is_updating_soon: false,
    parent_id: "",
    mto_story: "",
  });
  const queryClient = useQueryClient();

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('catalog-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('catalog-media')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהעלאת התמונה");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");
      const { error } = await supabase.from("categories").insert({
        name: data.name,
        name_en: data.name_en || null,
        slug,
        description: data.description || null,
        image_url: data.image_url || null,
        is_active: data.is_active,
        is_hidden: data.is_hidden,
        is_updating_soon: data.is_updating_soon,
        display_order: (categories?.length || 0) + 1,
        parent_id: data.parent_id || null,
        mto_story: data.mto_story || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("הקטגוריה נוצרה בהצלחה");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה ביצירת הקטגוריה");
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("categories")
        .update({
          name: data.name,
          name_en: data.name_en || null,
          slug: data.slug,
          description: data.description || null,
          image_url: data.image_url || null,
          is_active: data.is_active,
          is_hidden: data.is_hidden,
          is_updating_soon: data.is_updating_soon,
          parent_id: data.parent_id || null,
          mto_story: data.mto_story || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("הקטגוריה עודכנה בהצלחה");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בעדכון הקטגוריה");
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("הקטגוריה נמחקה");
    },
    onError: () => {
      toast.error("שגיאה במחיקת הקטגוריה");
    },
  });

  const reorderCategories = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("categories")
          .update({ display_order: u.display_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("סדר הקטגוריות עודכן");
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;
    const parentCats = categories.filter((c) => !c.parent_id);
    const oldIndex = parentCats.findIndex((c) => c.id === active.id);
    const newIndex = parentCats.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(parentCats, oldIndex, newIndex);
    reorderCategories.mutate(reordered.map((c, i) => ({ id: c.id, display_order: i })));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      name_en: "",
      slug: "",
      description: "",
      image_url: "",
      is_active: true,
      is_hidden: false,
      is_updating_soon: false,
      parent_id: "",
      mto_story: "",
    });
    setEditingCategory(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_en: category.name_en || "",
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
      is_hidden: category.is_hidden || false,
      is_updating_soon: category.is_updating_soon || false,
      parent_id: category.parent_id || "",
      mto_story: category.mto_story || "",
    });
    setImagePreview(category.image_url || null);
    setIsDialogOpen(true);
  };

  // Get parent categories (categories without parent_id)
  const parentCategories = categories?.filter(cat => !cat.parent_id) || [];
  
  // Get parent name for display
  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = categories?.find(cat => cat.id === parentId);
    return parent?.name || null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, data: formData });
    } else {
      createCategory.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            קטגוריות ({categories?.length || 0})
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                קטגוריה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[calc(100vh-2rem)] flex flex-col p-0" dir="rtl">
              <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                <DialogTitle>
                  {editingCategory ? "עריכת קטגוריה" : "קטגוריה חדשה"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם הקטגוריה (עברית)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="טבעות"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">שם באנגלית</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Rings"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (לכתובת URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="rings"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">תיאור</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="תיאור הקטגוריה..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>תמונת ניווט (Navigation Image)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {imagePreview || formData.image_url ? (
                    <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="תצוגה מקדימה"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 left-2 h-6 w-6"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Image className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">לחץ להעלאת תמונה</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 ml-1" />
                      העלה תמונה
                    </Button>
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor="image_url" className="text-xs text-muted-foreground">או הזן כתובת URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://..."
                      dir="ltr"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_id">קטגוריית אב</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ללא קטגוריית אב (קטגוריה ראשית)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא קטגוריית אב (קטגוריה ראשית)</SelectItem>
                      {parentCategories
                        .filter(cat => cat.id !== editingCategory?.id)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    בחר קטגוריית אב כדי ליצור תת-קטגוריה
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">פעיל</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_hidden">הסתר קטגוריה</Label>
                    <p className="text-xs text-muted-foreground">הקטגוריה והמוצרים שלה לא יוצגו באתר</p>
                  </div>
                  <Switch
                    id="is_hidden"
                    checked={formData.is_hidden}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_hidden: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_updating_soon">קולקציה בעדכון (Coming Soon)</Label>
                    <p className="text-xs text-muted-foreground">יוצג תג "בקרוב" — יוסר אוטומטית כשמוצר פעיל יתווסף</p>
                  </div>
                  <Switch
                    id="is_updating_soon"
                    checked={formData.is_updating_soon}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_updating_soon: checked })}
                  />
                </div>

                {/* MTO Story Section - Marketing/Brand Content */}
                <div className="space-y-2 border-t pt-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mto_story" className="text-base font-medium">
                      סיפור MTO לקטגוריה - תוכן SEO
                    </Label>
                    <span 
                      className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground"
                      title="תיאור תהליך היצירה עבור הקטגוריה הזו - יוצג בתחתית עמוד הקטגוריה"
                    >
                      ⓘ
                    </span>
                  </div>
                  <Textarea
                    id="mto_story"
                    value={formData.mto_story}
                    onChange={(e) => setFormData({ ...formData, mto_story: e.target.value })}
                    placeholder="תאר את תהליך היצירה הייחודי של מוצרי קטגוריה זו...&#10;&#10;• פגישת ייעוץ אישית&#10;• תכנון ועיצוב מדויק&#10;• יציקה ידנית&#10;• שיבוץ אבנים מקצועי"
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    תוכן זה יופיע בתחתית עמוד הקטגוריה כחלק מתוכן SEO
                  </p>
                </div>
                
                </div>
                <div className="flex gap-2 p-4 border-t bg-background shrink-0">
                  <Button type="submit" className="flex-1" disabled={createCategory.isPending || updateCategory.isPending}>
                    {(createCategory.isPending || updateCategory.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                    {editingCategory ? "עדכן" : "צור"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !categories?.length ? (
            <p className="text-center text-muted-foreground py-8">
              אין קטגוריות. צור את הקטגוריה הראשונה!
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
              <SortableContext
                items={categories.filter((c) => !c.parent_id).map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {categories
                    .filter(cat => !cat.parent_id)
                    .map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        childCategories={categories.filter(c => c.parent_id === category.id)}
                        onEdit={openEditDialog}
                        onDelete={(id) => {
                          if (confirm("האם למחוק את הקטגוריה?")) deleteCategory.mutate(id);
                        }}
                      />
                    ))}
                  {/* Orphan categories */}
                  {categories
                    .filter(cat => cat.parent_id && !categories.some(p => p.id === cat.parent_id))
                    .map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        childCategories={[]}
                        onEdit={openEditDialog}
                        onDelete={(id) => {
                          if (confirm("האם למחוק את הקטגוריה?")) deleteCategory.mutate(id);
                        }}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SortableCategoryItem = ({
  category,
  childCategories,
  onEdit,
  onDelete,
}: {
  category: Category;
  childCategories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg group ${isDragging ? "shadow-lg bg-[#F8F9FA] opacity-90 z-50" : ""}`}>
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {category.image_url ? (
          <img src={category.image_url} alt={category.name} className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium">{category.name}</p>
          <p className="text-sm text-muted-foreground truncate">/{category.slug}</p>
        </div>
        {category.is_hidden && (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
            <EyeOff className="h-3 w-3" />
            מוסתר
          </Badge>
        )}
        <div className={`px-2 py-1 rounded text-xs ${category.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {category.is_active ? "פעיל" : "לא פעיל"}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(category.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {childCategories.map((child) => (
        <div
          key={child.id}
          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group mr-8 mt-1 border-r-2 border-accent/30"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          {child.image_url ? (
            <img src={child.image_url} alt={child.name} className="w-10 h-10 object-cover rounded" />
          ) : (
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{child.name}</p>
            <p className="text-xs text-muted-foreground truncate">/{child.slug}</p>
          </div>
          {child.is_hidden && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
              <EyeOff className="h-3 w-3" />
              מוסתר
            </Badge>
          )}
          <div className={`px-2 py-1 rounded text-xs ${child.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {child.is_active ? "פעיל" : "לא פעיל"}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" onClick={() => onEdit(child)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(child.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryManager;
