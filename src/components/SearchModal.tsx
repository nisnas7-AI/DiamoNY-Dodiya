import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { supabase } from "@/integrations/supabase/client";
import { type ProductSearchResult } from "@/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);

      try {
        const searchTerm = `%${query}%`;
        
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            price,
            main_image_url,
            category_id,
            categories(name)
          `)
          .eq("is_active", true)
          .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},gold_type.ilike.${searchTerm},stone_type.ilike.${searchTerm}`)
          .order("is_featured", { ascending: false })
          .limit(8);

        if (error) throw error;

        setResults(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            main_image_url: p.main_image_url,
            category_name: (p.categories as any)?.name || null,
            category_id: p.category_id,
          }))
        );
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (result: ProductSearchResult) => {
    onClose();
    navigate(`/catalog?product=${result.id}`);
  };

  const handleViewAll = () => {
    onClose();
    navigate(`/catalog?search=${encodeURIComponent(query)}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    onClose();
    navigate(`/catalog?category=${categoryId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" dir="rtl">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מוצרים, קטגוריות..."
            className="border-0 focus-visible:ring-0 text-base p-0 h-auto"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-right"
                >
                  {result.main_image_url ? (
                    <img
                      src={result.main_image_url}
                      alt={result.name}
                      className="w-14 h-14 object-cover rounded-md bg-muted"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.name}</p>
                    {result.category_name && (
                      <p className="text-xs text-muted-foreground">{result.category_name}</p>
                    )}
                    {result.price && (
                      <PriceDisplay
                        numericPrice={result.price}
                        size="sm"
                        forcePrefix
                      />
                    )}
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}

              {/* View All */}
              {results.length >= 5 && (
                <button
                  onClick={handleViewAll}
                  className="w-full text-center py-3 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  צפה בכל התוצאות →
                </button>
              )}
            </div>
          ) : hasSearched && query.trim() ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-2">לא נמצאו תוצאות עבור "{query}"</p>
              <p className="text-sm text-muted-foreground">נסה לחפש במונחים אחרים</p>
            </div>
          ) : !query.trim() ? (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">חיפושים נפוצים</p>
              <div className="flex flex-wrap gap-2">
                {["טבעות", "יהלום", "עגילים", "זהב לבן", "סוליטר", "פנינים"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
