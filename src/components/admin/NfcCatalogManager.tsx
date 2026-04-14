import { useState, useEffect, useCallback, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Copy, Download, GripVertical, Plus, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MediaSelector from "@/components/admin/MediaSelector";
import DigitalCardSettings from "@/components/admin/DigitalCardSettings";
import DigitalCardThemeSettings from "@/components/admin/DigitalCardThemeSettings";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NfcCard {
  id: string;
  title: string;
  image_url: string | null;
  category_id: string | null;
  custom_link: string | null;
  section: string;
  display_order: number;
  is_active: boolean;
  short_text: string | null;
  long_text: string | null;
  show_title: boolean;
  show_short_text: boolean;
  show_long_text: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const NFC_BASE_URL = "https://diamony.me/digital-card";
const NFC_QR_URL = "https://diamony.me/q/r";
const NFC_QR_DISPLAY_URL = `${NFC_BASE_URL}?ref=qr`;
const NFC_NFC_URL = `${NFC_BASE_URL}?ref=nfc`;

const NfcCatalogManager = () => {
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<NfcCard | null>(null);
  const [modalCard, setModalCard] = useState<NfcCard | null>(null);
  const [categoryFallbacks, setCategoryFallbacks] = useState<Record<string, string>>({});
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  // Initialize styled QR code
  useEffect(() => {
    const qr = new QRCodeStyling({
      width: 200,
      height: 200,
      type: "svg",
      data: NFC_QR_URL,
      qrOptions: {
        errorCorrectionLevel: "L",
      },
      dotsOptions: {
        color: "#1a1a1a",
        type: "rounded",
      },
      cornersSquareOptions: {
        color: "#0a0a0a",
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#0a0a0a",
        type: "dot",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      margin: 12,
    });
    qrCodeInstance.current = qr;
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    }
  }, []);

  const fetchFallbacks = useCallback(async (cardsData: NfcCard[]) => {
    const categoryIds = cardsData
      .filter(c => !c.image_url && c.category_id)
      .map(c => c.category_id as string);
    if (categoryIds.length === 0) { setCategoryFallbacks({}); return; }
    const uniqueIds = [...new Set(categoryIds)];
    const fallbacks: Record<string, string> = {};
    await Promise.all(
      uniqueIds.map(async (catId) => {
        const { data: products } = await supabase
          .from("products")
          .select("main_image_url")
          .eq("category_id", catId)
          .eq("is_active", true)
          .not("main_image_url", "is", null)
          .order("display_order", { ascending: true })
          .limit(1);
        if (products?.[0]?.main_image_url) fallbacks[catId] = products[0].main_image_url;
      })
    );
    setCategoryFallbacks(fallbacks);
  }, []);

  const fetchData = useCallback(async () => {
    const [{ data: cardsData }, { data: catsData }] = await Promise.all([
      supabase
        .from("nfc_catalog_cards")
        .select("*")
        .order("section")
        .order("display_order", { ascending: true }),
      supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name"),
    ]);
    const cards = (cardsData as NfcCard[]) || [];
    setCards(cards);
    setCategories(catsData || []);
    setLoading(false);
    fetchFallbacks(cards);
  }, [fetchFallbacks]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyLink = (type: 'nfc' | 'qr' = 'nfc') => {
    navigator.clipboard.writeText(type === 'qr' ? NFC_QR_URL : NFC_NFC_URL);
    toast.success(type === 'qr' ? "קישור QR הועתק" : "קישור NFC הועתק");
  };

  const downloadQR = async (format: 'svg' | 'png') => {
    if (!qrCodeInstance.current) return;
    if (format === 'svg') {
      await qrCodeInstance.current.download({ name: "diamony-qr-code", extension: "svg" });
    } else {
      // High-DPI PNG (1024×1024)
      const hiRes = new QRCodeStyling({
        width: 1024,
        height: 1024,
        type: "canvas",
        data: NFC_QR_URL,
        qrOptions: { errorCorrectionLevel: "L" },
        dotsOptions: { color: "#1a1a1a", type: "rounded" },
        cornersSquareOptions: { color: "#0a0a0a", type: "extra-rounded" },
        cornersDotOptions: { color: "#0a0a0a", type: "dot" },
        backgroundOptions: { color: "#ffffff" },
        margin: 48,
      });
      await hiRes.download({ name: "diamony-qr-code-hd", extension: "png" });
    }
  };

  const toggleActive = async (card: NfcCard) => {
    await supabase
      .from("nfc_catalog_cards")
      .update({ is_active: !card.is_active })
      .eq("id", card.id);
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, is_active: !c.is_active } : c))
    );
    toast.success(card.is_active ? "הכרטיס הוסתר" : "הכרטיס הופעל");
  };

  const reorderCards = async (section: string, oldIndex: number, newIndex: number) => {
    const sectionCards = cards.filter((c) => c.section === section);
    const reordered = arrayMove(sectionCards, oldIndex, newIndex);
    const updates = reordered.map((card, i) => ({ ...card, display_order: i }));

    // Optimistic update
    setCards((prev) => {
      const otherCards = prev.filter((c) => c.section !== section);
      return [...otherCards, ...updates].sort((a, b) => a.display_order - b.display_order);
    });

    // Persist
    for (const u of updates) {
      await supabase
        .from("nfc_catalog_cards")
        .update({ display_order: u.display_order })
        .eq("id", u.id);
    }
    toast.success("הסדר עודכן");
  };

  const saveCard = async (card: NfcCard) => {
    await supabase
      .from("nfc_catalog_cards")
      .update({
        title: card.title,
        image_url: card.image_url,
        category_id: card.category_id,
        custom_link: card.custom_link,
      })
      .eq("id", card.id);
    setEditingCard(null);
    fetchData();
    toast.success("הכרטיס עודכן");
  };

  const saveModalCard = async () => {
    if (!modalCard) return;
    await supabase
      .from("nfc_catalog_cards")
      .update({
        title: modalCard.title,
        image_url: modalCard.image_url,
        category_id: modalCard.category_id,
        short_text: modalCard.short_text,
        long_text: modalCard.long_text,
        show_title: modalCard.show_title,
        show_short_text: modalCard.show_short_text,
        show_long_text: modalCard.show_long_text,
      })
      .eq("id", modalCard.id);
    setModalCard(null);
    fetchData();
    toast.success("הכרטיס עודכן בהצלחה");
  };

  const addCard = async (section: string) => {
    const maxOrder = cards
      .filter((c) => c.section === section)
      .reduce((max, c) => Math.max(max, c.display_order), 0);

    await supabase.from("nfc_catalog_cards").insert({
      title: "כרטיס חדש",
      section,
      display_order: maxOrder + 1,
      is_active: false,
    });
    fetchData();
    toast.success("כרטיס חדש נוסף");
  };

  const deleteCard = async (id: string) => {
    await supabase.from("nfc_catalog_cards").delete().eq("id", id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast.success("הכרטיס נמחק");
  };

  const womenCards = cards.filter((c) => c.section === "women");
  const menCards = cards.filter((c) => c.section === "men");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            QR Code & קישור NFC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div ref={qrRef} />
            </div>
            <div className="flex-1 space-y-3">
              <Label className="text-xs text-muted-foreground">קישור QR מקוצר (מקודד ב-QR)</Label>
              <div className="flex gap-2">
                <Input value={NFC_QR_URL} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copyLink('qr')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">מפנה אל: {NFC_QR_DISPLAY_URL}</p>
              <Label className="text-xs text-muted-foreground">קישור NFC (עם מעקב)</Label>
              <div className="flex gap-2">
                <Input value={NFC_NFC_URL} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copyLink('nfc')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={() => downloadQR('svg')} variant="outline" size="sm">
                  <Download className="h-4 w-4 ml-2" />
                  הורד SVG
                </Button>
                <Button onClick={() => downloadQR('png')} variant="outline" size="sm">
                  <Download className="h-4 w-4 ml-2" />
                  הורד PNG (HD)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Digital Card Settings */}
      <DigitalCardSettings />

      {/* Theme & Media Settings */}
      <DigitalCardThemeSettings />

      {/* Women's Cards */}
      <CardSection
        title="כרטיסי נשים"
        section="women"
        cards={womenCards}
        categories={categories}
        categoryFallbacks={categoryFallbacks}
        editingCard={editingCard}
        onEdit={setEditingCard}
        onSave={saveCard}
        onToggle={toggleActive}
        onDelete={deleteCard}
        onAdd={() => addCard("women")}
        onDoubleClick={(card) => setModalCard({ ...card })}
        onReorder={reorderCards}
      />

      {/* Men's Cards */}
      <CardSection
        title="כרטיסי גברים"
        section="men"
        cards={menCards}
        categories={categories}
        categoryFallbacks={categoryFallbacks}
        editingCard={editingCard}
        onEdit={setEditingCard}
        onSave={saveCard}
        onToggle={toggleActive}
        onDelete={deleteCard}
        onAdd={() => addCard("men")}
        onDoubleClick={(card) => setModalCard({ ...card })}
        onReorder={reorderCards}
      />

      {/* Double-Click Edit Modal */}
      <Dialog open={!!modalCard} onOpenChange={(open) => !open && setModalCard(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עריכת כרטיס – {modalCard?.title}</DialogTitle>
            <DialogDescription>לחץ פעמיים על שורה כדי לערוך את כל פרטי הכרטיס</DialogDescription>
          </DialogHeader>
          {modalCard && (
            <div className="space-y-5 py-2">
              {/* Cover Image */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">תמונת קאבר NFC</Label>
                <MediaSelector
                  mediaUrl={modalCard.image_url || ""}
                  mediaType="image"
                  onMediaChange={(url) => setModalCard({ ...modalCard, image_url: url })}
                  bucket="catalog-media"
                />
              </div>

              {/* Title */}
              <div>
                <Label className="text-sm font-semibold mb-1 block">כותרת</Label>
                <Input
                  value={modalCard.title}
                  onChange={(e) => setModalCard({ ...modalCard, title: e.target.value })}
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm font-semibold mb-1 block">קטגוריה מקושרת</Label>
                <select
                  value={modalCard.category_id || ""}
                  onChange={(e) =>
                    setModalCard({ ...modalCard, category_id: e.target.value || null })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">ללא קטגוריה</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Text */}
              <div>
                <Label className="text-sm font-semibold mb-1 block">טקסט קצר (כותרת משנה)</Label>
                <Input
                  value={modalCard.short_text || ""}
                  onChange={(e) => setModalCard({ ...modalCard, short_text: e.target.value })}
                  placeholder="תיאור קצר לכרטיס"
                />
              </div>

              {/* Long Text */}
              <div>
                <Label className="text-sm font-semibold mb-1 block">טקסט ארוך (תיאור מפורט)</Label>
                <Textarea
                  value={modalCard.long_text || ""}
                  onChange={(e) => setModalCard({ ...modalCard, long_text: e.target.value })}
                  placeholder="תיאור עשיר ומפורט של הקטגוריה"
                  rows={4}
                />
              </div>

              {/* Display Toggles */}
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-semibold text-muted-foreground">בקרות תצוגה בכרטיס</p>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">הצג כותרת</Label>
                  <Switch
                    checked={modalCard.show_title}
                    onCheckedChange={(v) => setModalCard({ ...modalCard, show_title: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">הצג טקסט קצר</Label>
                  <Switch
                    checked={modalCard.show_short_text}
                    onCheckedChange={(v) => setModalCard({ ...modalCard, show_short_text: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">הצג טקסט ארוך</Label>
                  <Switch
                    checked={modalCard.show_long_text}
                    onCheckedChange={(v) => setModalCard({ ...modalCard, show_long_text: v })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setModalCard(null)}>
              ביטול
            </Button>
            <Button onClick={saveModalCard}>שמור שינויים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CardSectionProps {
  title: string;
  section: string;
  cards: NfcCard[];
  categories: Category[];
  categoryFallbacks: Record<string, string>;
  editingCard: NfcCard | null;
  onEdit: (card: NfcCard | null) => void;
  onSave: (card: NfcCard) => void;
  onToggle: (card: NfcCard) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onDoubleClick: (card: NfcCard) => void;
  onReorder: (section: string, oldIndex: number, newIndex: number) => void;
}

const CardSection = ({
  title,
  section,
  cards,
  categories,
  categoryFallbacks,
  editingCard,
  onEdit,
  onSave,
  onToggle,
  onDelete,
  onAdd,
  onDoubleClick,
  onReorder,
}: CardSectionProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    onReorder(section, oldIndex, newIndex);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 ml-1" />
            הוסף כרטיס
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">💡 גרור להזיז · לחץ פעמיים לעריכה מתקדמת</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {cards.map((card) =>
                editingCard?.id === card.id ? (
                  <EditCardRow
                    key={card.id}
                    card={editingCard}
                    categories={categories}
                    onChange={onEdit}
                    onSave={() => onSave(editingCard)}
                    onCancel={() => onEdit(null)}
                  />
                ) : (
                  <SortableNfcRow
                    key={card.id}
                    card={card}
                    categoryFallbacks={categoryFallbacks}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDoubleClick={onDoubleClick}
                  />
                )
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};

const SortableNfcRow = ({
  card,
  categoryFallbacks,
  onToggle,
  onEdit,
  onDelete,
  onDoubleClick,
}: {
  card: NfcCard;
  categoryFallbacks: Record<string, string>;
  onToggle: (c: NfcCard) => void;
  onEdit: (c: NfcCard) => void;
  onDelete: (id: string) => void;
  onDoubleClick: (c: NfcCard) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayImage = card.image_url || (card.category_id ? categoryFallbacks[card.category_id] : null);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer select-none ${
        isDragging ? "shadow-lg bg-[#F8F9FA] opacity-90 z-50" : ""
      }`}
      onDoubleClick={() => onDoubleClick(card)}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      {displayImage ? (
        <img
          src={displayImage}
          alt={card.title}
          className={`w-12 h-12 rounded-lg object-cover shrink-0 ${!card.image_url ? "opacity-60 border border-dashed border-muted-foreground/30" : ""}`}
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-muted shrink-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">—</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{card.title}</p>
        <p className="text-xs text-muted-foreground">
          סדר: {card.display_order}
          {!card.image_url && displayImage && <span className="mr-2 text-amber-600">· תמונת מוצר</span>}
        </p>
      </div>
      <Switch checked={card.is_active} onCheckedChange={() => onToggle(card)} />
      <Button variant="ghost" size="sm" onClick={() => onEdit({ ...card })}>
        ערוך
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={() => onDelete(card.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface EditCardRowProps {
  card: NfcCard;
  categories: Category[];
  onChange: (card: NfcCard) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditCardRow = ({ card, categories, onChange, onSave, onCancel }: EditCardRowProps) => (
  <div className="p-4 rounded-lg border-2 border-primary/30 bg-accent/10 space-y-3">
    <Input
      value={card.title}
      onChange={(e) => onChange({ ...card, title: e.target.value })}
      placeholder="שם הכרטיס"
    />
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">קטגוריה מקושרת</label>
      <select
        value={card.category_id || ""}
        onChange={(e) => onChange({ ...card, category_id: e.target.value || null })}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">ללא קטגוריה</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">תמונה</label>
      <MediaSelector
        mediaUrl={card.image_url || ""}
        mediaType="image"
        onMediaChange={(url) => onChange({ ...card, image_url: url })}
        bucket="catalog-media"
      />
    </div>
    <div className="flex gap-2">
      <Button size="sm" onClick={onSave}>
        שמור
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        ביטול
      </Button>
    </div>
  </div>
);

export default NfcCatalogManager;
