import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Phone, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface PopupContent {
  title: string | null;
  content: string | null;
  metadata: {
    phone?: string;
    image_url?: string;
    cta_text?: string;
    cta_url?: string;
  } | null;
}

const GoldBuyingBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: popupContent } = useQuery({
    queryKey: ["gold-buying-popup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "gold-buying-popup")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as PopupContent | null;
    },
  });

  if (!popupContent) return null;

  const phone = popupContent.metadata?.phone || "054-6290534";
  const ctaText = popupContent.metadata?.cta_text || "לפרטים נוספים";
  const ctaUrl = popupContent.metadata?.cta_url || "/gold-buying";
  const imageUrl = popupContent.metadata?.image_url;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={`fixed top-32 left-4 z-40 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-pulse-slow hover:animate-none ${isScrolled ? 'opacity-70 hover:opacity-100' : 'opacity-100'}`}
          aria-label="קונה זהב במזומן"
        >
          <Coins className="h-5 w-5" />
          <span className="font-semibold text-sm">קונה זהב במזומן</span>
        </button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-right">
          <SheetTitle className="text-2xl font-heading text-amber-600 flex items-center gap-2">
            <Coins className="h-6 w-6" />
            {popupContent.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={popupContent.title || "קונה זהב"}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div className="prose prose-sm max-w-none text-right">
            <ReactMarkdown>{popupContent.content || ""}</ReactMarkdown>
          </div>

          {/* Phone Button */}
          <a
            href={`tel:${phone.replace(/-/g, "")}`}
            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all duration-300"
          >
            <Phone className="h-5 w-5" />
            <span>{phone}</span>
          </a>

          {/* CTA Button */}
          <Link
            to={ctaUrl}
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-foreground text-background py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <span>{ctaText}</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GoldBuyingBanner;
