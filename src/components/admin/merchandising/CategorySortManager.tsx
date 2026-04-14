import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  GripVertical,
  Loader2,
  Package,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MerchProduct {
  id: string;
  name: string;
  sku: string | null;
  main_image_url: string | null;
  display_order: number | null;
  stock_status: string | null;
  price: number | null;
  category_id: string | null;
}

// ─── Sortable Card ───
const SortableProductCard = ({
  product,
  visualOnly,
  isDragging,
}: {
  product: MerchProduct;
  visualOnly: boolean;
  isDragging: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow",
        isDragging && "ring-2 ring-[#c9a96e]/60"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      {!visualOnly && product.stock_status && (
        <div className="absolute top-2 left-2 z-10">
          <Badge
            variant={product.stock_status === "in_stock" ? "default" : "secondary"}
            className="text-[10px] px-1.5 py-0.5"
          >
            {product.stock_status === "in_stock" ? "במלאי" : product.stock_status === "made_to_order" ? "הזמנה" : "אזל"}
          </Badge>
        </div>
      )}

      <div className="aspect-square bg-muted/30 overflow-hidden">
        {product.main_image_url ? (
          <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {!visualOnly && (
        <div className="p-2.5 space-y-0.5">
          <p className="text-xs font-medium text-foreground truncate leading-tight">{product.name}</p>
          {product.sku && <p className="text-[10px] text-muted-foreground font-mono">{product.sku}</p>}
        </div>
      )}
    </motion.div>
  );
};

const DragPreviewCard = ({ product }: { product: MerchProduct }) => (
  <div className="w-40 rounded-xl border border-[#c9a96e]/60 bg-card shadow-xl overflow-hidden opacity-90 rotate-2 scale-105">
    <div className="aspect-square bg-muted/30 overflow-hidden">
      {product.main_image_url ? (
        <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
    <div className="p-2">
      <p className="text-xs font-medium truncate">{product.name}</p>
    </div>
  </div>
);

// ─── Main ───
const CategorySortManager = () => {
  const queryClient = useQueryClient();
  const { flatCategories, categoryTree, loading: catsLoading } = useCategories();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [visualOnly, setVisualOnly] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<MerchProduct[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!selectedCategoryId && flatCategories.length > 0) {
      setSelectedCategoryId(flatCategories[0].id);
    }
  }, [flatCategories, selectedCategoryId]);

  const descendantIds = useMemo(() => {
    if (!selectedCategoryId) return [];
    const getIds = (id: string): string[] => {
      const ids = [id];
      flatCategories.filter(c => c.parent_id === id).forEach(child => {
        ids.push(...getIds(child.id));
      });
      return ids;
    };
    return getIds(selectedCategoryId);
  }, [selectedCategoryId, flatCategories]);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["merch-products", selectedCategoryId, descendantIds],
    queryFn: async () => {
      if (!selectedCategoryId || descendantIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, main_image_url, display_order, stock_status, price, category_id")
        .in("category_id", descendantIds)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MerchProduct[];
    },
    enabled: !!selectedCategoryId && descendantIds.length > 0,
  });

  useEffect(() => {
    if (products) {
      setLocalOrder(products);
      setHasChanges(false);
    }
  }, [products]);

  const displayedProducts = useMemo(() => {
    if (!stockFilter) return localOrder;
    return localOrder.filter((p) => p.stock_status === stockFilter);
  }, [localOrder, stockFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setLocalOrder((prev) => {
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      setHasChanges(true);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = localOrder.map((p, idx) =>
        supabase.from("products").update({ display_order: idx }).eq("id", p.id)
      );
      const results = await Promise.all(promises);
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) throw new Error(`Failed to update ${failed.length} products`);
    },
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["merch-products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      toast({ title: "סדר המוצרים נשמר בהצלחה ✨" });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה בשמירה", description: err.message, variant: "destructive" });
    },
  });

  const activeProduct = activeId ? localOrder.find((p) => p.id === activeId) : null;

  const categoryGroups = useMemo(() => {
    return categoryTree.map((parent) => ({
      parent,
      children: parent.children || [],
    }));
  }, [categoryTree]);

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Category Sidebar */}
      <aside className="w-52 shrink-0 border-l border-[#1f1f1f] bg-[#0d0d0d] overflow-y-auto">
        <div className="p-3">
          <p className="text-[10px] uppercase tracking-widest text-[#555] mb-3 px-2">קטגוריות</p>
          <nav className="space-y-0.5">
            {categoryGroups.map(({ parent, children }) => (
              <div key={parent.id}>
                <button
                  onClick={() => setSelectedCategoryId(parent.id)}
                  className={cn(
                    "w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    selectedCategoryId === parent.id
                      ? "bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20"
                      : "text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]"
                  )}
                >
                  {parent.name}
                </button>
                {children.length > 0 && (
                  <div className="mr-3 mt-0.5 mb-1 space-y-0.5">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedCategoryId(child.id)}
                        className={cn(
                          "w-full text-right px-3 py-1.5 rounded-md text-[11px] transition-all",
                          selectedCategoryId === child.id
                            ? "bg-[#c9a96e]/10 text-[#c9a96e]"
                            : "text-[#666] hover:text-[#aaa] hover:bg-[#151515]"
                        )}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-medium text-white">
              {flatCategories.find((c) => c.id === selectedCategoryId)?.name || "בחר קטגוריה"}
            </h2>
            <p className="text-[11px] text-[#666]">{displayedProducts.length} מוצרים • גרור לסידור מחדש</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Visual-Only Toggle */}
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-lg px-2.5 py-1.5 border border-[#1f1f1f]">
              {visualOnly ? <EyeOff className="w-3.5 h-3.5 text-[#c9a96e]" /> : <Eye className="w-3.5 h-3.5 text-[#888]" />}
              <span className="text-[10px] text-[#888]">ויזואלי</span>
              <Switch checked={visualOnly} onCheckedChange={setVisualOnly} className="data-[state=checked]:bg-[#c9a96e] h-4 w-8" />
            </div>

            {/* Responsive Preview */}
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-lg px-2.5 py-1.5 border border-[#1f1f1f]">
              <button onClick={() => setMobilePreview(false)} className={cn("p-1 rounded", !mobilePreview ? "text-[#c9a96e]" : "text-[#555]")}>
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setMobilePreview(true)} className={cn("p-1 rounded", mobilePreview ? "text-[#c9a96e]" : "text-[#555]")}>
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stock Filter */}
            <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg px-2 py-1.5 border border-[#1f1f1f]">
              <Filter className="w-3.5 h-3.5 text-[#888]" />
              {[
                { value: null, label: "הכל" },
                { value: "in_stock", label: "במלאי" },
                { value: "made_to_order", label: "הזמנה" },
              ].map((opt) => (
                <button
                  key={opt.value ?? "all"}
                  onClick={() => setStockFilter(opt.value)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md transition-colors",
                    stockFilter === opt.value ? "bg-[#c9a96e]/20 text-[#c9a96e]" : "text-[#666] hover:text-[#999]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Save */}
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              className={cn(
                "gap-1.5 text-xs",
                hasChanges ? "bg-[#c9a96e] hover:bg-[#b8924f] text-black" : "bg-[#1a1a1a] text-[#555] border border-[#1f1f1f]"
              )}
            >
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasChanges ? <Save className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {hasChanges ? "שמור שינויים" : "שמור"}
            </Button>
          </div>
        </div>

        {productsLoading || catsLoading ? (
          <div className={cn("grid gap-3", mobilePreview ? "grid-cols-2 max-w-md mx-auto" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl bg-[#1a1a1a]" />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-10 h-10 text-[#333] mb-3" />
            <p className="text-sm text-[#666]">אין מוצרים בקטגוריה זו</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={displayedProducts.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className={cn("grid gap-3 transition-all duration-300", mobilePreview ? "grid-cols-2 max-w-md mx-auto" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
                <AnimatePresence mode="popLayout">
                  {displayedProducts.map((product) => (
                    <SortableProductCard key={product.id} product={product} visualOnly={visualOnly} isDragging={activeId === product.id} />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
              {activeProduct ? <DragPreviewCard product={activeProduct} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default CategorySortManager;
