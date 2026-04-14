import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Trash2, ExternalLink, FileText, ChevronUp, ChevronDown,
  GripVertical, Type, Image, LayoutTemplate, HelpCircle, ShoppingBag, Minus, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Block, ContentBlocks } from "@/components/dynamic/types";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";

// ─────── Types ───────

interface Page {
  id: string;
  slug: string;
  seo_title: string | null;
  meta_description: string | null;
  h1_title: string | null;
  content_blocks: unknown;
  is_published: boolean | null;
  created_at: string;
  updated_at: string;
}

interface PageFormData {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_title: string;
  is_published: boolean;
}

const BLOCK_TYPES = [
  { type: "hero", label: "Hero - כותרת ראשית", icon: LayoutTemplate },
  { type: "rich_text", label: "טקסט עשיר", icon: Type },
  { type: "image_with_text", label: "תמונה + טקסט", icon: Image },
  { type: "faq", label: "שאלות ותשובות (AEO)", icon: HelpCircle },
  { type: "product_links", label: "קישור למוצרים", icon: ShoppingBag },
  { type: "spacer", label: "רווח", icon: Minus },
] as const;

// ─────── Block Editor Components ───────

const HeroEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
  <div className="space-y-3">
    <div>
      <Label>כותרת (H1)</Label>
      <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} />
    </div>
    <div>
      <Label>כותרת משנה</Label>
      <Input value={data.subtitle || ""} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
    </div>
    <div>
      <Label>תמונת רקע (URL)</Label>
      <Input value={data.background_image || ""} onChange={(e) => onChange({ ...data, background_image: e.target.value })} dir="ltr" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>טקסט CTA</Label>
        <Input value={data.cta_text || ""} onChange={(e) => onChange({ ...data, cta_text: e.target.value })} />
      </div>
      <div>
        <Label>קישור CTA</Label>
        <Input value={data.cta_url || ""} onChange={(e) => onChange({ ...data, cta_url: e.target.value })} dir="ltr" />
      </div>
    </div>
    <div>
      <Label>יישור</Label>
      <Select value={data.alignment || "center"} onValueChange={(v) => onChange({ ...data, alignment: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="right">ימין</SelectItem>
          <SelectItem value="center">מרכז</SelectItem>
          <SelectItem value="left">שמאל</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const RichTextEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
  <div className="space-y-3">
    <div>
      <Label>תוכן (Markdown / HTML)</Label>
      <Textarea
        value={data.content || ""}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
        rows={8}
        className="font-mono text-sm"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>רוחב מקסימלי</Label>
        <Select value={data.max_width || "medium"} onValueChange={(v) => onChange({ ...data, max_width: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="narrow">צר</SelectItem>
            <SelectItem value="medium">בינוני</SelectItem>
            <SelectItem value="full">מלא</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>יישור טקסט</Label>
        <Select value={data.text_align || "right"} onValueChange={(v) => onChange({ ...data, text_align: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="right">ימין</SelectItem>
            <SelectItem value="center">מרכז</SelectItem>
            <SelectItem value="left">שמאל</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

const ImageTextEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
  <div className="space-y-3">
    <div>
      <Label>כתובת תמונה (URL)</Label>
      <Input value={data.image_url || ""} onChange={(e) => onChange({ ...data, image_url: e.target.value })} dir="ltr" />
    </div>
    <div>
      <Label>טקסט חלופי (Alt)</Label>
      <Input value={data.alt_text || ""} onChange={(e) => onChange({ ...data, alt_text: e.target.value })} />
    </div>
    <div>
      <Label>כותרת</Label>
      <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} />
    </div>
    <div>
      <Label>תוכן</Label>
      <Textarea value={data.content || ""} onChange={(e) => onChange({ ...data, content: e.target.value })} rows={4} />
    </div>
    <div>
      <Label>פריסה</Label>
      <Select value={data.layout || "image_right"} onValueChange={(v) => onChange({ ...data, layout: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="image_right">תמונה מימין</SelectItem>
          <SelectItem value="image_left">תמונה משמאל</SelectItem>
          <SelectItem value="overlay">שכבת על</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>טקסט CTA</Label>
        <Input value={data.cta_text || ""} onChange={(e) => onChange({ ...data, cta_text: e.target.value })} />
      </div>
      <div>
        <Label>קישור CTA</Label>
        <Input value={data.cta_url || ""} onChange={(e) => onChange({ ...data, cta_url: e.target.value })} dir="ltr" />
      </div>
    </div>
  </div>
);

const FaqEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => {
  const items = data.items || [];

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...data, items: newItems });
  };

  const addItem = () => onChange({ ...data, items: [...items, { question: "", answer: "" }] });
  const removeItem = (i: number) => onChange({ ...data, items: items.filter((_: any, idx: number) => idx !== i) });

  return (
    <div className="space-y-3">
      <div>
        <Label>כותרת הסקשן</Label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="שאלות נפוצות" />
      </div>
      <div className="space-y-4">
        {items.map((item: any, i: number) => (
          <Card key={i} className="p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  value={item.question || ""}
                  onChange={(e) => updateItem(i, "question", e.target.value)}
                  placeholder={`שאלה ${i + 1}`}
                />
                <Textarea
                  value={item.answer || ""}
                  onChange={(e) => updateItem(i, "answer", e.target.value)}
                  placeholder="תשובה"
                  rows={3}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-destructive shrink-0 mt-1">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addItem} className="w-full">
        <Plus className="h-4 w-4 ml-1" /> הוסף שאלה
      </Button>
    </div>
  );
};

const ProductLinksEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => {
  const ids = data.product_ids || [];
  const [newId, setNewId] = useState("");

  const addId = () => {
    if (newId.trim() && !ids.includes(newId.trim())) {
      onChange({ ...data, product_ids: [...ids, newId.trim()] });
      setNewId("");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>כותרת</Label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      </div>
      <div>
        <Label>כותרת משנה</Label>
        <Input value={data.subtitle || ""} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
      </div>
      <div>
        <Label>מזהי מוצרים (UUID)</Label>
        <div className="flex gap-2">
          <Input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="הדבק UUID של מוצר" dir="ltr" className="text-left" />
          <Button variant="outline" size="sm" onClick={addId}>הוסף</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {ids.map((id: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1 text-xs font-mono">
              {id.slice(0, 8)}…
              <button onClick={() => onChange({ ...data, product_ids: ids.filter((_: string, idx: number) => idx !== i) })} className="hover:text-destructive">×</button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

const SpacerEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => (
  <div>
    <Label>גובה</Label>
    <Select value={data.height || "md"} onValueChange={(v) => onChange({ ...data, height: v })}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="sm">קטן</SelectItem>
        <SelectItem value="md">בינוני</SelectItem>
        <SelectItem value="lg">גדול</SelectItem>
        <SelectItem value="xl">גדול מאוד</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// ─────── Block Editor Selector ───────

const BlockDataEditor = ({ block, onChange }: { block: Block; onChange: (d: any) => void }) => {
  switch (block.type) {
    case "hero": return <HeroEditor data={block.data} onChange={onChange} />;
    case "rich_text": return <RichTextEditor data={block.data} onChange={onChange} />;
    case "image_with_text": return <ImageTextEditor data={block.data} onChange={onChange} />;
    case "faq": return <FaqEditor data={block.data} onChange={onChange} />;
    case "product_links": return <ProductLinksEditor data={block.data} onChange={onChange} />;
    case "spacer": return <SpacerEditor data={block.data} onChange={onChange} />;
    default: return <p className="text-muted-foreground text-sm">סוג בלוק לא מוכר</p>;
  }
};

const getDefaultData = (type: string): any => {
  switch (type) {
    case "hero": return { title: "", subtitle: "", alignment: "center" };
    case "rich_text": return { content: "", max_width: "medium", text_align: "right" };
    case "image_with_text": return { image_url: "", layout: "image_right" };
    case "faq": return { title: "שאלות נפוצות", items: [{ question: "", answer: "" }] };
    case "product_links": return { title: "", product_ids: [] };
    case "spacer": return { height: "md" };
    default: return {};
  }
};

const getBlockLabel = (type: string) => BLOCK_TYPES.find((b) => b.type === type)?.label || type;
const getBlockIcon = (type: string) => {
  const Icon = BLOCK_TYPES.find((b) => b.type === type)?.icon || FileText;
  return <Icon className="h-4 w-4" />;
};

// ─────── Page Builder (Block Editor) ───────

const PageBlocksEditor = ({
  page,
  onBack,
}: {
  page: Page;
  onBack: () => void;
}) => {
  const queryClient = useQueryClient();
  const contentBlocks = (page.content_blocks as ContentBlocks) || { blocks: [] };
  const [blocks, setBlocks] = useState<Block[]>(contentBlocks.blocks || []);
  const [isDirty, setIsDirty] = useState(false);

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setIsDirty(true);
  };

  const saveMutation = useAdminSaveMutation({
    queryKeysToInvalidate: [["admin-pages"]],
    successMessage: "הבלוקים נשמרו בהצלחה",
    errorMessage: (error) => `שגיאה בשמירה: ${error.message}`,
    mutationFn: async (_unused, signal) => {
      const { error } = await supabase
        .from("pages")
        .update({
          content_blocks: { blocks } as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", page.id)
        .abortSignal(signal);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsDirty(false);
    },
  });

  const addBlock = (type: string) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      data: getDefaultData(type),
    } as Block;
    updateBlocks([...blocks, newBlock]);
  };

  const updateBlockData = (index: number, newData: any) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], data: newData } as Block;
    updateBlocks(updated);
  };

  const removeBlock = (index: number) => {
    updateBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const updated = [...blocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateBlocks(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold">{page.h1_title || page.slug}</h3>
            <p className="text-xs text-muted-foreground" dir="ltr">/page/{page.slug}</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}>
          {saveMutation.isPending ? "שומר..." : "שמור שינויים"}
        </Button>
      </div>

      {/* Block list */}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <Card key={block.id || index} className="border-border/50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                {getBlockIcon(block.type)}
                <span className="text-sm font-medium flex-1">{getBlockLabel(block.type)}</span>
                <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeBlock(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <BlockDataEditor block={block} onChange={(newData) => updateBlockData(index, newData)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add block */}
      <Card className="border-dashed border-2 border-border/40">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground mb-3 text-center">הוסף בלוק חדש</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
              <Button key={type} variant="outline" size="sm" className="justify-start gap-2 h-auto py-2.5" onClick={() => addBlock(type)}>
                <Icon className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─────── Main PagesManager ───────

const PagesManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [builderPage, setBuilderPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState<PageFormData>({
    slug: "",
    seo_title: "",
    meta_description: "",
    h1_title: "",
    is_published: false,
  });

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Page[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      const { error } = await supabase.from("pages").insert({
        slug: data.slug,
        seo_title: data.seo_title || null,
        meta_description: data.meta_description || null,
        h1_title: data.h1_title || null,
        is_published: data.is_published,
        content_blocks: { blocks: [] },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast.success("העמוד נוצר בהצלחה");
      resetForm();
    },
    onError: (error: Error) => toast.error(`שגיאה ביצירת העמוד: ${error.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PageFormData }) => {
      const { error } = await supabase
        .from("pages")
        .update({
          slug: data.slug,
          seo_title: data.seo_title || null,
          meta_description: data.meta_description || null,
          h1_title: data.h1_title || null,
          is_published: data.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast.success("העמוד עודכן בהצלחה");
      resetForm();
    },
    onError: (error: Error) => toast.error(`שגיאה בעדכון העמוד: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast.success("העמוד נמחק בהצלחה");
    },
    onError: (error: Error) => toast.error(`שגיאה במחיקת העמוד: ${error.message}`),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from("pages")
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast.success("סטטוס הפרסום עודכן");
    },
    onError: (error: Error) => toast.error(`שגיאה בעדכון סטטוס: ${error.message}`),
  });

  const resetForm = () => {
    setFormData({ slug: "", seo_title: "", meta_description: "", h1_title: "", is_published: false });
    setEditingPage(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      seo_title: page.seo_title || "",
      meta_description: page.meta_description || "",
      h1_title: page.h1_title || "",
      is_published: page.is_published ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim()) {
      toast.error("יש להזין slug לעמוד");
      return;
    }
    const normalizedSlug = formData.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const submitData = { ...formData, slug: normalizedSlug };
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getBlocksCount = (page: Page): number => {
    const blocks = page.content_blocks as { blocks?: unknown[] } | null;
    return blocks?.blocks?.length ?? 0;
  };

  // Show page builder when editing blocks
  if (builderPage) {
    // Re-fetch page data to ensure freshness
    const freshPage = pages?.find((p) => p.id === builderPage.id) || builderPage;
    return <PageBlocksEditor page={freshPage} onBack={() => setBuilderPage(null)} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">ניהול עמודי CMS דינמיים עם בלוקי תוכן מודולריים</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 ml-2" />
              עמוד חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingPage ? "עריכת עמוד" : "יצירת עמוד חדש"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (נתיב URL)</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} placeholder="diamond-guide" dir="ltr" className="text-left" />
                <p className="text-xs text-muted-foreground">יופיע בכתובת: /page/{formData.slug || "slug"}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="h1_title">כותרת H1</Label>
                <Input id="h1_title" value={formData.h1_title} onChange={(e) => setFormData((prev) => ({ ...prev, h1_title: e.target.value }))} placeholder="כותרת ראשית לעמוד" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_title">כותרת SEO</Label>
                <Input id="seo_title" value={formData.seo_title} onChange={(e) => setFormData((prev) => ({ ...prev, seo_title: e.target.value }))} placeholder="כותרת לתג title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">תיאור מטא</Label>
                <Textarea id="meta_description" value={formData.meta_description} onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))} placeholder="תיאור קצר לתוצאות חיפוש" rows={3} />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_published: checked }))} />
                <Label htmlFor="is_published">פרסם עמוד</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPage ? "עדכן" : "צור עמוד"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>ביטול</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pages Table */}
      {pages && pages.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">עמוד</TableHead>
                  <TableHead className="text-right">בלוקים</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">עודכן</TableHead>
                  <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{page.h1_title || page.slug}</p>
                        <p className="text-sm text-muted-foreground" dir="ltr">/page/{page.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => setBuilderPage(page)}>
                        {getBlocksCount(page)} בלוקים
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={page.is_published ?? false}
                        onCheckedChange={(checked) => togglePublishMutation.mutate({ id: page.id, isPublished: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(page.updated_at), "dd/MM/yyyy", { locale: he })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setBuilderPage(page)} title="בניית בלוקים">
                          <LayoutTemplate className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(page)} title="עריכת SEO">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="צפה בעמוד">
                          <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="מחק">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>מחיקת עמוד</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את העמוד "{page.h1_title || page.slug}"? פעולה זו אינה ניתנת לביטול.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(page.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">אין עמודים עדיין</h3>
            <p className="text-muted-foreground mb-4">צור את העמוד הראשון שלך כדי להתחיל</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              צור עמוד חדש
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PagesManager;
