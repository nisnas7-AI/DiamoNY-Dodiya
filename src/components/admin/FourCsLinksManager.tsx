import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Diamond } from "lucide-react";
import { toast } from "sonner";

const KEYS = [
  { key: "4cs-cut-link", label: "חיתוך (Cut)" },
  { key: "4cs-color-link", label: "צבע (Color)" },
  { key: "4cs-clarity-link", label: "ניקיון (Clarity)" },
  { key: "4cs-carat-link", label: "קראט (Carat)" },
] as const;

const FourCsLinksManager = () => {
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["4cs-links-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("key, content")
        .in("key", KEYS.map((k) => k.key));
      if (error) throw error;
      return data as { key: string; content: string | null }[];
    },
  });

  useEffect(() => {
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r) => (map[r.key] = r.content || ""));
      setLinks(map);
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const k of KEYS) {
        await supabase
          .from("site_content")
          .update({ content: links[k.key] || "/blog" })
          .eq("key", k.key);
      }
      queryClient.invalidateQueries({ queryKey: ["4cs-links-admin"] });
      queryClient.invalidateQueries({ queryKey: ["4cs-links"] });
      toast.success("קישורי מדריך 4C's עודכנו בהצלחה");
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Diamond className="h-5 w-5 text-[#C9A96E]" />
        <h3 className="text-base font-serif font-semibold text-foreground">קישורי מדריך 4C&apos;s</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        הזן כתובת URL עבור כל אחד מארבעת הקטגוריות. הקישורים יופיעו בתוך הטולטיפ של מדריך ה-4C&apos;s בבלוג.
      </p>

      <div className="grid gap-4">
        {KEYS.map((k) => (
          <div key={k.key} className="space-y-1.5">
            <Label className="text-sm font-medium">{k.label}</Label>
            <Input
              dir="ltr"
              placeholder="/blog/diamond-cut-guide"
              value={links[k.key] || ""}
              onChange={(e) => setLinks((prev) => ({ ...prev, [k.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        שמור קישורים
      </Button>
    </div>
  );
};

export default FourCsLinksManager;
