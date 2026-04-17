import { memo } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { featureFlags } from "@/lib/featureFlags";

export interface SidebarCategory {
  id: string;
  label: string;
  icon: string;
  /** If set, clicking drills directly into this tab instead of showing a widget canvas */
  directTab?: string;
  widgetIds: string[];
}

const DIGITAL_ATELIER_CATEGORY: SidebarCategory = {
  id: "atelier",
  label: "ניהול סטודיו דיגיטלי",
  icon: "Gem",
  directTab: "atelier",
  widgetIds: ["atelier"],
};

const SIDEBAR_CATEGORIES_ALL: SidebarCategory[] = [
  {
    id: "dashboard",
    label: "ראשי",
    icon: "LayoutDashboard",
    widgetIds: ["marketing", "pricing"],
  },
  {
    id: "crm",
    label: "לקוחות",
    icon: "Users",
    widgetIds: ["recent-vips", "new-leads", "form-submissions", "vault-approvals", "vault", "production-pipeline"],
  },
  {
    id: "leads",
    label: "לידים",
    icon: "Mail",
    directTab: "leads",
    widgetIds: ["leads", "forms"],
  },
  {
    id: "production",
    label: "ניהול ייצור",
    icon: "Factory",
    directTab: "production-pipeline",
    widgetIds: ["production-pipeline"],
  },
  {
    id: "catalog",
    label: "קטלוג",
    icon: "FolderOpen",
    directTab: "catalog-link",
    widgetIds: ["catalog"],
  },
  {
    id: "inventory",
    label: "מלאי",
    icon: "Package",
    directTab: "inventory-link",
    widgetIds: ["inventory"],
  },
  {
    id: "merchandising",
    label: "סידור ויזואלי",
    icon: "LayoutGrid",
    directTab: "merchandising-link",
    widgetIds: [],
  },
  {
    id: "vip",
    label: "טרקלין VIP",
    icon: "Crown",
    widgetIds: ["vault"],
  },
  {
    id: "content",
    label: "ניהול תוכן",
    icon: "PenTool",
    widgetIds: ["homepage", "pages", "blog", "content", "stories", "legal-forms"],
  },
  DIGITAL_ATELIER_CATEGORY,
  {
    id: "site",
    label: "אתר ו-SEO",
    icon: "Globe",
    widgetIds: ["social", "legal", "robots"],
  },
  {
    id: "nfc",
    label: "קטלוג NFC",
    icon: "Smartphone",
    directTab: "nfc-manager",
    widgetIds: ["nfc-manager"],
  },
  {
    id: "brand",
    label: "הגדרות מותג",
    icon: "Palette",
    directTab: "brand-settings",
    widgetIds: ["brand-settings"],
  },
  {
    id: "settings",
    label: "הגדרות",
    icon: "SlidersHorizontal",
    widgetIds: ["security", "settings"],
  },
];

export const SIDEBAR_CATEGORIES: SidebarCategory[] = SIDEBAR_CATEGORIES_ALL.filter(
  (c) => c.id !== "nfc" || featureFlags.nfcCatalog
);

const iconMap: Record<string, any> = {
  LayoutDashboard: Icons.LayoutDashboard,
  Crown: Icons.Crown,
  PenTool: Icons.PenTool,
  Globe: Icons.Globe,
  SlidersHorizontal: Icons.SlidersHorizontal,
  Mail: Icons.Mail,
  FolderOpen: Icons.FolderOpen,
  Package: Icons.Package,
  FileText: Icons.FileText,
  Users: Icons.Users,
  Factory: Icons.Factory,
  Smartphone: Icons.Smartphone,
  Palette: Icons.Palette,
  LayoutGrid: Icons.LayoutGrid,
  Gem: Icons.Gem,
};

interface AdminSidebarProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const AdminSidebar = memo(({ activeCategory, onCategoryChange, collapsed, onToggleCollapse }: AdminSidebarProps) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed top-0 left-0 h-screen z-40 flex flex-col bg-[#0f0f0f] border-r border-[#1f1f1f] shadow-2xl"
      style={{ direction: "ltr" }}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#1f1f1f]">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-serif font-bold tracking-wider text-[#c9a96e]"
          >
            DiamoNY Admin
          </motion.span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          {collapsed ? (
            <Icons.PanelLeftOpen className="w-4 h-4 text-[#888]" />
          ) : (
            <Icons.PanelLeftClose className="w-4 h-4 text-[#888]" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {SIDEBAR_CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon] || Icons.Settings;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                "hover:bg-[#1a1a1a]",
                isActive
                  ? "bg-[#1a1a1a] text-[#c9a96e]"
                  : "text-[#888] hover:text-[#ccc]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#c9a96e]"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#c9a96e]" : "")} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {cat.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-[#1f1f1f]">
          <p className="text-[10px] text-[#555] text-center tracking-wide">MODULAR WORKSPACE</p>
        </div>
      )}
    </motion.aside>
  );
});

AdminSidebar.displayName = "AdminSidebar";
export default AdminSidebar;
