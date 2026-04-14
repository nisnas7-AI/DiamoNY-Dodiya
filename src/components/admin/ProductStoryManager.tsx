import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StoryStructuredEditor, { type SpecItem, type StoryImage, type StructuredStoryData } from "./StoryStructuredEditor";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Sparkles, Package, Loader2, Globe, Star, Wand2 } from "lucide-react";
import AIStoryEditor from "./AIStoryEditor";

interface ProductStory {
  id: string;
  title: string;
  content_body: string | null;
  ai_prompt_context: string | null;
  category: string | null;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  title: string;
  content_body: string;
  ai_prompt_context: string;
  category: string;
  is_default: boolean;
  specs: SpecItem[];
  pull_quote: string;
  story_part_1: string;
  story_part_2: string;
  story_images: StoryImage[];
}

const CATEGORIES = [
  { value: "rings", label: "טבעות" },
  { value: "earrings", label: "עגילים" },
  { value: "pendants", label: "תליונים" },
  { value: "bracelets", label: "צמידים" },
  { value: "necklaces", label: "שרשראות" },
  { value: "sets", label: "סטים" },
  { value: "general", label: "כללי (ברירת מחדל גלובלית)" },
];

const EMPTY_FORM: FormData = {
  title: "", content_body: "", ai_prompt_context: "", category: "", is_default: false,
  specs: [], pull_quote: "", story_part_1: "", story_part_2: "", story_images: [],
};

