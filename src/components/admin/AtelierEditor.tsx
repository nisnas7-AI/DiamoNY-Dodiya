import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import {
  normalizeJsonString,
  parseFaqItems,
  sanitizeFreeText,
  sanitizeOptionalText,
  sanitizePlainText,
  serializeFaqItems,
  stripScriptLikeTags,
  upsertSiteContentByKey,
} from "@/lib/admin-upsert";

interface BodySection {
  heading: string;
  text: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface AtelierData {
  title: string;
  content: string;
  subtitle: string;
  body_sections: BodySection[];
  faq_items: FaqItem[];
  whatsapp_url: string;
  whatsapp_label: string;
  whatsapp_cta_label: string;
  zoom_url: string;
  zoom_label: string;
  seo_title: string;
  meta_description: string;
  custom_json_ld: string;
}

const AtelierEditor = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AtelierData>({
    title: "",
    content: "",
    subtitle: "",
    body_sections: [],
    faq_items: [],
    whatsapp_url: "",
    whatsapp_label: "",
    whatsapp_cta_label: "",
    zoom_url: "",
    zoom_label: "",
    seo_title: "",
    meta_description: "",
    custom_json_ld: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["digital-atelier-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "digital-atelier")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const meta = (data.metadata as Record<string, any>) || {};
    setForm({
      title: data.title || "",
      content: data.content || "",
      subtitle: meta.subtitle || "",
      body_sections: meta.body_sections || [],
      faq_items: parseFaqItems<FaqItem[]>(meta.faq_items ?? meta.faq_json, []),
      whatsapp_url: meta.action_links?.whatsapp_url || "",
      whatsapp_label: meta.action_links?.whatsapp_label || "",
      whatsapp_cta_label: meta.action_links?.whatsapp_cta_label || "",
      zoom_url: meta.action_links?.zoom_url || "",
      zoom_label: meta.action_links?.zoom_label || "",
      seo_title: meta.seo_title || "",
      meta_description: meta.meta_description || "",
      custom_json_ld: meta.custom_json_ld || "",
    });
  }, [data]);

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["digital-atelier"], ["digital-atelier-admin"]],
    successMessage: "עמוד הסטודיו הדיגיטלי נשמר בהצלחה",
    errorMessage: (error) =>
      error.message || "לא ניתן לשמור את עמוד הסטודיו הדיגיטלי",
    optimisticUpdate: () => {
      const strippedJsonLd = stripScriptLikeTags(form.custom_json_ld);
      const serializedFaq = serializeFaqItems(form.faq_items);
      const optimisticRecord = {
        ...(data ?? {}),
        key: "digital-atelier",
        title: sanitizePlainText(form.title),
        content: sanitizeOptionalText(form.content),
        is_active: true,
        metadata: {
          subtitle: sanitizePlainText(form.subtitle),
          body_sections: form.body_sections.map((section) => ({
            heading: sanitizePlainText(section.heading),
            text: sanitizeFreeText(section.text),
          })),
          faq_items: JSON.parse(serializedFaq),
          faq_json: serializedFaq,
          action_links: {
            whatsapp_url: sanitizePlainText(form.whatsapp_url),
            whatsapp_label: sanitizePlainText(form.whatsapp_label),
            whatsapp_cta_label: sanitizePlainText(form.whatsapp_cta_label),
            zoom_url: sanitizePlainText(form.zoom_url),
            zoom_label: sanitizePlainText(form.zoom_label),
          },
          seo_title: sanitizePlainText(form.seo_title),
          meta_description: sanitizeFreeText(form.meta_description),
          custom_json_ld: strippedJsonLd,
          images: [],
        },
      };

      const rollbackEntries = [
        {
          queryKey: ["digital-atelier-admin"],
          previousData: queryClient.getQueryData(["digital-atelier-admin"]),
        },
        {
          queryKey: ["digital-atelier"],
          previousData: queryClient.getQueryData(["digital-atelier"]),
        },
      ];

      queryClient.setQueryData(["digital-atelier-admin"], optimisticRecord);
      queryClient.setQueryData(["digital-atelier"], optimisticRecord);

      return rollbackEntries;
    },
    mutationFn: async (_unused, signal) => {
      const strippedJsonLd = stripScriptLikeTags(form.custom_json_ld);
      const normalizedJsonLd = normalizeJsonString(strippedJsonLd);
      const serializedFaq = serializeFaqItems(form.faq_items);
      const metadata = {
        subtitle: sanitizePlainText(form.subtitle),
        body_sections: form.body_sections.map((section) => ({
          heading: sanitizePlainText(section.heading),
          text: sanitizeFreeText(section.text),
        })),
        faq_items: JSON.parse(serializedFaq),
        faq_json: serializedFaq,
        action_links: {
          whatsapp_url: sanitizePlainText(form.whatsapp_url),
          whatsapp_label: sanitizePlainText(form.whatsapp_label),
          whatsapp_cta_label: sanitizePlainText(form.whatsapp_cta_label),
          zoom_url: sanitizePlainText(form.zoom_url),
          zoom_label: sanitizePlainText(form.zoom_label),
        },
        seo_title: sanitizePlainText(form.seo_title),
        meta_description: sanitizeFreeText(form.meta_description),
        custom_json_ld: normalizedJsonLd,
        images: [],
      };

      return upsertSiteContentByKey({
        key: "digital-atelier",
        title: sanitizePlainText(form.title),
        content: sanitizeOptionalText(form.content),
        is_active: true,
        metadata: metadata as Record<string, unknown>,
        signal,
      });
    },
  });

  const updateSection = (idx: number, field: keyof BodySection, value: string) => {
    setForm((prev) => {
      const sections = [...prev.body_sections];
      sections[idx] = { ...sections[idx], [field]: value };
      return { ...prev, body_sections: sections };
    });
  };

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      body_sections: [...prev.body_sections, { heading: "", text: "" }],
    }));
  };

  const removeSection = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      body_sections: prev.body_sections.filter((_, i) => i !== idx),
    }));
  };

  const updateFaq = (idx: number, field: keyof FaqItem, value: string) => {
    setForm((prev) => {
      const items = [...prev.faq_items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, faq_items: items };
    });
  };

  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faq_items: [...prev.faq_items, { question: "", answer: "" }],
    }));
  };

  const removeFaq = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      faq_items: prev.faq_items.filter((_, i) => i !== idx),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">תוכן ראשי</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>כותרת העמוד (H1)</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} maxLength={120} />
          </div>
          <div>
            <Label>כותרת משנה</Label>
            <Input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} maxLength={120} />
          </div>
          <div>
            <Label>טקסט מבוא</Label>
            <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={4} maxLength={1000} />
          </div>
        </CardContent>
      </Card>

      {/* Body Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">סעיפי תוכן</CardTitle>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="w-4 h-4 ml-1" />
            הוסף סעיף
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {form.body_sections.map((section, idx) => (
            <div key={idx} className="space-y-3 p-4 border border-border rounded-lg relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 h-8 w-8 text-destructive"
                onClick={() => removeSection(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div>
                <Label>כותרת סעיף {idx + 1}</Label>
                <Input value={section.heading} onChange={(e) => updateSection(idx, "heading", e.target.value)} maxLength={120} />
              </div>
              <div>
                <Label>טקסט</Label>
                <Textarea value={section.text} onChange={(e) => updateSection(idx, "text", e.target.value)} rows={3} maxLength={1000} />
              </div>
            </div>
          ))}
          {form.body_sections.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">אין סעיפים. לחץ "הוסף סעיף" להוספה.</p>
          )}
        </CardContent>
      </Card>

      {/* FAQ Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">שאלות נפוצות (FAQ)</CardTitle>
          <Button variant="outline" size="sm" onClick={addFaq}>
            <Plus className="w-4 h-4 ml-1" />
            הוסף שאלה
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {form.faq_items.map((item, idx) => (
            <div key={idx} className="space-y-3 p-4 border border-border rounded-lg relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 h-8 w-8 text-destructive"
                onClick={() => removeFaq(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div>
                <Label>שאלה {idx + 1}</Label>
                <Input value={item.question} onChange={(e) => updateFaq(idx, "question", e.target.value)} maxLength={200} />
              </div>
              <div>
                <Label>תשובה</Label>
                <Textarea value={item.answer} onChange={(e) => updateFaq(idx, "answer", e.target.value)} rows={3} maxLength={1000} />
              </div>
            </div>
          ))}
          {form.faq_items.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">אין שאלות. לחץ "הוסף שאלה" להוספה.</p>
          )}
        </CardContent>
      </Card>

      {/* Action Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">קישורי פעולה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>קישור WhatsApp</Label>
              <Input value={form.whatsapp_url} onChange={(e) => setForm((p) => ({ ...p, whatsapp_url: e.target.value }))} placeholder="https://wa.me/..." maxLength={500} />
            </div>
            <div>
              <Label>תווית WhatsApp</Label>
              <Input value={form.whatsapp_label} onChange={(e) => setForm((p) => ({ ...p, whatsapp_label: e.target.value }))} maxLength={60} />
            </div>
          </div>
          <div>
            <Label>תווית כפתור WhatsApp בעמוד (CTA)</Label>
            <Input value={form.whatsapp_cta_label} onChange={(e) => setForm((p) => ({ ...p, whatsapp_cta_label: e.target.value }))} placeholder="שלחו לנו הודעה" maxLength={60} />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>קישור Zoom / Calendly</Label>
              <Input value={form.zoom_url} onChange={(e) => setForm((p) => ({ ...p, zoom_url: e.target.value }))} placeholder="https://calendly.com/..." maxLength={500} />
            </div>
            <div>
              <Label>תווית Zoom</Label>
              <Input value={form.zoom_label} onChange={(e) => setForm((p) => ({ ...p, zoom_label: e.target.value }))} maxLength={60} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>כותרת SEO</Label>
            <Input value={form.seo_title} onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))} maxLength={60} />
            <p className="text-xs text-muted-foreground mt-1">{form.seo_title.length}/60</p>
          </div>
          <div>
            <Label>תיאור Meta</Label>
            <Textarea value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} rows={2} maxLength={160} />
            <p className="text-xs text-muted-foreground mt-1">{form.meta_description.length}/160</p>
          </div>
          <Separator />
          <div>
            <Label>JSON-LD Schema (קוד מותאם אישית)</Label>
            <Textarea
              value={form.custom_json_ld}
              onChange={(e) => setForm((p) => ({ ...p, custom_json_ld: e.target.value }))}
              rows={8}
              className="font-mono text-xs ltr"
              dir="ltr"
              placeholder='{"@context":"https://schema.org","@type":"ProfessionalService",...}'
            />
            <p className="text-xs text-muted-foreground mt-1">הדבק JSON גולמי בלבד. תגיות script או helmet יוסרו אוטומטית לפני השמירה.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
        שמור שינויים
      </Button>
    </div>
  );
};

export default AtelierEditor;
