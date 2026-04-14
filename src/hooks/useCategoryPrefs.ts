import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import type { WidgetConfig } from "./useAdminDashboardPrefs";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";

interface CategoryLayout {
  widget_order: string[];
  hidden_widgets: string[];
}

export function useCategoryPrefs(categoryId: string, defaults: WidgetConfig[]) {
  const { data: prefs, isLoading } = useQuery({
    queryKey: ["admin-dashboard-prefs"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("admin_dashboard_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return data as any;
    },
  });

  const widgets: WidgetConfig[] = useMemo(() => {
    if (!prefs) return defaults;

    const layouts = (prefs.category_layouts as Record<string, CategoryLayout>) || {};
    const layout = layouts[categoryId];

    if (!layout || !layout.widget_order?.length) {
      // Fallback: for "dashboard" category, use legacy columns
      if (categoryId === "dashboard") {
        const order = (prefs.widget_order as string[]) || [];
        const hidden = new Set((prefs.hidden_widgets as string[]) || []);
        const defaultIds = new Set(defaults.map((w) => w.id));

        if (order.length === 0) {
          return defaults.map((w) => ({ ...w, visible: !hidden.has(w.id) }));
        }

        const widgetMap = new Map(defaults.map((w) => [w.id, w]));
        const ordered: WidgetConfig[] = [];

        for (const id of order) {
          if (!defaultIds.has(id)) continue;
          const w = widgetMap.get(id);
          if (w) {
            ordered.push({ ...w, visible: !hidden.has(id) });
            widgetMap.delete(id);
          }
        }
        for (const w of widgetMap.values()) {
          ordered.push({ ...w, visible: !hidden.has(w.id) });
        }
        return ordered;
      }

      return defaults;
    }

    const hidden = new Set(layout.hidden_widgets || []);
    const widgetMap = new Map(defaults.map((w) => [w.id, w]));
    const ordered: WidgetConfig[] = [];

    for (const id of layout.widget_order) {
      const w = widgetMap.get(id);
      if (w) {
        ordered.push({ ...w, visible: !hidden.has(id) });
        widgetMap.delete(id);
      }
    }
    for (const w of widgetMap.values()) {
      ordered.push({ ...w, visible: !hidden.has(w.id) });
    }
    return ordered;
  }, [prefs, categoryId, defaults]);

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["admin-dashboard-prefs"]],
    successMessage: "פריסת הקטגוריה נשמרה בהצלחה",
    errorMessage: (error) => error.message || "שמירת פריסת הקטגוריה נכשלה",
    mutationFn: async ({
      widgetOrder,
      hiddenWidgets,
    }: {
      widgetOrder: string[];
      hiddenWidgets: string[];
    }, signal) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Read current category_layouts
      const existingRequest = supabase
        .from("admin_dashboard_preferences" as any)
        .select("id, category_layouts")
        .eq("user_id", user.id)
        .maybeSingle() as any;

      const { data: existing, error: existingError } = await existingRequest.abortSignal(signal);

      if (existingError) throw existingError;

      const currentLayouts = ((existing as any)?.category_layouts as Record<string, CategoryLayout>) || {};
      const updatedLayouts = {
        ...currentLayouts,
        [categoryId]: { widget_order: widgetOrder, hidden_widgets: hiddenWidgets },
      };

      if (existing) {
        const updateRequest = supabase
          .from("admin_dashboard_preferences" as any)
          .update({ category_layouts: updatedLayouts } as any)
          .eq("user_id", user.id) as any;

        const { error } = await updateRequest.abortSignal(signal);

        if (error) throw error;
        return;
      }

      const insertRequest = supabase
        .from("admin_dashboard_preferences" as any)
        .insert({
          user_id: user.id,
          category_layouts: updatedLayouts,
          widget_order: categoryId === "dashboard" ? widgetOrder : [],
          hidden_widgets: categoryId === "dashboard" ? hiddenWidgets : [],
        } as any) as any;

      const { error } = await insertRequest.abortSignal(signal);

      if (error) throw error;
    },
  });

  return {
    widgets,
    isLoading,
    saveLayout: saveMutation.mutate,
  };
}
