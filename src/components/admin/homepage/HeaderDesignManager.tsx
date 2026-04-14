import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";
import { upsertSiteContentByKey } from "@/lib/admin-upsert";

interface HeaderSettings {
  header_bg_color: string;
  header_bg_opacity: number;
  mobile_menu_bg_color: string;
  mobile_menu_bg_opacity: number;
}

const DEFAULT_SETTINGS: HeaderSettings = {
  header_bg_color: "#ffffff",
  header_bg_opacity: 0.95,
  mobile_menu_bg_color: "#ffffff",
  mobile_menu_bg_opacity: 0.98,
};

const HeaderDesignManager = () => {
  const [settings, setSettings] = useState<HeaderSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ["header-design-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "header_design")
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (data?.metadata) {
        return data.metadata as unknown as HeaderSettings;
      }
      return null;
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["header-design-settings"]],
    successMessage: "הגדרות הכותרת נשמרו בהצלחה",
    errorMessage: (error) => error.message || "שגיאה בשמירת הגדרות הכותרת",
    mutationFn: async (newSettings: HeaderSettings, signal) => {
      return upsertSiteContentByKey({
        key: "header_design",
        title: "הגדרות עיצוב כותרת",
        metadata: newSettings as unknown as Record<string, unknown>,
        is_active: true,
        signal,
      });
    },
    onSuccess: () => {
      setHasChanges(false);
    },
  });

  const updateSetting = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  // Helper to convert hex + opacity to rgba string
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">עיצוב כותרת ותפריט</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 ml-2" />
            איפוס לברירת מחדל
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 ml-2" />
              שמור שינויים
            </Button>
          )}
        </div>
      </div>

      {/* Sticky Header Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">כותרת עליונה (Sticky Header)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm">צבע רקע</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={settings.header_bg_color}
                  onChange={(e) => updateSetting("header_bg_color", e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{settings.header_bg_color}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">
                שקיפות (Alpha): {Math.round(settings.header_bg_opacity * 100)}%
              </Label>
              <Slider
                value={[settings.header_bg_opacity * 100]}
                onValueChange={([value]) => updateSetting("header_bg_opacity", value / 100)}
                max={100}
                min={0}
                step={5}
              />
            </div>
          </div>

          {/* Live Preview - Header */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">תצוגה מקדימה</Label>
            <div 
              className="border rounded-lg p-4 flex items-center justify-between"
              style={{
                backgroundColor: hexToRgba(settings.header_bg_color, settings.header_bg_opacity),
                backdropFilter: settings.header_bg_opacity < 1 ? "blur(10px)" : "none",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-24 h-8 bg-foreground/20 rounded flex items-center justify-center text-xs">לוגו</div>
                <nav className="flex gap-4 text-sm">
                  <span>קולקציות</span>
                  <span>עיצוב אישי</span>
                  <span>אודות</span>
                </nav>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-foreground/10"></div>
                <div className="w-8 h-8 rounded-full bg-foreground/10"></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * כאשר השקיפות נמוכה מ-100%, יופעל אפקט Frosted Glass (טשטוש רקע)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Menu Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">תפריט מובייל (Dropdown)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm">צבע רקע</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={settings.mobile_menu_bg_color}
                  onChange={(e) => updateSetting("mobile_menu_bg_color", e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{settings.mobile_menu_bg_color}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">
                שקיפות (Alpha): {Math.round(settings.mobile_menu_bg_opacity * 100)}%
              </Label>
              <Slider
                value={[settings.mobile_menu_bg_opacity * 100]}
                onValueChange={([value]) => updateSetting("mobile_menu_bg_opacity", value / 100)}
                max={100}
                min={0}
                step={5}
              />
            </div>
          </div>

          {/* Live Preview - Mobile Menu */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">תצוגה מקדימה</Label>
            <div className="border rounded-lg overflow-hidden max-w-xs">
              {/* Mock header */}
              <div 
                className="p-3 flex items-center justify-between border-b"
                style={{
                  backgroundColor: hexToRgba(settings.header_bg_color, settings.header_bg_opacity),
                  backdropFilter: settings.header_bg_opacity < 1 ? "blur(10px)" : "none",
                }}
              >
                <div className="w-16 h-6 bg-foreground/20 rounded text-xs flex items-center justify-center">לוגו</div>
                <div className="w-6 h-6 bg-foreground/10 rounded"></div>
              </div>
              {/* Mock dropdown menu */}
              <div 
                className="p-4 space-y-3"
                style={{
                  backgroundColor: hexToRgba(settings.mobile_menu_bg_color, settings.mobile_menu_bg_opacity),
                  backdropFilter: settings.mobile_menu_bg_opacity < 1 ? "blur(10px)" : "none",
                }}
              >
                <div className="py-2 border-b border-foreground/10">קולקציות</div>
                <div className="py-2 border-b border-foreground/10">עיצוב אישי</div>
                <div className="py-2 border-b border-foreground/10">אודות</div>
                <div className="py-2">צור קשר</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * כאשר השקיפות נמוכה מ-100%, יופעל אפקט Frosted Glass (טשטוש רקע)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeaderDesignManager;
