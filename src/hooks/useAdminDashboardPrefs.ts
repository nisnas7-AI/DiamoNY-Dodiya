import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";

export interface WidgetConfig {
  id: string;
  label: string;
  icon: string;
  tab: string;
  visible: boolean;
  /** Optional description shown in the add-widget menu */
  description?: string;
}

/**
 * Master widget registry — every possible widget across ALL categories.
 * Each widget has a unique id; the sidebar categories reference these ids.
 */
const DEFAULT_WIDGETS: WidgetConfig[] = [
  // ── Dashboard ──
  { id: "marketing", label: "סטטיסטיקת חנות", icon: "BarChart3", tab: "marketing", visible: true, description: "נתוני תנועה ומכירות" },
  { id: "pricing", label: "תמחור גלובלי", icon: "DollarSign", tab: "pricing", visible: true, description: "מחירי זהב ותמחור" },

  // ── CRM ──
  { id: "vault", label: "הכספת VIP", icon: "Lock", tab: "vault", visible: true, description: "ניהול חברי VIP" },
  { id: "recent-vips", label: "VIP אחרונים", icon: "Crown", tab: "vault", visible: true, description: "חברי VIP שהצטרפו לאחרונה" },
  { id: "new-leads", label: "לידים חדשים", icon: "UserPlus", tab: "leads", visible: true, description: "פניות חדשות שטרם טופלו" },
  { id: "form-submissions", label: "הגשות טפסים", icon: "ClipboardList", tab: "forms", visible: true, description: "טפסי יצירת קשר שהתקבלו" },
  { id: "vault-approvals", label: "אישורי כספת", icon: "ShieldCheck", tab: "vault", visible: true, description: "בקשות גישה ממתינות" },
  { id: "production-pipeline", label: "תהליכי ייצור", icon: "Hammer", tab: "production-pipeline", visible: true, description: "ניהול פרויקטים בהזמנה אישית" },

  // ── Leads (direct tab) ──
  { id: "leads", label: "לידים", icon: "Mail", tab: "leads", visible: true, description: "ניהול פניות" },
  { id: "forms", label: "טפסי לידים", icon: "FormInput", tab: "forms", visible: true, description: "הגדרות טפסים" },

  // ── Catalog / Inventory / Blog (direct tabs) ──
  { id: "catalog", label: "קטלוג", icon: "FolderOpen", tab: "catalog-link", visible: true, description: "ניהול מוצרים" },
  { id: "inventory", label: "מלאי", icon: "Package", tab: "inventory-link", visible: true, description: "ניהול מלאי" },
  { id: "blog", label: "בלוג", icon: "FileText", tab: "blog", visible: true, description: "ניהול מאמרים" },

  // ── VIP Hub ──
  // vault already defined above

  // ── Content ──
  { id: "homepage", label: "עמוד הבית", icon: "Home", tab: "homepage", visible: true, description: "עריכת עמוד הבית" },
  { id: "pages", label: "עמודים דינמיים", icon: "Layers", tab: "pages", visible: true, description: "עמודי תוכן" },
  { id: "content", label: "ניהול תוכן", icon: "Settings", tab: "content", visible: true, description: "תכני אתר" },
  { id: "stories", label: "סיפורי מוצרים", icon: "BookOpen", tab: "stories", visible: true, description: "תוכן מוצר" },
  { id: "certificates", label: "תעודות גמולוגיות", icon: "ShieldCheck", tab: "certificates", visible: true, description: "ניהול תעודות מעבדה" },
  { id: "legal-forms", label: "טפסים משפטיים", icon: "Scale", tab: "legal-forms", visible: true, description: "תקנון ומדיניות פרטיות" },

  // ── Site & SEO ──
  { id: "social", label: "רשתות חברתיות", icon: "Share2", tab: "social", visible: true, description: "הגדרות רשתות" },
  { id: "legal", label: "עמודים משפטיים", icon: "Scale", tab: "legal", visible: true, description: "תנאים ופרטיות" },
  { id: "robots", label: "Robots.txt", icon: "Bot", tab: "robots", visible: true, description: "קובץ רובוטים" },

  // ── Settings ──
  { id: "security", label: "הגדרות אבטחה", icon: "ShieldCheck", tab: "security", visible: true, description: "MFA וביומטרי" },
  { id: "settings", label: "הגדרות", icon: "Settings", tab: "settings", visible: true, description: "PIN והגדרות כלליות" },
];

export function useAdminDashboardPrefs() {
  const { data: prefs, isLoading } = useQuery({
    queryKey: ["admin-dashboard-prefs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("admin_dashboard_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return data as any;
    },
  });

  const widgets: WidgetConfig[] = (() => {
    if (!prefs) return DEFAULT_WIDGETS;
    const order = (prefs.widget_order as string[]) || [];
    const hidden = new Set((prefs.hidden_widgets as string[]) || []);

    if (order.length === 0) {
      return DEFAULT_WIDGETS.map(w => ({ ...w, visible: !hidden.has(w.id) }));
    }

    const widgetMap = new Map(DEFAULT_WIDGETS.map(w => [w.id, w]));
    const ordered: WidgetConfig[] = [];

    for (const id of order) {
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
  })();

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["admin-dashboard-prefs"]],
    successMessage: "פריסת האדמין נשמרה בהצלחה",
    errorMessage: (error) => error.message || "שמירת פריסת האדמין נכשלה",
    mutationFn: async ({ widgetOrder, hiddenWidgets }: { widgetOrder: string[]; hiddenWidgets: string[] }, signal) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        widget_order: widgetOrder,
        hidden_widgets: hiddenWidgets,
      };

      const existingRequest = supabase
        .from("admin_dashboard_preferences" as any)
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle() as any;

      const { data: existing, error: existingError } = await existingRequest.abortSignal(signal);

      if (existingError) throw existingError;

      if (existing) {
        const updateRequest = supabase
          .from("admin_dashboard_preferences" as any)
          .update({ widget_order: widgetOrder, hidden_widgets: hiddenWidgets } as any)
          .eq("user_id", user.id) as any;

        const { error } = await updateRequest.abortSignal(signal);

        if (error) throw error;
        return;
      }

      const { error } = await supabase
          .from("admin_dashboard_preferences" as any)
          .insert(payload as any);
      if (error) throw error;
    },
  });

  return { widgets, isLoading, saveMutation };
}

export { DEFAULT_WIDGETS };
