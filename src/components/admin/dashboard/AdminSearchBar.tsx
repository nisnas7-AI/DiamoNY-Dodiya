import { useState, useRef, useEffect, memo } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const AdminSearchBar = memo(({ value, onChange }: AdminSearchBarProps) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    if (!open && value) onChange("");
  }, [open]);

  return (
    <div className="flex items-center gap-1">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="חיפוש ווידג'טים..."
              className="h-9 text-sm border-accent/30 focus-visible:ring-accent/40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (open && value) {
            onChange("");
          } else {
            setOpen((p) => !p);
          }
        }}
        className="p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="חיפוש ניהולי"
      >
        {open && value ? (
          <X className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Search className="w-5 h-5 text-[#c9a96e]" />
        )}
      </button>
    </div>
  );
});

AdminSearchBar.displayName = "AdminSearchBar";
export default AdminSearchBar;
