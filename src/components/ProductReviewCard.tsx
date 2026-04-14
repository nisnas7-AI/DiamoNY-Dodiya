import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface ProductReviewCardProps {
  reviewId: string | null;
}

const ProductReviewCard = ({ reviewId }: ProductReviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: review } = useQuery({
    queryKey: ["product-site-review", reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*")
        .eq("id", reviewId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!reviewId,
  });

  if (!review) return null;

  const starRating = review.star_rating || 5;
  const reviewText = review.review_text;
  const reviewerName = review.reviewer_name;
  const googleUrl = review.google_review_url;

  const CardWrapper = googleUrl ? 'a' : 'div';
  const linkProps = googleUrl
    ? { href: googleUrl, target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <CardWrapper
      {...linkProps}
      className="block mt-6 mb-4 rounded-3xl border border-[hsl(var(--accent))]/20 bg-[hsl(0,0%,8%)] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:shadow-[0_12px_40px_rgba(212,175,55,0.15)] hover:-translate-y-0.5 cursor-pointer group"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onTouchStart={() => setIsExpanded(prev => !prev)}
    >
      {/* Header: Stars + Google Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: starRating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
          ))}
        </div>
        <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
          <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-[11px] tracking-wider text-white/60 font-medium uppercase">Google Review</span>
        </div>
      </div>

      {/* Review Text - Truncated by default, expands on hover/touch */}
      <div
        className={`
          transition-[max-height] duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden
          ${isExpanded ? 'max-h-[500px]' : 'max-h-[4.2em]'}
        `}
      >
        <p className="text-[14px] leading-[1.7] text-white/85 font-normal">
          "{reviewText}"
        </p>
      </div>

      {/* Ellipsis indicator when collapsed */}
      {!isExpanded && reviewText.length > 120 && (
        <span className="text-[12px] text-white/40 mt-1 block transition-opacity duration-300">...קרא עוד</span>
      )}

      {/* Reviewer Name */}
      <div className="flex items-center gap-2 mt-3">
        <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
          <span className="text-xs font-bold text-[#D4AF37]">
            {reviewerName.charAt(0)}
          </span>
        </div>
        <span className="text-sm font-medium text-white/70">{reviewerName}</span>
      </div>
    </CardWrapper>
  );
};

export default ProductReviewCard;
