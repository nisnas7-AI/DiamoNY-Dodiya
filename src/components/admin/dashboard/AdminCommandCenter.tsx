import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Lock as LockIcon, Plus, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboardPrefs, type WidgetConfig } from "@/hooks/useAdminDashboardPrefs";
import AdminWidgetCard from "./AdminWidgetCard";
import { toast } from "sonner";

interface AdminCommandCenterProps {
  onDrillDown: (tab: string) => void;
}

const AdminCommandCenter = ({ onDrillDown }: AdminCommandCenterProps) => {
  const [editMode, setEditMode] = useState(false);
  const { widgets, isLoading, saveMutation } = useAdminDashboardPrefs();
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[] | null>(null);
  const navigate = useNavigate();

  const activeWidgets = localWidgets || widgets;

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

  const statsMap: Record<string, { value: string | number; label: string }> = {
    leads: { value: leadsCount ?? "—", label: "פניות" },
    blog: { value: postsCount ?? "—", label: "מאמרים" },
    vault: { value: vipCount ?? "—", label: "חברי VIP" },
    catalog: { value: productsCount ?? "—", label: "מוצרים פעילים" },
  };

  const handleToggleVisibility = useCallback((id: string) => {
    setLocalWidgets(prev => {
      const current = prev || widgets;
      return current.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    });
  }, [widgets]);

  const handleSaveLayout = useCallback(() => {
    const current = localWidgets || widgets;
    saveMutation.mutate({
      widgetOrder: current.map(w => w.id),
      hiddenWidgets: current.filter(w => !w.visible).map(w => w.id),
    }, {
      onSuccess: () => {
        setEditMode(false);
        setLocalWidgets(null);
        toast.success("פריסת הדשבורד נשמרה");
      },
    });
  }, [localWidgets, widgets, saveMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setLocalWidgets(null);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const visibleWidgets = editMode ? activeWidgets : activeWidgets.filter(w => w.visible);

  return (
    <div className="space-y-6">
      {/* Header with Edit Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">מרכז הפיקוד</h2>
          <p className="text-sm text-muted-foreground">לחץ על ווידג'ט כדי להיכנס לניהול המלא</p>
        </div>
        <div className="flex items-center gap-3">
          {editMode && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>ביטול</Button>
              <Button size="sm" onClick={handleSaveLayout} disabled={saveMutation.isPending}
                className="bg-accent text-accent-foreground hover:bg-accent/90">
                שמור פריסה
              </Button>
            </motion.div>
          )}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            {editMode ? <Pencil className="w-4 h-4 text-accent" /> : <LockIcon className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs font-medium text-muted-foreground">
              {editMode ? "עריכה" : "נעול"}
            </span>
            <Switch
              checked={editMode}
              onCheckedChange={setEditMode}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {visibleWidgets.map((widget) => (
            <AdminWidgetCard
              key={widget.id}
              widget={widget}
              editMode={editMode}
              onDrillDown={onDrillDown}
              onToggleVisibility={handleToggleVisibility}
              stat={statsMap[widget.id]}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdminCommandCenter;
