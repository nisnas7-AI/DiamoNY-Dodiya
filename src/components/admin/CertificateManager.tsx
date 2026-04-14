import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, Link2, CheckCircle } from "lucide-react";

const LABS = [
  { name: "GIA", full: "Gemological Institute of America" },
  { name: "IGI", full: "International Gemological Institute" },
  { name: "HRD", full: "Hoge Raad voor Diamant" },
  { name: "SGL", full: "Solitaire Gemological Labs" },
  { name: "CGL", full: "Central Gem Laboratory" },
];

const GOLD = "#D4AF37";

export const CertificateManager = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_images")
        .select("*")
        .order("lab_name");
      if (error) throw error;
      return data;
    },
  });

  const updateUrl = useMutation({
    mutationFn: async ({ labName, imageUrl }: { labName: string; imageUrl: string }) => {
      const { error } = await supabase
        .from("certificate_images")
        .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq("lab_name", labName);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      toast.success("התעודה עודכנה בהצלחה");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFileUpload = async (labName: string, file: File) => {
    setUploading(labName);
    try {
      const ext = file.name.split(".").pop();
      const path = `certificates/${labName.toLowerCase()}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(path);

      await updateUrl.mutateAsync({ labName, imageUrl: urlData.publicUrl });
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(e.message || "שגיאה בהעלאת הקובץ");
    } finally {
      setUploading(null);
    }
  };

  const getCertUrl = (labName: string) =>
    certificates.find((c: any) => c.lab_name === labName)?.image_url || "";

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-xl font-bold text-foreground font-heebo">ניהול תעודות גמולוגיות</h3>
        <p className="text-sm text-muted-foreground">
          העלה תמונות תעודות לדוגמה עבור כל מעבדה. התמונות יוצגו במודאל בעמוד המוצר.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LABS.map((lab) => {
          const currentUrl = getCertUrl(lab.name);
          const isUploading = uploading === lab.name;

          return (
            <Card key={lab.name} className={currentUrl ? "border-primary/30" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8.5" stroke={GOLD} strokeWidth="1.2" />
                    <path d="M6.5 10l2.5 2.5 5-5" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  {lab.name}
                  {currentUrl && <CheckCircle className="h-4 w-4 text-green-500 mr-auto" />}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{lab.full}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentUrl && (
                  <img
                    src={currentUrl}
                    alt={`תעודה ${lab.name}`}
                    className="w-full h-32 object-contain rounded-lg border bg-muted/30"
                  />
                )}

                {/* URL paste */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    קישור URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://..."
                      defaultValue={currentUrl}
                      className="text-xs"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== currentUrl) {
                          updateUrl.mutate({ labName: lab.name, imageUrl: val });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* File upload */}
                <div>
                  <Label
                    htmlFor={`cert-file-${lab.name}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-xs text-muted-foreground"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploading ? "מעלה..." : "העלאת תמונה"}
                  </Label>
                  <input
                    id={`cert-file-${lab.name}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(lab.name, file);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CertificateManager;
