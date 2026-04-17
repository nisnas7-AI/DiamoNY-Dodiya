import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Save, Loader2, Scale, FileText, Accessibility } from "lucide-react";
import BrandRichTextEditor from "@/components/admin/BrandRichTextEditor";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";
import { sanitizeOptionalText, upsertSiteContentByKey } from "@/lib/admin-upsert";

interface LegalPage {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const LEGAL_PAGES: LegalPage[] = [
  { key: "terms", label: "תקנון האתר", icon: <Scale className="h-4 w-4" /> },
  { key: "privacy-policy", label: "מדיניות פרטיות", icon: <FileText className="h-4 w-4" /> },
  { key: "accessibility-statement", label: "הצהרת נגישות", icon: <Accessibility className="h-4 w-4" /> },
];

const LegalPageTab = ({ pageKey, label }: { pageKey: string; label: string }) => {
  const [content, setContent] = useState("");

  const { isLoading } = useQuery({
    queryKey: ["legal-page", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", pageKey)
        .maybeSingle();
      if (error) throw error;
      if (data?.content) setContent(data.content);
      return data;
    },
  });

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["legal-page", pageKey], ["site-content", pageKey]],
    successMessage: `${label} נשמר בהצלחה`,
    errorMessage: "שגיאה בשמירה",
    mutationFn: async (html: string, signal) => {
      return upsertSiteContentByKey({
        key: pageKey,
        title: label,
        content: sanitizeOptionalText(html),
        is_active: true,
        signal,
      });
    },
    onSuccess: () => {
      toast({ title: `${label} נשמר בהצלחה` });
    },
    onError: () => {
      toast({ title: "שגיאה בשמירה", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BrandRichTextEditor content={content} onChange={setContent} />
      <Button
        onClick={() => saveMutation.mutate(content)}
        disabled={saveMutation.isPending}
        className="gap-2"
      >
        {saveMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        שמור {label}
      </Button>
    </div>
  );
};

const LegalPagesEditor = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">טפסים משפטיים</h3>
        <p className="text-sm text-muted-foreground mb-4">
          עריכת תקנון האתר, מדיניות הפרטיות והצהרת הנגישות. התוכן יוצג בעמודים הציבוריים באתר.
        </p>
      </div>

      <Tabs defaultValue="terms" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          {LEGAL_PAGES.map((page) => (
            <TabsTrigger key={page.key} value={page.key} className="gap-2">
              {page.icon}
              {page.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {LEGAL_PAGES.map((page) => (
          <TabsContent key={page.key} value={page.key} className="mt-4">
            <LegalPageTab pageKey={page.key} label={page.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LegalPagesEditor;
