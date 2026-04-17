import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";


interface BrandRow {
  id: string;
  brand_name: string;
  logo_url: string;
  footer_about_text: string;
  support_email: string;
  whatsapp_number: string;
}

const BrandSettingsManager = () => {
  const [form, setForm] = useState<Omit<BrandRow, "id">>({
    brand_name: "",
    logo_url: "",
    footer_about_text: "",
    support_email: "",
    whatsapp_number: "",
  });
  const [uploading, setUploading] = useState(false);

  const { data: row, isLoading } = useQuery({
    queryKey: ["brand-settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as BrandRow | null;
    },
  });

  useEffect(() => {
    if (row) {
      setForm({
        brand_name: row.brand_name,
        logo_url: row.logo_url,
        footer_about_text: row.footer_about_text,
        support_email: row.support_email,
        whatsapp_number: row.whatsapp_number,
      });
    }
  }, [row]);

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["brand-settings"], ["brand-settings-admin"]],
    successMessage: "הגדרות המותג נשמרו בהצלחה",
    errorMessage: (error) => error.message || "שגיאה בשמירת הגדרות המותג",
    mutationFn: async (_unused, signal) => {
      if (!row?.id) throw new Error("No brand settings row found");
      const { error } = await supabase
        .from("brand_settings")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .abortSignal(signal);
      if (error) throw error;
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `brand/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("vip-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("vip-assets").getPublicUrl(path);
      setForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("הלוגו הועלה בהצלחה");
    } catch {
      toast.error("שגיאה בהעלאת הלוגו");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">טוען...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">זהות המותג</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>שם המותג</Label>
            <Input
              value={form.brand_name}
              onChange={(e) => setForm((p) => ({ ...p, brand_name: e.target.value }))}
              placeholder="DiamoNY"
            />
          </div>

          <div className="space-y-2">
            <Label>לוגו</Label>
            <div className="flex items-center gap-4">
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="h-12 w-auto rounded border bg-muted p-1" />
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                העלאת לוגו חדש
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            <Input
              value={form.logo_url}
              onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
              placeholder="או הזן URL ידנית"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">תוכן ופרטי קשר</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>טקסט אודות בפוטר</Label>
            <Textarea
              value={form.footer_about_text}
              onChange={(e) => setForm((p) => ({ ...p, footer_about_text: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>אימייל תמיכה</Label>
              <Input
                type="email"
                value={form.support_email}
                onChange={(e) => setForm((p) => ({ ...p, support_email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>מספר WhatsApp (בינלאומי)</Label>
              <Input
                value={form.whatsapp_number}
                onChange={(e) => setForm((p) => ({ ...p, whatsapp_number: e.target.value }))}
                placeholder="972546290534"
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full md:w-auto"
      >
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
        שמור הגדרות מותג
      </Button>

    </div>
  );
};

export default BrandSettingsManager;
