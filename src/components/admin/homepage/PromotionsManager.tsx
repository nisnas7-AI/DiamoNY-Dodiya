import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Calendar, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import BannerTemplatesPicker, { bannerTemplates, BannerTemplate } from "./BannerTemplates";
import AIBannerGenerator from "./AIBannerGenerator";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  banner_image_url: string | null;
  banner_text: string | null;
  banner_text_color: string;
  banner_template: string | null;
  banner_gradient: string | null;
  discount_code: string | null;
  discount_percent: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  slug: string;
  cta_text: string;
  cta_url: string | null;
}

const PromotionsManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    banner_image_url: "",
    banner_text: "",
    banner_text_color: "#FFFFFF",
    banner_template: "",
    banner_gradient: "",
    discount_code: "",
    discount_percent: "",
    start_date: "",
    end_date: "",
    is_active: true,
    show_on_homepage: false,
    slug: "",
    cta_text: "לצפייה במבצע",
    cta_url: "/catalog",
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["promotions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Promotion[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; slug: string; [key: string]: unknown }) => {
      const { error } = await supabase.from("promotions").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      toast.success("המבצע נוצר בהצלחה");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("שגיאה ביצירת המבצע");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Promotion> }) => {
      const { error } = await supabase.from("promotions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      toast.success("המבצע עודכן בהצלחה");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("שגיאה בעדכון המבצע");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      toast.success("המבצע נמחק");
    },
    onError: () => {
      toast.error("שגיאה במחיקת המבצע");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("promotions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      banner_image_url: "",
      banner_text: "",
      banner_text_color: "#FFFFFF",
      banner_template: "",
      banner_gradient: "",
      discount_code: "",
      discount_percent: "",
      start_date: "",
      end_date: "",
      is_active: true,
      show_on_homepage: false,
      slug: "",
      cta_text: "לצפייה במבצע",
      cta_url: "/catalog",
    });
    setSelectedTemplate(null);
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setSelectedTemplate(promotion.banner_template || null);
    setFormData({
      title: promotion.title,
      description: promotion.description || "",
      content: promotion.content || "",
      banner_image_url: promotion.banner_image_url || "",
      banner_text: promotion.banner_text || "",
      banner_text_color: promotion.banner_text_color || "#FFFFFF",
      banner_template: promotion.banner_template || "",
      banner_gradient: promotion.banner_gradient || "",
      discount_code: promotion.discount_code || "",
      discount_percent: promotion.discount_percent?.toString() || "",
      start_date: promotion.start_date?.slice(0, 16) || "",
      end_date: promotion.end_date?.slice(0, 16) || "",
      is_active: promotion.is_active,
      show_on_homepage: promotion.show_on_homepage,
      slug: promotion.slug,
      cta_text: promotion.cta_text,
      cta_url: promotion.cta_url || "/catalog",
    });
    setIsDialogOpen(true);
  };

  const handleTemplateSelect = (template: BannerTemplate) => {
    setSelectedTemplate(template.id);
    setFormData(prev => ({
      ...prev,
      banner_template: template.id,
      banner_gradient: template.gradient,
      banner_text_color: template.textColor,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `promo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, banner_image_url: publicUrl }));
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.slug) {
      toast.error("נא למלא כותרת ו-slug");
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description || null,
      content: formData.content || null,
      banner_image_url: formData.banner_image_url || null,
      banner_text: formData.banner_text || null,
      banner_text_color: formData.banner_text_color,
      banner_template: formData.banner_template || null,
      banner_gradient: formData.banner_gradient || null,
      discount_code: formData.discount_code || null,
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_active: formData.is_active,
      show_on_homepage: formData.show_on_homepage,
      slug: formData.slug,
      cta_text: formData.cta_text,
      cta_url: formData.cta_url || null,
    };

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data });
    } else {
      createMutation.mutate(data);
    }
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
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          נהל מבצעים והנחות. מבצעים פעילים יופיעו בעמוד הבית ובעמוד ייעודי.
        </p>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              מבצע חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromotion ? "עריכת מבצע" : "מבצע חדש"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>כותרת המבצע *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        title: e.target.value,
                        slug: prev.slug || generateSlug(e.target.value),
                      }));
                    }}
                    placeholder="מבצע סוף שנה"
                  />
                </div>
                <div>
                  <Label>Slug (לכתובת URL) *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="end-of-year-sale"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <Label>תיאור קצר</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="הנחות של עד 30% על כל הקולקציה"
                />
              </div>

              <div>
                <Label>תוכן מלא (לעמוד המבצע)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="תיאור מפורט של המבצע, תנאים, הגבלות..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>קוד קופון</Label>
                  <Input
                    value={formData.discount_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_code: e.target.value }))}
                    placeholder="SALE30"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>אחוז הנחה</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                    placeholder="30"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Banner Templates */}
              <BannerTemplatesPicker
                selectedTemplate={selectedTemplate}
                onSelect={handleTemplateSelect}
              />

              {/* Banner Preview */}
              <div>
                <Label>תצוגה מקדימה של הבאנר</Label>
                <div 
                  className="relative w-full h-24 rounded-lg overflow-hidden mb-2"
                  style={{ 
                    background: formData.banner_gradient || (formData.banner_image_url ? undefined : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)')
                  }}
                >
                  {formData.banner_image_url && !formData.banner_gradient && (
                    <img
                      src={formData.banner_image_url}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color: formData.banner_text_color }}
                  >
                    <span className="text-xl font-bold drop-shadow-lg">
                      {formData.banner_text || "טקסט המבצע"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label>תמונת באנר</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  <AIBannerGenerator 
                    onImageGenerated={(url) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        banner_image_url: url,
                        banner_template: "",
                        banner_gradient: "",
                      }));
                      setSelectedTemplate(null);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  העלה תמונה או צור באמצעות AI. התמונה תוצג במקום התבנית.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>טקסט על הבאנר</Label>
                  <Input
                    value={formData.banner_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, banner_text: e.target.value }))}
                    placeholder="30% הנחה!"
                  />
                </div>
                <div>
                  <Label>צבע טקסט הבאנר</Label>
                  <Input
                    type="color"
                    value={formData.banner_text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, banner_text_color: e.target.value }))}
                    className="h-10 p-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>תאריך התחלה</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>תאריך סיום</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>טקסט כפתור</Label>
                  <Input
                    value={formData.cta_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                    placeholder="לצפייה במבצע"
                  />
                </div>
                <div>
                  <Label>קישור כפתור</Label>
                  <Input
                    value={formData.cta_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, cta_url: e.target.value }))}
                    placeholder="/catalog"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>מבצע פעיל</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.show_on_homepage}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_on_homepage: checked }))}
                  />
                  <Label>הצג בעמוד הבית</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
                  ביטול
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  )}
                  {editingPromotion ? "עדכן" : "צור מבצע"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {promotions?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              אין מבצעים עדיין. צור מבצע חדש כדי להתחיל.
            </CardContent>
          </Card>
        )}

        {promotions?.map((promo) => (
          <Card key={promo.id} className={!promo.is_active ? "opacity-60" : ""}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                {promo.banner_image_url && (
                  <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={promo.banner_image_url}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{promo.title}</h4>
                    {promo.show_on_homepage && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        בעמוד הבית
                      </span>
                    )}
                    {promo.discount_code && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                        {promo.discount_code}
                      </span>
                    )}
                  </div>
                  {promo.description && (
                    <p className="text-sm text-muted-foreground">{promo.description}</p>
                  )}
                  {(promo.start_date || promo.end_date) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {promo.start_date && format(new Date(promo.start_date), "dd/MM/yyyy", { locale: he })}
                      {promo.start_date && promo.end_date && " - "}
                      {promo.end_date && format(new Date(promo.end_date), "dd/MM/yyyy", { locale: he })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({ id: promo.id, is_active: !promo.is_active })}
                  >
                    {promo.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(promo)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("האם למחוק את המבצע?")) {
                        deleteMutation.mutate(promo.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromotionsManager;
