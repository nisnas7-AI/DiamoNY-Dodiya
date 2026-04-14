import { useState, memo, useMemo } from "react";
import { Plus, X, Search } from "lucide-react";
import * as Icons from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_WIDGETS, type WidgetConfig } from "@/hooks/useAdminDashboardPrefs";

const LIBRARY_GROUPS: { id: string; label: string; widgetIds: string[] }[] = [
  { id: "crm", label: "CRM ולקוחות", widgetIds: ["vault", "recent-vips", "new-leads", "form-submissions", "vault-approvals", "leads", "forms"] },
  { id: "catalog", label: "קטלוג ומלאי", widgetIds: ["catalog", "inventory", "pricing"] },
  { id: "content", label: "תוכן ובלוג", widgetIds: ["blog", "homepage", "pages", "content", "stories", "certificates"] },
  { id: "site", label: "אתר ו-SEO", widgetIds: ["social", "legal", "robots"] },
  { id: "analytics", label: "אנליטיקה", widgetIds: ["marketing"] },
  { id: "settings", label: "הגדרות", widgetIds: ["security", "settings"] },
];

const iconMap: Record<string, any> = {
  Mail: Icons.Mail, FileText: Icons.FileText, Lock: Icons.Lock,
  FolderOpen: Icons.FolderOpen, Package: Icons.Package, Home: Icons.Home,
  DollarSign: Icons.DollarSign, Layers: Icons.Layers, BookOpen: Icons.BookOpen,
  Settings: Icons.Settings, Share2: Icons.Share2, FormInput: Icons.FormInput,
  Scale: Icons.Scale, Bot: Icons.Bot, BarChart3: Icons.BarChart3,
  ShieldCheck: Icons.ShieldCheck, Crown: Icons.Crown, UserPlus: Icons.UserPlus,
  ClipboardList: Icons.ClipboardList, Users: Icons.Users,
};

interface AddWidgetMenuProps {
  activeWidgetIds: Set<string>;
  onAddWidget: (widget: WidgetConfig) => void;
}

const AddWidgetMenu = memo(({ activeWidgetIds, onAddWidget }: AddWidgetMenuProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const widgetMap = useMemo(() => new Map(DEFAULT_WIDGETS.map((w) => [w.id, w])), []);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LIBRARY_GROUPS.map((group) => {
      const widgets = group.widgetIds
        .map((id) => widgetMap.get(id))
        .filter((w): w is WidgetConfig => {
          if (!w) return false;
          if (!q) return true;
          return w.label.toLowerCase().includes(q) || (w.description || "").toLowerCase().includes(q);
        });
      return { ...group, widgets };
    }).filter((g) => g.widgets.length > 0);
  }, [search, widgetMap]);

  const displayedGroups = activeGroup
    ? filteredGroups.filter((g) => g.id === activeGroup)
    : filteredGroups;

  const handleAdd = (widget: WidgetConfig) => {
    onAddWidget(widget);
    setOpen(false);
    setSearch("");
    setActiveGroup(null);
  };

  const handleClose = () => {
    setOpen(false);
    setSearch("");
    setActiveGroup(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] transition-all shadow-[0_0_8px_rgba(212,175,55,0.15)]"
      >
        <Plus className="w-4 h-4" />
        הוסף ווידג'ט
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent
          className="w-full max-w-3xl min-h-[50vh] max-h-[80vh] overflow-hidden flex flex-col border-border/60 bg-[#1a1a1a] text-white shadow-2xl rounded-2xl p-0 gap-0 [&>button]:text-white"
          style={{ zIndex: 60 }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif font-bold text-white">
                ספריית ווידג'טים
              </DialogTitle>
              <p className="text-sm text-white/50 mt-1">בחר ווידג'ט להוספה לסביבת העבודה הנוכחית</p>
            </DialogHeader>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש ווידג'ט..."
                autoFocus
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]/50 transition-all"
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveGroup(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !activeGroup
                    ? "bg-[#D4AF37] text-[#1a1a1a] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                    : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white/80"
                }`}
              >
                הכל
              </button>
              {LIBRARY_GROUPS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id === activeGroup ? null : g.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeGroup === g.id
                      ? "bg-[#D4AF37] text-[#1a1a1a] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                      : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white/80"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Widget grid — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {displayedGroups.map((group) => (
              <div key={group.id}>
                <p className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-wider mb-3">
                  {group.label}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.widgets.map((widget) => {
                    const Icon = iconMap[widget.icon] || Icons.Settings;
                    const isActive = activeWidgetIds.has(widget.id);

                    return (
                      <button
                        key={widget.id}
                        onClick={() => !isActive && handleAdd(widget)}
                        disabled={isActive}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl border text-right transition-all
                          ${isActive
                            ? "border-white/5 opacity-40 cursor-not-allowed bg-white/3"
                            : "border-white/10 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 cursor-pointer hover:shadow-[0_4px_20px_rgba(212,175,55,0.1)]"
                          }
                        `}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-white/5" : "bg-[#D4AF37]/10"
                        }`}>
                          <Icon className={`w-5 h-5 ${isActive ? "text-white/30" : "text-[#D4AF37]"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold ${isActive ? "text-white/40" : "text-white"}`}>
                            {widget.label}
                          </p>
                          {widget.description && (
                            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{widget.description}</p>
                          )}
                        </div>
                        {isActive ? (
                          <span className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-white/40 shrink-0">פעיל</span>
                        ) : (
                          <Plus className="w-4 h-4 text-[#D4AF37]/60 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {displayedGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-10 h-10 text-white/15 mb-4" />
                <p className="text-sm text-white/40">לא נמצאו ווידג'טים</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

AddWidgetMenu.displayName = "AddWidgetMenu";
export default AddWidgetMenu;
