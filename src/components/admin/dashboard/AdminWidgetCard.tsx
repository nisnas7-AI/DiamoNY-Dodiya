import { memo } from "react";
import { motion } from "framer-motion";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import * as Icons from "lucide-react";
import type { WidgetConfig } from "@/hooks/useAdminDashboardPrefs";

interface AdminWidgetCardProps {
  widget: WidgetConfig;
  editMode: boolean;
  onDrillDown: (tab: string) => void;
  onToggleVisibility?: (id: string) => void;
  stat?: { value: string | number; label: string };
}

const iconMap: Record<string, any> = {
  Mail: Icons.Mail, FileText: Icons.FileText, Lock: Icons.Lock,
  FolderOpen: Icons.FolderOpen, Package: Icons.Package, Home: Icons.Home,
  DollarSign: Icons.DollarSign, Layers: Icons.Layers, BookOpen: Icons.BookOpen,
  Settings: Icons.Settings, Share2: Icons.Share2, FormInput: Icons.FormInput,
  Scale: Icons.Scale, Bot: Icons.Bot, BarChart3: Icons.BarChart3,
  ShieldCheck: Icons.ShieldCheck, Crown: Icons.Crown, UserPlus: Icons.UserPlus,
  ClipboardList: Icons.ClipboardList, Users: Icons.Users,
};

const AdminWidgetCard = memo(({ widget, editMode, onDrillDown, onToggleVisibility, stat }: AdminWidgetCardProps) => {
  const IconComponent = iconMap[widget.icon] || Icons.Settings;

  const handleClick = () => {
    if (editMode) return;
    onDrillDown(widget.tab);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: widget.visible ? 1 : 0.5, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={editMode ? {} : { y: -4, transition: { duration: 0.2 } }}
      className={`
        relative group rounded-2xl border border-border/50 bg-card
        shadow-[0_8px_30px_rgb(0,0,0,0.06)]
        transition-all duration-300 cursor-pointer overflow-hidden
        ${editMode ? "ring-2 ring-dashed ring-accent/30" : "hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)]"}
        ${!widget.visible ? "opacity-50 grayscale" : ""}
      `}
      onClick={handleClick}
    >
      {editMode && (
        <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10">
          <div className="cursor-grab active:cursor-grabbing p-1 rounded-md bg-muted/80 backdrop-blur-sm">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(widget.id);
            }}
            className="p-1 rounded-md bg-muted/80 backdrop-blur-sm hover:bg-accent/20 transition-colors"
          >
            {widget.visible ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      )}

      <div className="p-6 flex flex-col items-center justify-center text-center min-h-[140px] gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center transition-colors group-hover:bg-accent/20">
          <IconComponent className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground">{widget.label}</h3>
          {stat && (
            <div className="mt-1">
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-0.5 bg-gradient-to-l from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
});

AdminWidgetCard.displayName = "AdminWidgetCard";
export default AdminWidgetCard;
