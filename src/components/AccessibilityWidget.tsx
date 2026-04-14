import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accessibility,
  X,
  Plus,
  Minus,
  Type,
  Contrast,
  Moon,
  Palette,
  Link2,
  MousePointer2,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AccessibilitySettings {
  fontSize: number; // percentage: 100 = default
  fontFamily: "default" | "serif" | "sans-serif";
  lineHeight: number; // percentage: 100 = default
  highContrast: boolean;
  darkMode: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  largeCursor: boolean;
  stopAnimations: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  fontFamily: "default",
  lineHeight: 100,
  highContrast: false,
  darkMode: false,
  grayscale: false,
  highlightLinks: false,
  largeCursor: false,
  stopAnimations: false,
};

const STORAGE_KEY = "diamony-accessibility-settings";

const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error("Failed to parse accessibility settings:", e);
      }
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    root.style.setProperty("--accessibility-font-scale", `${settings.fontSize / 100}`);
    body.style.fontSize = `${settings.fontSize}%`;

    // Font family
    if (settings.fontFamily === "serif") {
      body.classList.add("accessibility-serif");
      body.classList.remove("accessibility-sans-serif");
    } else if (settings.fontFamily === "sans-serif") {
      body.classList.add("accessibility-sans-serif");
      body.classList.remove("accessibility-serif");
    } else {
      body.classList.remove("accessibility-serif", "accessibility-sans-serif");
    }

    // Line height
    root.style.setProperty("--accessibility-line-height", `${settings.lineHeight / 100}`);
    body.style.lineHeight = `${(settings.lineHeight / 100) * 1.6}`;

    // High contrast
    body.classList.toggle("accessibility-high-contrast", settings.highContrast);

    // Dark mode
    body.classList.toggle("dark", settings.darkMode);

    // Grayscale
    body.classList.toggle("accessibility-grayscale", settings.grayscale);

    // Highlight links
    body.classList.toggle("accessibility-highlight-links", settings.highlightLinks);

    // Large cursor
    body.classList.toggle("accessibility-large-cursor", settings.largeCursor);

    // Stop animations
    body.classList.toggle("accessibility-stop-animations", settings.stopAnimations);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  const hasActiveSettings = Object.entries(settings).some(([key, value]) => {
    const defaultValue = defaultSettings[key as keyof AccessibilitySettings];
    return value !== defaultValue;
  });

  return (
    <>
      {/* Floating Accessibility Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 left-4 z-50 w-12 h-12 rounded-full",
          "bg-background/80 backdrop-blur-md border border-gold/30",
          "shadow-elegant hover:shadow-gold transition-all duration-300",
          "flex items-center justify-center",
          "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2",
          "hover:scale-110 hover:bg-background/95",
          hasActiveSettings && "ring-2 ring-gold/50"
        )}
        aria-label="פתח תפריט נגישות"
        aria-expanded={isOpen}
        aria-controls="accessibility-menu"
      >
        <Accessibility className="w-6 h-6 text-gold" />
        {hasActiveSettings && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full" />
        )}
      </motion.button>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              id="accessibility-menu"
              role="dialog"
              aria-modal="true"
              aria-label="הגדרות נגישות"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onKeyDown={handleKeyDown}
              className={cn(
                "fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm",
                "bg-background/85 backdrop-blur-xl",
                "border-r border-gold/20 shadow-2xl",
                "overflow-y-auto"
              )}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-gold/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <Accessibility className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-semibold text-foreground">
                        נגישות
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        התאמות תצוגה אישיות
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full hover:bg-gold/10"
                    aria-label="סגור תפריט נגישות"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Text Settings */}
                <section aria-labelledby="text-settings-title">
                  <h3
                    id="text-settings-title"
                    className="flex items-center gap-2 font-heading text-sm font-medium text-foreground mb-4"
                  >
                    <Type className="w-4 h-4 text-gold" />
                    התאמת טקסט
                  </h3>

                  <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                    {/* Font Size */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">גודל גופן</Label>
                        <span className="text-xs text-muted-foreground">
                          {settings.fontSize}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateSetting("fontSize", Math.max(80, settings.fontSize - 10))}
                          aria-label="הקטן גופן"
                          disabled={settings.fontSize <= 80}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Slider
                          value={[settings.fontSize]}
                          onValueChange={([v]) => updateSetting("fontSize", v)}
                          min={80}
                          max={150}
                          step={10}
                          className="flex-1"
                          aria-label="גודל גופן"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateSetting("fontSize", Math.min(150, settings.fontSize + 10))}
                          aria-label="הגדל גופן"
                          disabled={settings.fontSize >= 150}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-2">
                      <Label className="text-sm">סוג גופן</Label>
                      <div className="flex gap-2">
                        {[
                          { value: "default", label: "ברירת מחדל" },
                          { value: "serif", label: "סריף" },
                          { value: "sans-serif", label: "סנס-סריף" },
                        ].map((option) => (
                          <Button
                            key={option.value}
                            variant={settings.fontFamily === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateSetting("fontFamily", option.value as AccessibilitySettings["fontFamily"])}
                            className={cn(
                              "flex-1 text-xs",
                              settings.fontFamily === option.value && "bg-gold text-white hover:bg-gold/90"
                            )}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Line Height */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">מרווח שורות</Label>
                        <span className="text-xs text-muted-foreground">
                          {settings.lineHeight}%
                        </span>
                      </div>
                      <Slider
                        value={[settings.lineHeight]}
                        onValueChange={([v]) => updateSetting("lineHeight", v)}
                        min={100}
                        max={200}
                        step={25}
                        aria-label="מרווח שורות"
                      />
                    </div>
                  </div>
                </section>

                <Separator className="bg-gold/10" />

                {/* Color Settings */}
                <section aria-labelledby="color-settings-title">
                  <h3
                    id="color-settings-title"
                    className="flex items-center gap-2 font-heading text-sm font-medium text-foreground mb-4"
                  >
                    <Palette className="w-4 h-4 text-gold" />
                    התאמת צבעים
                  </h3>

                  <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Contrast className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="high-contrast" className="text-sm cursor-pointer">
                          ניגודיות גבוהה
                        </Label>
                      </div>
                      <Switch
                        id="high-contrast"
                        checked={settings.highContrast}
                        onCheckedChange={(v) => updateSetting("highContrast", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="dark-mode" className="text-sm cursor-pointer">
                          מצב כהה
                        </Label>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={settings.darkMode}
                        onCheckedChange={(v) => updateSetting("darkMode", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-300 to-gray-600" />
                        <Label htmlFor="grayscale" className="text-sm cursor-pointer">
                          גווני אפור
                        </Label>
                      </div>
                      <Switch
                        id="grayscale"
                        checked={settings.grayscale}
                        onCheckedChange={(v) => updateSetting("grayscale", v)}
                      />
                    </div>
                  </div>
                </section>

                <Separator className="bg-gold/10" />

                {/* Navigation Settings */}
                <section aria-labelledby="nav-settings-title">
                  <h3
                    id="nav-settings-title"
                    className="flex items-center gap-2 font-heading text-sm font-medium text-foreground mb-4"
                  >
                    <MousePointer2 className="w-4 h-4 text-gold" />
                    ניווט וקריאה
                  </h3>

                  <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="highlight-links" className="text-sm cursor-pointer">
                          הדגשת קישורים
                        </Label>
                      </div>
                      <Switch
                        id="highlight-links"
                        checked={settings.highlightLinks}
                        onCheckedChange={(v) => updateSetting("highlightLinks", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MousePointer2 className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="large-cursor" className="text-sm cursor-pointer">
                          סמן מוגדל
                        </Label>
                      </div>
                      <Switch
                        id="large-cursor"
                        checked={settings.largeCursor}
                        onCheckedChange={(v) => updateSetting("largeCursor", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {settings.stopAnimations ? (
                          <Pause className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Play className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Label htmlFor="stop-animations" className="text-sm cursor-pointer">
                          עצירת אנימציות
                        </Label>
                      </div>
                      <Switch
                        id="stop-animations"
                        checked={settings.stopAnimations}
                        onCheckedChange={(v) => updateSetting("stopAnimations", v)}
                      />
                    </div>
                  </div>
                </section>

                <Separator className="bg-gold/10" />

                {/* Reset Button */}
                <Button
                  variant="outline"
                  onClick={resetSettings}
                  className="w-full border-gold/30 hover:bg-gold/10 hover:border-gold/50"
                  disabled={!hasActiveSettings}
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  איפוס הגדרות
                </Button>

                {/* Accessibility Statement */}
                <p className="text-xs text-center text-muted-foreground pt-2">
                  אנו מחויבים לנגישות מלאה לכל המשתמשים
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityWidget;
