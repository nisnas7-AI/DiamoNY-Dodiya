import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  reviewer_name: string;
  review_text: string;
  google_review_url: string | null;
  star_rating: number;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
  product_image_url: string | null;
  jewelry_item_name: string | null;
  product_link: string | null;
  is_featured: boolean;
  seo_keywords: string[] | null;
  display_date: string | null;
}

const ReviewsManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    reviewer_name: "",
    review_text: "",
    google_review_url: "",
    star_rating: "5",
    is_active: true,
    jewelry_item_name: "",
    product_link: "",
    image_url: "",
    display_date: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Review[];
    },
  });

  const saveReview = useMutation({
    mutationFn: async () => {
      setIsSaving(true);

      const payload = {
        reviewer_name: formData.reviewer_name,
        review_text: formData.review_text,
        google_review_url: formData.google_review_url || null,
        star_rating: parseInt(formData.star_rating),
        is_active: formData.is_active,
        image_url: formData.image_url || null,
        jewelry_item_name: formData.jewelry_item_name || null,
        product_link: formData.product_link || null,
        display_date: formData.display_date ? new Date(formData.display_date).toISOString() : null,
      };

      if (editingReview) {
        const { error } = await supabase
          .from("site_reviews")
          .update(payload)
          .eq("id", editingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_reviews")
          .insert({ id: crypto.randomUUID(), ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-public"] });
      toast.success(editingReview ? "הביקורת עודכנה" : "הביקורת נוספה");
      resetForm();
    },
    onError: (err: any) => {
      toast.error(`שגיאה בשמירה: ${err?.message || JSON.stringify(err)}`);
      console.error("[ReviewsManager] Save error:", err);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["site-reviews-public"] });
      toast.success("הביקורת נמחקה");
    },
  });

  const resetForm = () => {
    setFormData({ reviewer_name: "", review_text: "", google_review_url: "", star_rating: "5", is_active: true, jewelry_item_name: "", product_link: "", image_url: "", display_date: "" });
    setEditingReview(null);
    setIsDialogOpen(false);
  };

  const openEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      reviewer_name: review.reviewer_name,
      review_text: review.review_text,
      google_review_url: review.google_review_url || "",
      star_rating: review.star_rating.toString(),
      is_active: review.is_active,
      jewelry_item_name: review.jewelry_item_name || "",
      product_link: review.product_link || "",
      image_url: review.image_url || "",
      display_date: review.display_date ? review.display_date.substring(0, 10) : "",
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          ביקורות Google ({reviews?.length || 0})
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" />הוסף ביקורת</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReview ? "עריכת ביקורת" : "ביקורת חדשה"}</DialogTitle>
              <DialogDescription>הוסף או ערוך ביקורת שתוצג באתר</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log("[ReviewsManager] Submit clicked, formData:", JSON.stringify(formData));
              console.log("[ReviewsManager] isSaving:", isSaving, "editingReview:", editingReview?.id || "NEW");
              if (!formData.reviewer_name.trim() || !formData.review_text.trim()) {
                const missing: string[] = [];
                if (!formData.reviewer_name.trim()) missing.push("שם המבקר");
                if (!formData.review_text.trim()) missing.push("טקסט הביקורת");
                toast.error(`שדות חסרים: ${missing.join(", ")}`);
                return;
              }
              saveReview.mutate();
            }} className="space-y-4">
              <div className="space-y-2">
                <Label>שם המבקר</Label>
                <Input value={formData.reviewer_name} onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })} placeholder="ישראל ישראלי" />
              </div>
              <div className="space-y-2">
                <Label>טקסט הביקורת</Label>
                <Textarea value={formData.review_text} onChange={(e) => setFormData({ ...formData, review_text: e.target.value })} placeholder="חוויה מעולה..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>שם פריט התכשיט (אופציונלי)</Label>
                <Input value={formData.jewelry_item_name} onChange={(e) => setFormData({ ...formData, jewelry_item_name: e.target.value })} placeholder="טבעת אירוסין יהלום" />
              </div>
              <div className="space-y-2">
                <Label>קישור למוצר (אופציונלי)</Label>
                <Input value={formData.product_link} onChange={(e) => setFormData({ ...formData, product_link: e.target.value })} placeholder="/catalog/slug" />
              </div>
              <div className="space-y-2">
                <Label>קישור לתמונה (אופציונלי)</Label>
                <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>קישור לביקורת ב-Google</Label>
                <Input value={formData.google_review_url} onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })} placeholder="https://g.co/..." />
              </div>
              <div className="space-y-2">
                <Label>דירוג כוכבים</Label>
                <Select value={formData.star_rating} onValueChange={(v) => setFormData({ ...formData, star_rating: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map(n => (
                      <SelectItem key={n} value={n.toString()}>{"★".repeat(n)}{"☆".repeat(5 - n)} ({n})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>תאריך תצוגה (אופציונלי)</Label>
                <Input type="date" value={formData.display_date} onChange={(e) => setFormData({ ...formData, display_date: e.target.value })} />
                <p className="text-xs text-muted-foreground">אם ריק, יוצג תאריך היצירה</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                <Label>פעיל</Label>
              </div>
              <Button type="submit" className="w-full">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {editingReview ? "עדכן" : "הוסף"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : !reviews?.length ? (
          <p className="text-center text-muted-foreground py-8">אין ביקורות. הוסף את הביקורת הראשונה!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {review.image_url && (
                  <img src={review.image_url} alt={review.reviewer_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.reviewer_name}</span>
                    <span className="text-yellow-500 text-sm">{"★".repeat(review.star_rating)}</span>
                    {!review.is_active && <span className="text-xs bg-muted px-2 py-0.5 rounded">מוסתר</span>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{review.review_text}</p>
                  {review.google_review_url && (
                    <a href={review.google_review_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" /> צפה ב-Google
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(review)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("למחוק?")) deleteReview.mutate(review.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsManager;