export const ProductStoryManager = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<ProductStory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiEditorOpen, setAiEditorOpen] = useState(false);
  const [aiEditingStory, setAiEditingStory] = useState<ProductStory | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });

  // Fetch stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["product-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_stories")
        .select("*")
        .order("category")
        .order("is_default", { ascending: false })
        .order("title");
      if (error) throw error;
      return data as ProductStory[];
    },
  });

  // Fetch product counts per story
  const { data: productCounts = {} } = useQuery({
    queryKey: ["product-story-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_story_id")
        .not("product_story_id", "is", null);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        if (p.product_story_id) {
          counts[p.product_story_id] = (counts[p.product_story_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Create story mutation
  const createStory = useMutation({
    mutationFn: async (data: FormData) => {
      // If setting as default for a category, unset other defaults in same category
      if (data.is_default && data.category) {
        await supabase
          .from("product_stories")
          .update({ is_default: false })
          .eq("category", data.category)
          .eq("is_default", true);
      }

      const { error } = await supabase.from("product_stories").insert({
        title: data.title,
        content_body: data.content_body || null,
        ai_prompt_context: data.ai_prompt_context || null,
        category: data.category || null,
        is_default: data.is_default,
        specs: data.specs as any,
        pull_quote: data.pull_quote || null,
        story_part_1: data.story_part_1 || null,
        story_part_2: data.story_part_2 || null,
        story_images: data.story_images as any,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-stories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-stories"] });
      toast.success("הסיפור נוצר בהצלחה");
      resetForm();
    },
    onError: () => toast.error("שגיאה ביצירת הסיפור"),
  });

  // Update story mutation
  const updateStory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      // If setting as default for a category, unset other defaults in same category
      if (data.is_default && data.category) {
        await supabase
          .from("product_stories")
          .update({ is_default: false })
          .eq("category", data.category)
          .eq("is_default", true)
          .neq("id", id);
      }

      const { error } = await supabase
        .from("product_stories")
        .update({
          title: data.title,
          content_body: data.content_body || null,
          ai_prompt_context: data.ai_prompt_context || null,
          category: data.category || null,
          is_default: data.is_default,
          specs: data.specs as any,
          pull_quote: data.pull_quote || null,
          story_part_1: data.story_part_1 || null,
          story_part_2: data.story_part_2 || null,
          story_images: data.story_images as any,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-stories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-stories"] });
      toast.success("הסיפור עודכן בהצלחה");
      resetForm();
    },
    onError: () => toast.error("שגיאה בעדכון הסיפור"),
  });

  // Delete story mutation
  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-stories"] });
      queryClient.invalidateQueries({ queryKey: ["product-story-counts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-stories"] });
      toast.success("הסיפור נמחק בהצלחה");
    },
    onError: () => toast.error("שגיאה במחיקת הסיפור"),
  });

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingStory(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (story: ProductStory) => {
    setEditingStory(story);
    setFormData({
      ...EMPTY_FORM,
      title: story.title,
      content_body: story.content_body || "",
      ai_prompt_context: story.ai_prompt_context || "",
      category: story.category || "",
      is_default: story.is_default || false,
      specs: (story as any).specs || [],
      pull_quote: (story as any).pull_quote || "",
      story_part_1: (story as any).story_part_1 || "",
      story_part_2: (story as any).story_part_2 || "",
      story_images: (story as any).story_images || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("נא להזין כותרת");
      return;
    }

    if (editingStory) {
      updateStory.mutate({ id: editingStory.id, data: formData });
    } else {
      createStory.mutate(formData);
    }
  };

  const generateWithAI = async () => {
    if (!formData.title.trim()) {
      toast.error("נא להזין כותרת לפני יצירת תוכן");
      return;
    }

    setIsGenerating(true);
    try {
      const categoryLabel = CATEGORIES.find(c => c.value === formData.category)?.label || "תכשיט";

      const response = await supabase.functions.invoke("ai-seo", {
        body: {
          type: "product_story",
          title: formData.title,
          content: categoryLabel,
        },
      });

      if (response.error) throw response.error;
      
      const generatedText = response.data?.result || "";
      if (generatedText) {
        setFormData(prev => ({ ...prev, content_body: generatedText, story_part_1: generatedText }));
        toast.success("התוכן נוצר בהצלחה!");
      } else {
        throw new Error("No content generated");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("שגיאה ביצירת תוכן AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIRewrite = async () => {
    const combined = [formData.story_part_1, formData.story_part_2].filter(Boolean).join("\n\n");
    if (!combined.trim()) {
      toast.error("אין תוכן לשכתוב");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("ai-seo", {
        body: {
          type: "edit_story",
          title: formData.title || "סיפור מוצר",
          content: JSON.stringify({
            tone: "luxurious",
            seoOptimize: true,
            customInstruction: "שכתב בטון יוקרתי ומפנק, אופטימיזציה ל-SEO עם מילות מפתח של תכשיטים ויהלומים",
            originalStory: combined,
          }),
        },
      });

      if (response.error) throw response.error;

      const result = response.data?.result || "";
      if (result) {
        // Split result into two parts at midpoint paragraph
        const paragraphs = result.split(/\n\n+/).filter(Boolean);
        const mid = Math.ceil(paragraphs.length / 2);
        const part1 = paragraphs.slice(0, mid).join("\n\n");
        const part2 = paragraphs.slice(mid).join("\n\n");
        setFormData(prev => ({
          ...prev,
          story_part_1: part1,
          story_part_2: part2,
          content_body: result,
        }));
        toast.success("הסיפור שוכתב בטון יוקרתי! ✨");
      } else {
        throw new Error("לא התקבל תוכן");
      }
    } catch (error) {
      console.error("AI rewrite error:", error);
      toast.error("שגיאה בשכתוב AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const openAIEditor = (story: ProductStory) => {
    setAiEditingStory(story);
    setAiEditorOpen(true);
  };

  const handleAIEditApply = async (editedContent: string) => {
    if (!aiEditingStory) return;
    
    try {
      const { error } = await supabase
        .from("product_stories")
        .update({ content_body: editedContent })
        .eq("id", aiEditingStory.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["product-stories"] });
      toast.success("הסיפור עודכן בהצלחה");
    } catch (error) {
      toast.error("שגיאה בעדכון הסיפור");
    }
  };

  const filteredStories = stories.filter(
    (story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryLabel = (value: string | null) => {
    return CATEGORIES.find(c => c.value === value)?.label || value || "כללי";
  };

  // Group stories by category
  const groupedStories = filteredStories.reduce((acc, story) => {
    const cat = story.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(story);
    return acc;
  }, {} as Record<string, ProductStory[]>);

  // Truncate text for preview
  const truncateText = (text: string | null, maxLength: number = 150) => {
    if (!text) return "אין תוכן עדיין";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Process {{product_name}} placeholder for preview
  const processPlaceholder = (text: string | null) => {
    if (!text) return "";
    return text.replace(/\{\{product_name\}\}/g, "[שם המוצר]");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-heebo">ניהול סיפורי מוצרים</h2>
          <p className="text-muted-foreground text-sm">
            20 סיפורי SEO מותאמים לקטגוריות. השתמש ב-<code className="bg-muted px-1 rounded">{"{{product_name}}"}</code> להחלפה אוטומטית.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingStory(null);
                setFormData({ ...EMPTY_FORM });
              }}
            >
              <Plus className="h-4 w-4 ml-2" />
              סיפור חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingStory ? "עריכת סיפור" : "סיפור חדש"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">כותרת הסיפור *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="לדוגמה: יוקרה של הצהרה"
                  className="font-medium"
                />
              </div>

              {/* Category + Default Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>קטגוריה *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    ברירת מחדל לקטגוריה
                  </Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.is_default ? "כן - יקושר אוטומטית" : "לא"}
                    </span>
                  </div>
                </div>
              </div>

              {formData.is_default && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                  <p className="text-primary font-medium">✨ סיפור ברירת מחדל</p>
                  <p className="text-muted-foreground mt-1">
                    {formData.category === "general" 
                      ? "סיפור זה יקושר אוטומטית לכל מוצר חדש שאין לו סיפור קטגוריה ספציפי."
                      : `סיפור זה יקושר אוטומטית לכל מוצר חדש בקטגוריית "${getCategoryLabel(formData.category)}".`
                    }
                  </p>
                </div>
              )}

              {/* Structured Story Editor */}
              <StoryStructuredEditor
                data={{
                  specs: formData.specs,
                  pull_quote: formData.pull_quote,
                  story_part_1: formData.story_part_1,
                  story_part_2: formData.story_part_2,
                  story_images: formData.story_images,
                }}
                onChange={(structured) => setFormData(prev => ({
                  ...prev,
                  ...structured,
                  // Keep content_body in sync for backwards compatibility
                  content_body: [structured.story_part_1, structured.story_part_2].filter(Boolean).join("\n\n"),
                }))}
                onAIRewrite={handleAIRewrite}
                isAIGenerating={isGenerating}
              />


              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} disabled={createStory.isPending || updateStory.isPending}>
                  {(createStory.isPending || updateStory.isPending) && (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  )}
                  {editingStory ? "עדכן" : "צור סיפור"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  ביטול
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חפש לפי כותרת או קטגוריה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Stories List - Grouped by Category */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredStories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "לא נמצאו סיפורים התואמים לחיפוש" : "עדיין לא נוצרו סיפורים"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map((category) => {
            const categoryStories = groupedStories[category.value];
            if (!categoryStories || categoryStories.length === 0) return null;
            
            return (
              <div key={category.value} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{category.label}</h3>
                  <Badge variant="outline" className="text-xs">
                    {categoryStories.length} סיפורים
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryStories.map((story) => (
                    <Card 
                      key={story.id} 
                      className={`hover:shadow-lg transition-all duration-200 ${story.is_default ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent ring-1 ring-primary/20' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base font-semibold truncate">
                                {story.title}
                              </CardTitle>
                              {story.is_default && (
                                <Badge variant="default" className="gap-1 shrink-0 text-xs">
                                  <Star className="h-3 w-3" />
                                  ברירת מחדל
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="flex items-center gap-2 text-xs">
                              <Package className="h-3 w-3" />
                              {productCounts[story.id] || 0} מוצרים
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed min-h-[80px]">
                          {processPlaceholder(truncateText(story.content_body, 120))}
                        </div>
                        
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAIEditor(story)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Wand2 className="h-4 w-4 ml-1" />
                            AI
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(story)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("האם למחוק את הסיפור? מוצרים שקושרו אליו יאבדו את הקישור.")) {
                                deleteStory.mutate(story.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Story Editor Dialog */}
      {aiEditingStory && (
        <AIStoryEditor
          isOpen={aiEditorOpen}
          onOpenChange={setAiEditorOpen}
          originalStory={aiEditingStory.content_body || ""}
          storyTitle={aiEditingStory.title}
          onApply={handleAIEditApply}
        />
      )}
    </div>
  );
};

export default ProductStoryManager;
