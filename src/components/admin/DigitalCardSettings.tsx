import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Save } from "lucide-react";
import { toast } from "sonner";

interface CardSettings {
  id: string;
  phone: string;
  whatsapp: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  about_text: string;
}

const DigitalCardSettings = () => {
  const [settings, setSettings] = useState<CardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("digital_card_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) setSettings(data as CardSettings);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("digital_card_settings")
      .update({
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url,
        about_text: settings.about_text,
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) {
      toast.error("שגיאה בשמירה");
    } else {
      toast.success("הגדרות כרטיס ביקור עודכנו");
    }
  };

  const update = (field: keyof CardSettings, value: string) =>
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          הגדרות כרטיס ביקור
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-1 block">נייד</Label>
            <Input
              value={settings.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="972501234567"
              dir="ltr"
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">וואטסאפ</Label>
            <Input
              value={settings.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="972501234567"
              dir="ltr"
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">מייל</Label>
            <Input
              value={settings.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="info@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">פייסבוק</Label>
            <Input
              value={settings.facebook_url}
              onChange={(e) => update("facebook_url", e.target.value)}
              placeholder="https://facebook.com/..."
              dir="ltr"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-sm mb-1 block">אינסטגרם</Label>
            <Input
              value={settings.instagram_url}
              onChange={(e) => update("instagram_url", e.target.value)}
              placeholder="https://instagram.com/..."
              dir="ltr"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm mb-1 block">אודות</Label>
          <Textarea
            value={settings.about_text}
            onChange={(e) => update("about_text", e.target.value)}
            placeholder="טקסט אודות שיוצג בכרטיס הביקור הדיגיטלי..."
            rows={4}
          />
        </div>
        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 ml-2" />
          {saving ? "שומר..." : "שמור הגדרות"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DigitalCardSettings;
