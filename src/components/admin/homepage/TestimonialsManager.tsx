import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Plus, Trash2, Star, Upload, CalendarDays, ExternalLink, Eye, X, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { TestimonialImageCropper } from "@/components/admin/TestimonialImageCropper";

// Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface Testimonial {
  id: string;
  customer_name: string;
  jewelry_item_name: string | null;
  product_link: string | null;
  content: string;
  rating: number | null;
  image_url: string | null;
  product_image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  published_at: string | null;
  google_review_url: string | null;
  seo_keywords: string[] | null;
}

// Suggested SEO keywords for AEO
const SUGGESTED_KEYWORDS = [
  "טבעת אירוסין בהזמנה אישית",
  "צורף באשקלון",
  "יהלום טבעי",
  "תכשיט זהב 14K",
  "עיצוב תכשיטים",
  "טבעת נישואין",
  "שרשרת יהלום",
  "עגילי יהלום",
  "תכשיט בעבודת יד",
  "מתנה ליום נישואין",
];

// Live Preview Card Component - matches exactly how it appears on site
const TestimonialPreviewCard = ({ testimonial }: { testimonial: Partial<Testimonial> }) => {
  const hasGoogleReview = !!testimonial.google_review_url;
  
  return (
    <div className="bg-white rounded-xl p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      {/* Stars */}
      <div className="flex justify-center gap-1.5 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 md:w-5 md:h-5 ${
              i < (testimonial.rating || 5)
                ? "fill-[#856404] text-[#856404]"
                : "fill-gray-200 text-gray-200"
            }`}
            strokeWidth={1}
          />
        ))}
      </div>
      
      {/* Quote */}
      <blockquote className="relative text-center mb-6">
        <span className="absolute -top-2 right-0 text-4xl md:text-5xl text-[#856404]/15 font-serif leading-none select-none">"</span>
        <p className="px-4 line-clamp-4 italic text-foreground/85 font-serif">
          {testimonial.content || "תוכן ההמלצה יופיע כאן..."}
        </p>
        <span className="absolute -bottom-4 left-0 text-4xl md:text-5xl text-[#856404]/15 font-serif leading-none select-none rotate-180">"</span>
      </blockquote>
      
      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-gray-100">
        <div className="flex items-center justify-end gap-3 md:gap-4" dir="rtl">
          <div className="text-right flex-1">
            <div className="flex items-center justify-end gap-1.5">
              <p className="font-serif font-semibold text-foreground text-sm md:text-base">
                {testimonial.customer_name || "שם הלקוח"}
              </p>
              {hasGoogleReview && (
                <GoogleIcon className="w-3.5 h-3.5 opacity-80" />
              )}
            </div>
            {testimonial.published_at && (
              <p className="text-[10px] md:text-xs text-muted-foreground/40 mt-0.5">
                {format(new Date(testimonial.published_at), "MMMM yyyy", { locale: he })}
              </p>
            )}
            {testimonial.jewelry_item_name && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {testimonial.jewelry_item_name}
              </p>
            )}
          </div>
          
          {testimonial.product_image_url ? (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#856404]/10 shadow-sm flex-shrink-0">
              <img
                src={testimonial.product_image_url}
                alt={testimonial.jewelry_item_name || "Jewelry"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : testimonial.image_url ? (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#856404]/10 shadow-sm flex-shrink-0">
              <img
                src={testimonial.image_url}
                alt={testimonial.jewelry_item_name || "Jewelry"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#856404]/5 to-[#856404]/15 border border-[#856404]/10 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-[#856404]/40" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TestimonialsManager = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTestimonial, setEditedTestimonial] = useState<Partial<Testimonial>>({});
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
    customer_name: "",
    jewelry_item_name: "",
    product_link: "",
    content: "",
    rating: 5,
    image_url: null,
    product_image_url: null,
    is_active: true,
    is_featured: false,
    published_at: new Date().toISOString(),
    google_review_url: "",
    seo_keywords: [],
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [uploadingNewProduct, setUploadingNewProduct] = useState(false);
  const [uploadingEditProduct, setUploadingEditProduct] = useState(false);
  const [previewTestimonial, setPreviewTestimonial] = useState<Testimonial | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [editKeyword, setEditKeyword] = useState("");
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperTarget, setCropperTarget] = useState<"new" | "edit">("new");

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["site-reviews-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return (data ?? []).map((review) => ({
        id: review.id,
        customer_name: review.reviewer_name,
        jewelry_item_name: review.jewelry_item_name,
        product_link: review.product_link,
        content: review.review_text,
        rating: review.star_rating,
        image_url: review.image_url,
        product_image_url: review.product_image_url,
        is_active: review.is_active,
        is_featured: review.is_featured,
        display_order: review.display_order ?? 0,
        published_at: review.updated_at ?? review.created_at,
        google_review_url: review.google_review_url,
        seo_keywords: review.seo_keywords ?? [],
      })) as Testimonial[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (testimonial: Partial<Testimonial>) => {
      const maxOrder = testimonials?.length ? Math.max(...testimonials.map(t => t.display_order || 0)) : 0;
      const { error, status } = await supabase
        .from("site_reviews")
        .insert({
          id: crypto.randomUUID(),
          reviewer_name: testimonial.customer_name || "",
          jewelry_item_name: testimonial.jewelry_item_name || null,
          product_link: testimonial.product_link || null,
          review_text: testimonial.content || "",
          star_rating: testimonial.rating || 5,
          image_url: testimonial.image_url || null,
          product_image_url: testimonial.product_image_url || null,
          is_active: testimonial.is_active ?? true,
          is_featured: testimonial.is_featured ?? false,
          display_order: maxOrder + 1,
          google_review_url: testimonial.google_review_url || null,
          seo_keywords: testimonial.seo_keywords || [],
        });
      if (error) throw error;
      if (status < 200 || status >= 300) {
        throw new Error(`Database insert failed with status ${status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-reviews-admin"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-public"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-for-selector"] });
      queryClient.invalidateQueries({ queryKey: ["product-site-review"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("ההמלצה נוספה בהצלחה");
      setShowNewForm(false);
      setNewTestimonial({ 
        customer_name: "", 
        jewelry_item_name: "", 
        product_link: "", 
        content: "", 
        rating: 5, 
        image_url: null, 
        product_image_url: null,
        is_active: true, 
        is_featured: false, 
        published_at: new Date().toISOString(), 
        google_review_url: "",
        seo_keywords: [],
      });
    },
    onError: (err: any) => {
      toast.error(`שגיאה בהוספת ההמלצה: ${err?.message || "שגיאה לא ידועה"}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Testimonial> }) => {
      const { error, status } = await supabase
        .from("site_reviews")
        .update({
          reviewer_name: data.customer_name,
          jewelry_item_name: data.jewelry_item_name,
          product_link: data.product_link,
          review_text: data.content,
          star_rating: data.rating,
          image_url: data.image_url,
          product_image_url: data.product_image_url,
          is_active: data.is_active,
          is_featured: data.is_featured,
          google_review_url: data.google_review_url,
          seo_keywords: data.seo_keywords,
        })
        .eq("id", id);
      if (error) throw error;
      if (status < 200 || status >= 300) {
        throw new Error(`Database update failed with status ${status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-reviews-admin"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-public"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-for-selector"] });
      queryClient.invalidateQueries({ queryKey: ["product-site-review"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("ההמלצה עודכנה");
      setEditingId(null);
      setEditedTestimonial({});
    },
    onError: (err: any) => {
      toast.error(`שגיאה בעדכון: ${err?.message || "שגיאה לא ידועה"}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error, status } = await supabase
        .from("site_reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
      if (status < 200 || status >= 300) {
        throw new Error(`Database delete failed with status ${status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-reviews-admin"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-public"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-for-selector"] });
      queryClient.invalidateQueries({ queryKey: ["product-site-review"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("ההמלצה נמחקה");
    },
    onError: (err: any) => {
      toast.error(`שגיאה במחיקה: ${err?.message || "שגיאה לא ידועה"}`);
    },
  });

  const handleImageUpload = async (file: File, isNew: boolean = false) => {
    if (isNew) {
      setUploadingNew(true);
    } else {
      setUploadingEdit(true);
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `testimonials/testimonial-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('catalog-media')
        .upload(fileName, file);
      
      if (uploadError) {
        toast.error("שגיאה בהעלאת התמונה");
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('catalog-media')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } finally {
      if (isNew) {
        setUploadingNew(false);
      } else {
        setUploadingEdit(false);
      }
    }
  };

  const handleNewImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleImageUpload(file, true);
      if (url) {
        setNewTestimonial(prev => ({ ...prev, image_url: url }));
        toast.success("התמונה הועלתה בהצלחה");
      }
    }
  };

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleImageUpload(file, false);
      if (url) {
        updateField('image_url', url);
        toast.success("התמונה הועלתה בהצלחה");
      }
    }
  };

  const handleNewProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show cropper first
      const tempUrl = URL.createObjectURL(file);
      setCropperTarget("new");
      setCropperImage(tempUrl);
    }
  };

  const handleEditProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setCropperTarget("edit");
      setCropperImage(tempUrl);
    }
  };

  const handleCroppedImage = async (blob: Blob) => {
    const isNew = cropperTarget === "new";
    if (isNew) setUploadingNewProduct(true);
    else setUploadingEditProduct(true);

    try {
      const file = new File([blob], `product-crop-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = await handleImageUpload(file, isNew);
      if (url) {
        if (isNew) {
          setNewTestimonial(prev => ({ ...prev, product_image_url: url }));
        } else {
          updateField("product_image_url", url);
        }
        toast.success("תמונת המוצר נחתכה והועלתה בהצלחה");
      }
    } finally {
      if (isNew) setUploadingNewProduct(false);
      else setUploadingEditProduct(false);
      setCropperImage(null);
    }
  };

  const startEditing = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setEditedTestimonial(testimonial);
  };

  const getValue = (testimonial: Testimonial, field: keyof Testimonial) => {
    if (editingId === testimonial.id && editedTestimonial[field] !== undefined) {
      return editedTestimonial[field];
    }
    return testimonial[field];
  };

  const updateField = (field: keyof Testimonial, value: any) => {
    setEditedTestimonial(prev => ({ ...prev, [field]: value }));
  };

  // Keyword management for new testimonial
  const addNewKeyword = (keyword: string) => {
    if (keyword && !newTestimonial.seo_keywords?.includes(keyword)) {
      setNewTestimonial(prev => ({
        ...prev,
        seo_keywords: [...(prev.seo_keywords || []), keyword]
      }));
    }
    setNewKeyword("");
  };

  const removeNewKeyword = (keyword: string) => {
    setNewTestimonial(prev => ({
      ...prev,
      seo_keywords: (prev.seo_keywords || []).filter(k => k !== keyword)
    }));
  };

  // Keyword management for editing
  const addEditKeyword = (keyword: string) => {
    const currentKeywords = (editedTestimonial.seo_keywords as string[]) || [];
    if (keyword && !currentKeywords.includes(keyword)) {
      updateField('seo_keywords', [...currentKeywords, keyword]);
    }
    setEditKeyword("");
  };

  const removeEditKeyword = (keyword: string) => {
    const currentKeywords = (editedTestimonial.seo_keywords as string[]) || [];
    updateField('seo_keywords', currentKeywords.filter(k => k !== keyword));
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  // Get merged testimonial data for preview
  const getPreviewData = (testimonial: Testimonial): Partial<Testimonial> => {
    if (editingId === testimonial.id) {
      return { ...testimonial, ...editedTestimonial };
    }
    return testimonial;
  };

  return (
    <>
      {/* Image Cropper Dialog */}
      {cropperImage && (
        <TestimonialImageCropper
          imageUrl={cropperImage}
          isOpen={!!cropperImage}
          onClose={() => setCropperImage(null)}
          onSave={handleCroppedImage}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">ניהול המלצות לקוחות</h2>
          <Button onClick={() => setShowNewForm(!showNewForm)}>
            <Plus className="h-4 w-4 ml-2" />
            המלצה חדשה
          </Button>
        </div>

        {/* New Testimonial Form with Live Preview */}
        {showNewForm && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                המלצה חדשה
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 ml-1" />
                  תצוגה מקדימה בזמן אמת
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Side */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>שם הלקוח *</Label>
                      <Input
                        value={newTestimonial.customer_name || ""}
                        onChange={(e) => setNewTestimonial(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="שם הלקוח"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>שם פריט התכשיט</Label>
                      <Input
                        value={newTestimonial.jewelry_item_name || ""}
                        onChange={(e) => setNewTestimonial(prev => ({ ...prev, jewelry_item_name: e.target.value }))}
                        placeholder="לדוגמה: טבעת יהלום סוליטר"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>קישור למוצר (URL)</Label>
                      <Input
                        value={newTestimonial.product_link || ""}
                        onChange={(e) => setNewTestimonial(prev => ({ ...prev, product_link: e.target.value }))}
                        placeholder="/catalog/product-slug"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>קישור לביקורת Google</Label>
                      <Input
                        value={newTestimonial.google_review_url || ""}
                        onChange={(e) => setNewTestimonial(prev => ({ ...prev, google_review_url: e.target.value }))}
                        placeholder="https://g.co/kgs/..."
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>דירוג (1-5)</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewTestimonial(prev => ({ ...prev, rating: star }))}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-6 w-6 ${star <= (newTestimonial.rating || 0) ? 'fill-[#856404] text-[#856404]' : 'text-muted-foreground'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>תוכן ההמלצה *</Label>
                    <Textarea
                      value={newTestimonial.content || ""}
                      onChange={(e) => setNewTestimonial(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="מה הלקוח אמר..."
                      rows={4}
                    />
                  </div>
                  
                  {/* SEO Keywords */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      מילות מפתח AEO
                      <Badge variant="secondary" className="text-xs">לזיהוי סמכות</Badge>
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(newTestimonial.seo_keywords || []).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="flex items-center gap-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeNewKeyword(keyword)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="הוסף מילת מפתח..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewKeyword(newKeyword))}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => addNewKeyword(newKeyword)}>
                        הוסף
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {SUGGESTED_KEYWORDS.filter(k => !newTestimonial.seo_keywords?.includes(k)).slice(0, 5).map((keyword) => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() => addNewKeyword(keyword)}
                          className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded transition-colors"
                        >
                          + {keyword}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>תמונת התכשיט</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-muted-foreground/50 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">{uploadingNew ? "מעלה..." : "העלה תמונה"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleNewImageChange}
                          disabled={uploadingNew}
                        />
                      </label>
                      {newTestimonial.image_url && (
                        <div className="relative">
                          <img
                            src={newTestimonial.image_url}
                            alt="Preview"
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setNewTestimonial(prev => ({ ...prev, image_url: null }))}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Image Upload (for lightbox) */}
                  <div className="space-y-2">
                    <Label>תמונת מוצר (תצוגה מוגדלת)</Label>
                    <p className="text-xs text-muted-foreground">תמונה באיכות גבוהה שתוצג בלחיצה על העיגול בכרטיס ההמלצה</p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                        <Upload className="h-4 w-4 text-primary" />
                        <span className="text-sm">{uploadingNewProduct ? "מעלה..." : "העלה תמונת מוצר"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleNewProductImageChange}
                          disabled={uploadingNewProduct}
                        />
                      </label>
                      {newTestimonial.product_image_url && (
                        <div className="relative">
                          <img
                            src={newTestimonial.product_image_url}
                            alt="Product Preview"
                            className="h-16 w-16 object-cover rounded-lg border-2 border-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() => setNewTestimonial(prev => ({ ...prev, product_image_url: null }))}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>תאריך פרסום</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !newTestimonial.published_at && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="ml-2 h-4 w-4" />
                          {newTestimonial.published_at ? (
                            format(new Date(newTestimonial.published_at), "dd בMMMM yyyy", { locale: he })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newTestimonial.published_at ? new Date(newTestimonial.published_at) : undefined}
                          onSelect={(date) => setNewTestimonial(prev => ({ 
                            ...prev, 
                            published_at: date ? date.toISOString() : null 
                          }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newTestimonial.is_active || false}
                        onCheckedChange={(checked) => setNewTestimonial(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label>פעיל</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newTestimonial.is_featured || false}
                        onCheckedChange={(checked) => setNewTestimonial(prev => ({ ...prev, is_featured: checked }))}
                      />
                      <Label>מומלץ</Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => createMutation.mutate(newTestimonial)} 
                      disabled={createMutation.isPending || !newTestimonial.customer_name || !newTestimonial.content}
                    >
                      <Save className="h-4 w-4 ml-2" />
                      שמור
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewForm(false)}>
                      ביטול
                    </Button>
                  </div>
                </div>

                {/* Preview Side */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>תצוגה מקדימה - כך ייראה באתר</span>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <TestimonialPreviewCard testimonial={newTestimonial} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Testimonials */}
        {testimonials?.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                {/* Image Preview */}
                {testimonial.image_url && !editingId && (
                  <div className="flex-shrink-0">
                    <img
                      src={testimonial.image_url}
                      alt={testimonial.jewelry_item_name || "Jewelry"}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  {editingId === testimonial.id ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Edit Form */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>שם הלקוח</Label>
                            <Input
                              value={getValue(testimonial, 'customer_name') as string}
                              onChange={(e) => updateField('customer_name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>שם פריט התכשיט</Label>
                            <Input
                              value={(getValue(testimonial, 'jewelry_item_name') as string) || ""}
                              onChange={(e) => updateField('jewelry_item_name', e.target.value)}
                              placeholder="לדוגמה: טבעת יהלום סוליטר"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>קישור למוצר (URL)</Label>
                            <Input
                              value={(getValue(testimonial, 'product_link') as string) || ""}
                              onChange={(e) => updateField('product_link', e.target.value)}
                              placeholder="/catalog/product-slug"
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>קישור לביקורת Google</Label>
                            <Input
                              value={(getValue(testimonial, 'google_review_url') as string) || ""}
                              onChange={(e) => updateField('google_review_url', e.target.value)}
                              placeholder="https://g.co/kgs/..."
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>דירוג</Label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => updateField('rating', star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`h-6 w-6 ${star <= (getValue(testimonial, 'rating') as number || 0) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-muted-foreground'}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>תוכן</Label>
                          <Textarea
                            value={getValue(testimonial, 'content') as string}
                            onChange={(e) => updateField('content', e.target.value)}
                            rows={4}
                          />
                        </div>
                        
                        {/* SEO Keywords for Edit */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            מילות מפתח AEO
                            <Badge variant="secondary" className="text-xs">לזיהוי סמכות</Badge>
                          </Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {((getValue(testimonial, 'seo_keywords') as string[]) || []).map((keyword) => (
                              <Badge key={keyword} variant="outline" className="flex items-center gap-1">
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => removeEditKeyword(keyword)}
                                  className="hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={editKeyword}
                              onChange={(e) => setEditKeyword(e.target.value)}
                              placeholder="הוסף מילת מפתח..."
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEditKeyword(editKeyword))}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => addEditKeyword(editKeyword)}>
                              הוסף
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {SUGGESTED_KEYWORDS
                              .filter(k => !((getValue(testimonial, 'seo_keywords') as string[]) || []).includes(k))
                              .slice(0, 5)
                              .map((keyword) => (
                                <button
                                  key={keyword}
                                  type="button"
                                  onClick={() => addEditKeyword(keyword)}
                                  className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded transition-colors"
                                >
                                  + {keyword}
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>תמונת התכשיט</Label>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-muted-foreground/50 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">{uploadingEdit ? "מעלה..." : "העלה תמונה"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleEditImageChange}
                                disabled={uploadingEdit}
                              />
                            </label>
                            {(getValue(testimonial, 'image_url') as string) && (
                              <div className="relative">
                                <img
                                  src={getValue(testimonial, 'image_url') as string}
                                  alt="Preview"
                                  className="h-16 w-16 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateField('image_url', null)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Image Upload (for lightbox) - Edit */}
                        <div className="space-y-2">
                          <Label>תמונת מוצר (תצוגה מוגדלת)</Label>
                          <p className="text-xs text-muted-foreground">תמונה באיכות גבוהה שתוצג בלחיצה על העיגול</p>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                              <Upload className="h-4 w-4 text-primary" />
                              <span className="text-sm">{uploadingEditProduct ? "מעלה..." : "העלה תמונת מוצר"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleEditProductImageChange}
                                disabled={uploadingEditProduct}
                              />
                            </label>
                            {(getValue(testimonial, 'product_image_url') as string) && (
                              <div className="relative">
                                <img
                                  src={getValue(testimonial, 'product_image_url') as string}
                                  alt="Product Preview"
                                  className="h-16 w-16 object-cover rounded-lg border-2 border-primary/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateField('product_image_url', null)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Published Date Picker for Edit */}
                        <div className="space-y-2">
                          <Label>תאריך פרסום</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-right font-normal",
                                  !getValue(testimonial, 'published_at') && "text-muted-foreground"
                                )}
                              >
                                <CalendarDays className="ml-2 h-4 w-4" />
                                {getValue(testimonial, 'published_at') ? (
                                  format(new Date(getValue(testimonial, 'published_at') as string), "dd בMMMM yyyy", { locale: he })
                                ) : (
                                  <span>בחר תאריך</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={getValue(testimonial, 'published_at') ? new Date(getValue(testimonial, 'published_at') as string) : undefined}
                                onSelect={(date) => updateField('published_at', date ? date.toISOString() : null)}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={getValue(testimonial, 'is_active') as boolean}
                              onCheckedChange={(checked) => updateField('is_active', checked)}
                            />
                            <Label>פעיל</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={getValue(testimonial, 'is_featured') as boolean}
                              onCheckedChange={(checked) => updateField('is_featured', checked)}
                            />
                            <Label>מומלץ</Label>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => updateMutation.mutate({ id: testimonial.id, data: editedTestimonial })}
                            disabled={updateMutation.isPending}
                          >
                            <Save className="h-4 w-4 ml-2" />
                            שמור
                          </Button>
                          <Button variant="outline" onClick={() => { setEditingId(null); setEditedTestimonial({}); }}>
                            ביטול
                          </Button>
                        </div>
                      </div>

                      {/* Live Preview for Edit */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>תצוגה מקדימה בזמן אמת</span>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4">
                          <TestimonialPreviewCard testimonial={getPreviewData(testimonial)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-medium">{testimonial.customer_name}</span>
                        {testimonial.jewelry_item_name && (
                          <span className="text-sm text-muted-foreground">| {testimonial.jewelry_item_name}</span>
                        )}
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= (testimonial.rating || 0) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                        {testimonial.is_active ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                            פעיל
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
                            לא פעיל
                          </span>
                        )}
                        {testimonial.is_featured && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">מומלץ</span>
                        )}
                        {testimonial.google_review_url && (
                          <a
                            href={testimonial.google_review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <GoogleIcon className="h-3.5 w-3.5" />
                            <span>קישור לביקורת</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-muted-foreground">{testimonial.content}</p>
                      
                      {/* Show SEO Keywords */}
                      {testimonial.seo_keywords && testimonial.seo_keywords.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">מילות מפתח:</span>
                          {testimonial.seo_keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPreviewTestimonial(testimonial)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          תצוגה מקדימה
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => startEditing(testimonial)}>
                          ערוך
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(testimonial.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Preview Sheet */}
      <Sheet open={!!previewTestimonial} onOpenChange={(open) => !open && setPreviewTestimonial(null)}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              תצוגה מקדימה
            </SheetTitle>
          </SheetHeader>
          <div className="p-6 bg-muted/30 min-h-[400px]">
            {previewTestimonial && (
              <TestimonialPreviewCard testimonial={previewTestimonial} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TestimonialsManager;
