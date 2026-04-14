import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import SortableWidgetGrid from "./SortableWidgetGrid";
import { SIDEBAR_CATEGORIES } from "./AdminSidebar";
import { DEFAULT_WIDGETS, type WidgetConfig } from "@/hooks/useAdminDashboardPrefs";
import { useCategoryPrefs } from "@/hooks/useCategoryPrefs";

interface CategoryWidgetCanvasProps {
  categoryId: string;
  onDrillDown: (tab: string) => void;
  searchFilter?: string;
}

const CategoryWidgetCanvas = ({ categoryId, onDrillDown, searchFilter = "" }: CategoryWidgetCanvasProps) => {
  const category = SIDEBAR_CATEGORIES.find((c) => c.id === categoryId);
  const allowedIds = new Set(category?.widgetIds || []);

  // Default widgets for this category (initial set)
  const categoryDefaults = useMemo(
    () => DEFAULT_WIDGETS.filter((w) => allowedIds.has(w.id)),
    [categoryId]
  );

  const { widgets, isLoading, saveLayout } = useCategoryPrefs(categoryId, categoryDefaults);
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[] | null>(null);

  const filteredWidgets = useMemo(() => {
    const base = localWidgets || widgets;
    if (!searchFilter.trim()) return base;
    const q = searchFilter.trim().toLowerCase();
    return base.filter((w) => w.label.toLowerCase().includes(q));
  }, [localWidgets, widgets, searchFilter]);

  const activeWidgets = filteredWidgets;

  // Stats queries
  const { data: leadsCount } = useQuery({
    queryKey: ["leads-count-widget"],
    queryFn: async () => {
      const { count } = await (supabase as any).from("leads").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: postsCount } = useQuery({
    queryKey: ["posts-count-widget"],
    queryFn: async () => {
      const { count } = await supabase.from("blog_posts").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: vipCount } = useQuery({
    queryKey: ["vip-count-widget"],
    queryFn: async () => {
      const { count } = await supabase.from("vip_members").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: productsCount } = useQuery({
    queryKey: ["products-count-widget"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
  });

  const { data: ordersCount } = useQuery({
    queryKey: ["orders-count-widget"],
    queryFn: async () => {
      const { count } = await (supabase as any).from("custom_orders").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: newLeadsCount } = useQuery({
    queryKey: ["new-leads-count-widget"],
    queryFn: async () => {
      const { count } = await (supabase as any).from("leads").select("*", { count: "exact", head: true }).eq("status", "new");
      return count || 0;
    },
  });

  const statsMap: Record<string, { value: string | number; label: string }> = {
    leads: { value: leadsCount ?? "—", label: "פניות" },
    "new-leads": { value: newLeadsCount ?? "—", label: "לידים חדשים" },
    "form-submissions": { value: leadsCount ?? "—", label: "הגשות" },
    blog: { value: postsCount ?? "—", label: "מאמרים" },
    vault: { value: vipCount ?? "—", label: "חברי VIP" },
    "recent-vips": { value: vipCount ?? "—", label: "חברי VIP" },
    "vault-approvals": { value: "—", label: "ממתינים" },
    catalog: { value: productsCount ?? "—", label: "מוצרים פעילים" },
    inventory: { value: productsCount ?? "—", label: "פריטים" },
    marketing: { value: "—", label: "סטטיסטיקה" },
    pricing: { value: "—", label: "תמחור" },
    "production-pipeline": { value: ordersCount ?? "—", label: "פרויקטים" },
  };

  const handleReorder = useCallback((reordered: WidgetConfig[]) => {
    setLocalWidgets(reordered);
  }, []);

  const handleToggleVisibility = useCallback(
    (id: string) => {
      setLocalWidgets((prev) => {
        const current = prev || activeWidgets;
        return current.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
      });
    },
    [activeWidgets]
  );

  // Unconstrained: any widget from DEFAULT_WIDGETS can be added to any category
  const handleAddWidget = useCallback(
    (widget: WidgetConfig) => {
      setLocalWidgets((prev) => {
        const current = prev || activeWidgets;
        const existing = current.find((w) => w.id === widget.id);
        if (existing) {
          return current.map((w) => (w.id === widget.id ? { ...w, visible: true } : w));
        }
        return [...current, { ...widget, visible: true }];
      });
    },
    [activeWidgets]
  );

  const handleSave = useCallback(() => {
    const current = localWidgets || activeWidgets;
    saveLayout(
      {
        widgetOrder: current.map((w) => w.id),
        hiddenWidgets: current.filter((w) => !w.visible).map((w) => w.id),
      },
      {
        onSuccess: () => {
          setLocalWidgets(null);
          toast.success("פריסת הקטגוריה נשמרה");
        },
      }
    );
  }, [localWidgets, activeWidgets, saveLayout]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: category?.widgetIds.length || 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <SortableWidgetGrid
      widgets={activeWidgets}
      categoryLabel={category?.label || ""}
      onDrillDown={onDrillDown}
      onReorder={handleReorder}
      onToggleVisibility={handleToggleVisibility}
      onAddWidget={handleAddWidget}
      onSave={handleSave}
      isSaving={false}
      statsMap={statsMap}
    />
  );
};

export default CategoryWidgetCanvas;
