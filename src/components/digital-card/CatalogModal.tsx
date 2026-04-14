import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
  theme: {
    primary: string;
    accent: string;
  };
}

interface NfcCard {
  id: string;
  title: string;
  image_url: string | null;
  category_id: string | null;
  section: string;
  display_order: number;
  is_active: boolean;
}

interface NfcProduct {
  id: string;
  name: string;
  price: number | null;
  main_image_url: string | null;
  slug: string;
}

type View = "categories" | "products";

const DigitalCardCatalogModal = ({ open, onClose, theme }: CatalogModalProps) => {
  const [view, setView] = useState<View>("categories");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  // Fetch NFC cards (categories) grouped by section
  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ["digital-card-nfc-cards"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nfc_catalog_cards")
        .select("id, title, image_url, category_id, section, display_order, is_active")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      return (data || []) as NfcCard[];
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch products for selected category
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["digital-card-products", selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, price, main_image_url, slug")
        .eq("category_id", selectedCategoryId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(50);
      return (data || []) as NfcProduct[];
    },
    enabled: open && view === "products" && !!selectedCategoryId,
    staleTime: 1000 * 60 * 5,
  });

  const womenCards = useMemo(() => (cards || []).filter(c => c.section === "women"), [cards]);
  const menCards = useMemo(() => (cards || []).filter(c => c.section === "men"), [cards]);

  const handleCategoryClick = (card: NfcCard) => {
    if (!card.category_id) return;
    setSelectedCategoryId(card.category_id);
    setSelectedCategoryName(card.title);
    setView("products");
  };

  const handleBack = () => {
    setView("categories");
    setSelectedCategoryId(null);
    setSelectedCategoryName("");
  };

  const handleClose = () => {
    handleBack();
    onClose();
  };

  if (!open) return null;

  const cssVars = {
    "--dc-primary": theme.primary,
    "--dc-accent": theme.accent,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl" style={cssVars}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />
      <div className="relative w-full bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {view === "products" && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm font-medium transition-colors"
                style={{ color: "var(--dc-primary)" }}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                חזור
              </button>
            )}
            <h2 className="text-lg font-bold" style={{ color: "var(--dc-primary)" }}>
              {view === "categories" ? "קטלוג מוצרים" : selectedCategoryName}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === "categories" ? (
            <CategoriesView
              womenCards={womenCards}
              menCards={menCards}
              isLoading={cardsLoading}
              onSelect={handleCategoryClick}
            />
          ) : (
            <ProductsView
              products={products || []}
              isLoading={productsLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Level 1: Categories ─── */

interface CategoriesViewProps {
  womenCards: NfcCard[];
  menCards: NfcCard[];
  isLoading: boolean;
  onSelect: (card: NfcCard) => void;
}

const CategoriesView = ({ womenCards, menCards, isLoading, onSelect }: CategoriesViewProps) => {
  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const hasWomen = womenCards.length > 0;
  const hasMen = menCards.length > 0;

  if (!hasWomen && !hasMen) {
    return <p className="text-center text-gray-400 py-12 text-sm">אין קטגוריות להצגה</p>;
  }

  return (
    <div className="px-4 py-5 space-y-6">
      {hasWomen && (
        <CollectionSection
          title="קולקציית תכשיטי נשים"
          cards={womenCards}
          onSelect={onSelect}
        />
      )}
      {hasMen && (
        <CollectionSection
          title="קולקציית תכשיטי גברים"
          cards={menCards}
          onSelect={onSelect}
        />
      )}
    </div>
  );
};

interface CollectionSectionProps {
  title: string;
  cards: NfcCard[];
  onSelect: (card: NfcCard) => void;
}

const CollectionSection = ({ title, cards, onSelect }: CollectionSectionProps) => (
  <div>
    <h3 className="text-sm font-bold tracking-wide text-gray-500 uppercase mb-3 px-1">
      {title}
    </h3>
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onSelect(card)}
          disabled={!card.category_id}
          className="group relative aspect-[4/5] rounded-2xl overflow-hidden text-right disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ focusRingColor: "var(--dc-accent)" } as React.CSSProperties}
        >
          {/* Image */}
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Label */}
          <div className="absolute bottom-0 inset-x-0 p-4">
            <p className="text-white font-bold text-base leading-tight drop-shadow-lg">
              {card.title}
            </p>
            <div className="flex items-center gap-1 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <span className="text-white/80 text-xs">צפה בקולקציה</span>
              <ChevronRight className="w-3 h-3 text-white/80 rotate-180" />
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

/* ─── Level 2: Products ─── */

interface ProductsViewProps {
  products: NfcProduct[];
  isLoading: boolean;
}

const ProductsView = ({ products, isLoading }: ProductsViewProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 py-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <p className="text-center text-gray-400 py-12 text-sm">אין מוצרים להצגה</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-5">
      {products.map((product) => (
        <a
          key={product.id}
          href={`/product/${product.slug}`}
          className="group rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="aspect-square overflow-hidden bg-gray-50">
            {product.main_image_url ? (
              <img
                src={product.main_image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                אין תמונה
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold line-clamp-2 leading-snug" style={{ color: "var(--dc-primary)" }}>
              {product.name}
            </p>
            {product.price != null && (
              <p className="text-xs font-bold mt-1.5" style={{ color: "var(--dc-accent)" }}>
                ₪{product.price.toLocaleString()}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
};

export default DigitalCardCatalogModal;
