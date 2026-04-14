import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";

interface FeaturedReviewSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FeaturedReviewSelector = ({ value, onChange }: FeaturedReviewSelectorProps) => {
  const { data: reviews } = useQuery({
    queryKey: ["site-reviews-for-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("id, reviewer_name, star_rating, review_text")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  if (!reviews?.length) return null;

  return (
    <div className="border rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-950/20">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-5 w-5 text-yellow-500" />
        <Label className="text-base font-medium">המלצת לקוח נבחרת</Label>
        <span className="text-xs text-muted-foreground">תוצג בעמוד המוצר</span>
      </div>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder="בחר המלצה להצגה" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">ללא המלצה</SelectItem>
          {reviews.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {"★".repeat(r.star_rating || 5)} {r.reviewer_name} - {r.review_text.substring(0, 40)}...
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FeaturedReviewSelector;
