import { memo } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";

interface EmptyWorkspaceProps {
  categoryLabel: string;
  onAddWidget: () => void;
}

const EmptyWorkspace = memo(({ categoryLabel, onAddWidget }: EmptyWorkspaceProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center"
    >
      {/* Decorative diamond icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", damping: 15 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c9a96e]/10 to-[#c9a96e]/5 border border-[#c9a96e]/20 flex items-center justify-center mb-6"
      >
        <Sparkles className="w-8 h-8 text-[#c9a96e]/60" />
      </motion.div>

      <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
        {categoryLabel}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
        סביבת העבודה ריקה. הוסף ווידג'טים כדי להתחיל לבנות את הדשבורד שלך.
      </p>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAddWidget}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a96e] text-[#0f0f0f] font-medium text-sm shadow-lg shadow-[#c9a96e]/20 hover:bg-[#d4b87a] transition-colors"
      >
        <Plus className="w-4 h-4" />
        התחל לבנות את סביבת העבודה
      </motion.button>
    </motion.div>
  );
});

EmptyWorkspace.displayName = "EmptyWorkspace";
export default EmptyWorkspace;
