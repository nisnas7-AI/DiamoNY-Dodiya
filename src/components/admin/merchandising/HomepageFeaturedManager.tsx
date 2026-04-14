import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Save,
  Loader2,
  Package,
  CheckCircle2,
  Search,
} from "lucide-react";

interface FeaturedProduct {
  id: string;
  name: string;
  sku: string | null;
  main_image_url: string | null;
  is_featured: boolean | null;
  stock_status: string | null;
  category_id: string | null;
}

const HomepageFeaturedManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [featuredState, setFeaturedState] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["merch-featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, main_image_url, is_featured, stock_status, category_id")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as FeaturedProduct[];
    },
    staleTime: 0,
  });

  // Init local state from DB
  const initialFeatured = useMemo(() => {
    const map: Record<string, boolean> = {};
    products?.forEach((p) => {
      map[p.id] = !!p.is_featured;
    });
    return map;
  }, [products]);

  const getFeatured = (id: string) =>
    featuredState[id] ?? initialFeatured[id] ?? false;

  const toggleFeatured = (id: string) => {
    const current = getFeatured(id);
    setFeaturedState((prev) => ({ ...prev, [id]: !current }));
    setHasChanges(true);
  };

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, search]);

  const selectedCount = useMemo(() => {
    if (!products) return 0;
    return products.filter((p) => getFeatured(p.id)).length;
  }, [products, featuredState, initialFeatured]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const changed = Object.entries(featuredState).filter(
        ([id, val]) => val !== (initialFeatured[id] ?? false)
      );
      if (changed.length === 0) return;
      const promises = changed.map(([id, is_featured]) =>
        supabase.from("products").update({ is_featured }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) throw new Error(`Failed to update ${failed.length} products`);
    },
    onSuccess: () => {
      setHasChanges(false);
      setFeaturedState({});
      queryClient.invalidateQueries({ queryKey: ["merch-featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      toast({ title: "המוצרים הנבחרים עודכנו בהצלחה ✨" });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה בשמירה", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-white">מוצרים נבחרים לדף הבית</h2>
          <p className="text-[11px] text-[#666]">
            סמן מוצרים שיוצגו באזור "Ready to Wear" בדף הבית • {selectedCount} נבחרו
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          className={cn(
            "gap-1.5 text-xs",
            hasChanges
              ? "bg-[#c9a96e] hover:bg-[#b8924f] text-black"
              : "bg-[#1a1a1a] text-[#555] border border-[#1f1f1f]"
          )}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasChanges ? (
            <Save className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          {hasChanges ? "שמור שינויים" : "שמור"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
        <input
          type="text"
          placeholder="חפש לפי שם או SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg pr-9 pl-3 py-2 text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a96e]/40"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl bg-[#1a1a1a]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((product) => {
            const checked = getFeatured(product.id);
            return (
              <div
                key={product.id}
                onClick={() => toggleFeatured(product.id)}
                className={cn(
                  "group relative rounded-xl border overflow-hidden cursor-pointer transition-all",
                  checked
                    ? "border-[#c9a96e]/60 ring-1 ring-[#c9a96e]/30 bg-[#c9a96e]/5"
                    : "border-border/40 bg-card hover:border-[#333]"
                )}
              >
                {/* Checkbox */}
                <div className="absolute top-2 right-2 z-10">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleFeatured(product.id)}
                    className="h-5 w-5 border-2 border-white/60 data-[state=checked]:bg-[#c9a96e] data-[state=checked]:border-[#c9a96e]"
                  />
                </div>

                {/* Stock badge */}
                {product.stock_status && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge
                      variant={product.stock_status === "in_stock" ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      {product.stock_status === "in_stock" ? "במלאי" : "הזמנה"}
                    </Badge>
                  </div>
                )}

                {/* Image */}
                <div className="aspect-square bg-muted/30 overflow-hidden">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-0.5">
                  <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                  {product.sku && (
                    <p className="text-[10px] text-muted-foreground font-mono">{product.sku}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HomepageFeaturedManager;
