import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import MediaSelector from "@/components/admin/MediaSelector";

const FONT_OPTIONS = [
  { value: "Assistant", label: "Assistant" },
  { value: "Heebo", label: "Heebo" },
  { value: "Rubik", label: "Rubik" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Frank Ruhl Libre", label: "Frank Ruhl Libre" },
  { value: "Secular One", label: "Secular One" },
  { value: "Alef", label: "Alef" },
];

const ICON_FIELDS = [
  { key: "icon_phone_url", label: "אייקון נייד" },
  { key: "icon_whatsapp_url", label: "אייקון וואטסאפ" },
  { key: "icon_email_url", label: "אייקון מייל" },
  { key: "icon_facebook_url", label: "אייקון פייסבוק" },
  { key: "icon_instagram_url", label: "אייקון אינסטגרם" },
  { key: "icon_catalog_url", label: "אייקון קטלוג" },
] as const;

interface ThemeSettings {
  id: string;
  primary_color: string;
  accent_color: string;
  text_color: string;
  bg_color: string;
  font_family: string;
  avatar_url: string | null;
  logo_url: string | null;
  icon_phone_url: string | null;
  icon_whatsapp_url: string | null;
  icon_email_url: string | null;
  icon_facebook_url: string | null;
  icon_instagram_url: string | null;
  icon_catalog_url: string | null;
}

const DigitalCardThemeSettings = () => {
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("digital_card_settings")
        .select("id, primary_color, accent_color, text_color, bg_color, font_family, avatar_url, logo_url, icon_phone_url, icon_whatsapp_url, icon_email_url, icon_facebook_url, icon_instagram_url, icon_catalog_url")
        .limit(1)
        .maybeSingle();
      if (data) setSettings(data as ThemeSettings);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase
      .from("digital_card_settings")
      .update(rest)
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("שגיאה בשמירה");
    } else {
      toast.success("הגדרות עיצוב עודכנו");
    }
  };

  const update = (field: keyof ThemeSettings, value: string | null) =>
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          ניהול עיצוב ומדיה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Colors */}
        <div>
          <p className="text-sm font-semibold mb-3">צבעי הכרטיס</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "primary_color" as const, label: "צבע ראשי" },
              { key: "accent_color" as const, label: "צבע כפתורים" },
              { key: "text_color" as const, label: "צבע טקסט" },
              { key: "bg_color" as const, label: "צבע רקע" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="font-mono text-xs flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Font */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">פונט</Label>
          <select
            value={settings.font_family}
            onChange={(e) => update("font_family", e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Main media */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">אווטאר / תמונת Hero</Label>
            <MediaSelector
              mediaUrl={settings.avatar_url || ""}
              mediaType="image"
              onMediaChange={(url) => update("avatar_url", url || null)}
              bucket="catalog-media"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">לוגו ראשי</Label>
            <MediaSelector
              mediaUrl={settings.logo_url || ""}
              mediaType="image"
              onMediaChange={(url) => update("logo_url", url || null)}
              bucket="catalog-media"
            />
          </div>
        </div>

        {/* Custom icons */}
        <div>
          <p className="text-sm font-semibold mb-3">אייקונים מותאמים (SVG/PNG)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ICON_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}</Label>
                <div className="flex items-center gap-2">
                  {settings[key] ? (
                    <div className="relative w-10 h-10 rounded border flex items-center justify-center bg-muted">
                      <img src={settings[key]!} alt={label} className="w-6 h-6 object-contain" />
                      <button
                        onClick={() => update(key, null)}
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded border border-dashed flex items-center justify-center text-muted-foreground">
                      <Upload className="w-4 h-4" />
                    </div>
                  )}
                  <MediaSelector
                    mediaUrl={settings[key] || ""}
                    mediaType="image"
                    onMediaChange={(url) => update(key, url || null)}
                    bucket="catalog-media"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 ml-2" />
          {saving ? "שומר..." : "שמור עיצוב"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DigitalCardThemeSettings;
