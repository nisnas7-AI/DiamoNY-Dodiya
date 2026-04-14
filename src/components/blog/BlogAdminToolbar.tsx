import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Settings, Image, Type, Link2, Palette, Eye, EyeOff, 
  ChevronDown, Maximize2, Minimize2, Edit 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ToolbarSettings {
  enableFloatingFrames: boolean;
  fontSize: string;
  headerOverlay: boolean;
}

interface BlogAdminToolbarProps {
  postId: string;
  settings: ToolbarSettings;
  onSettingsChange: (settings: ToolbarSettings) => void;
}

export const BlogAdminToolbar = ({ postId, settings, onSettingsChange }: BlogAdminToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkData, setLinkData] = useState({ text: "", url: "", keyword: "" });

  const fontSizes = [
    { value: "sm", label: "קטן" },
    { value: "base", label: "רגיל" },
    { value: "lg", label: "גדול" },
    { value: "xl", label: "גדול מאוד" },
  ];

  const productLinks = [
    { label: "טבעות אירוסין", url: "/catalog/engagement-rings" },
    { label: "שרשראות זהב", url: "/catalog/necklaces" },
    { label: "עגילי יהלומים", url: "/catalog/earrings" },
    { label: "צמידים", url: "/catalog/bracelets" },
    { label: "תליונים", url: "/catalog/pendants" },
  ];

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-xl overflow-hidden">
        {/* Toggle Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4 text-accent" />
            כלי עריכה מהירה
          </span>
          {isExpanded ? (
            <Minimize2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Toolbar Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 border-t border-border flex flex-wrap items-center gap-4"
            >
              {/* Edit in Admin */}
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin?tab=blog&edit=${postId}`}>
                  <Edit className="h-4 w-4 ml-2" />
                  ערוך מאמר
                </Link>
              </Button>

              {/* Floating Frames Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="floating-frames"
                  checked={settings.enableFloatingFrames}
                  onCheckedChange={(checked) => 
                    onSettingsChange({ ...settings, enableFloatingFrames: checked })
                  }
                />
                <Label htmlFor="floating-frames" className="text-sm cursor-pointer">
                  <Image className="h-4 w-4 inline ml-1" />
                  מסגרות צפות
                </Label>
              </div>

              {/* Font Size */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Type className="h-4 w-4 ml-2" />
                    גודל גופן
                    <ChevronDown className="h-3 w-3 mr-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>בחר גודל</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {fontSizes.map((size) => (
                    <DropdownMenuItem
                      key={size.value}
                      onClick={() => onSettingsChange({ ...settings, fontSize: size.value })}
                      className={settings.fontSize === size.value ? "bg-accent/10" : ""}
                    >
                      {size.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Link Injector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Link2 className="h-4 w-4 ml-2" />
                    הוסף קישור מוצר
                    <ChevronDown className="h-3 w-3 mr-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>קישורים מהירים</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {productLinks.map((link) => (
                    <DropdownMenuItem
                      key={link.url}
                      onClick={() => {
                        navigator.clipboard.writeText(`[${link.label}](${link.url})`);
                      }}
                    >
                      {link.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        קישור מותאם...
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הוסף קישור מותאם</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>טקסט הקישור</Label>
                          <Input
                            value={linkData.text}
                            onChange={(e) => setLinkData({ ...linkData, text: e.target.value })}
                            placeholder="טבעת יהלום מרהיבה"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>כתובת URL</Label>
                          <Input
                            value={linkData.url}
                            onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                            placeholder="/catalog/product-slug"
                            dir="ltr"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(`[${linkData.text}](${linkData.url})`);
                            setLinkDialogOpen(false);
                            setLinkData({ text: "", url: "", keyword: "" });
                          }}
                          className="w-full"
                        >
                          העתק לקליפבורד
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Header Overlay Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="header-overlay"
                  checked={settings.headerOverlay}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, headerOverlay: checked })
                  }
                />
                <Label htmlFor="header-overlay" className="text-sm cursor-pointer">
                  <Palette className="h-4 w-4 inline ml-1" />
                  שכבת כותרת
                </Label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BlogAdminToolbar;
