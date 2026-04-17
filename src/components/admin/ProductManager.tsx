import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Pencil, Trash2, Loader2, Package, Sparkles, Image, Copy, Tag, Percent, MoreVertical, GripVertical, Star, ArrowUp, DollarSign, CalendarDays, BookOpen, Save, X, AlertTriangle, CheckCircle, Wrench, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ProductGalleryManager from "./ProductGalleryManager";
import ProductImageUploader from "./ProductImageUploader";
import ProductVideoUploader from "./ProductVideoUploader";
import ContentSyncWrapper from "./ContentSyncWrapper";
import ProductVariantManager from "./ProductVariantManager";
import ProductAeoSpecs from "./ProductAeoSpecs";
import FeaturedReviewSelector from "./FeaturedReviewSelector";
import { LocalContentOverrides } from "@/lib/contentSync";
import { generateEnglishSlug, ensureUniqueSlug, generateLegacySlug } from "@/lib/slugUtils";
import { useAdminSaveMutation } from "@/hooks/useAdminSaveMutation";
import { getBrandId } from "@/lib/brandId";

interface Product {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  sku: string | null;
  description: string | null;
  short_description: string | null;
  gold_type: string | null;
  stone_type: string | null;
  stone_weight: string | null;
  price: number | null;
  category_id: string | null;
  main_image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  sale_price: number | null;
  original_price: number | null;
  sale_badge_text: string | null;
  display_order: number | null;
  external_url: string | null;
  ai_status: string | null;
  mto_story: string | null;
  published_at: string | null;
  product_story_id: string | null;
  local_content_overrides: LocalContentOverrides | null;
  // Pricing fields - ADMIN ONLY
  gold_weight_grams: number | null;
  base_labor_markup: number | null;
  is_diamond_jewelry: boolean;
  is_engagement_ring: boolean;
   is_gemstone_ring: boolean;
  is_pearl_jewelry: boolean;
  is_mens_jewelry: boolean;
  is_mens_pendant: boolean;
  stock_status: 'in_stock' | 'made_to_order' | 'out_of_stock';
}

interface ProductStory {
  id: string;
  title: string;
  content_body?: string | null;
  category: string | null;
  is_default: boolean | null;
}

interface Category {
  id: string;
  name: string;
}

interface UploadedImage {
  url: string;
  alt_text: string;
  file_name: string;
  isMain?: boolean;
}

interface SortableProductRowProps {
  product: Product;
  index: number;
  isActive: boolean;
  isBroken: boolean;
  failedImages: Set<string>;
  setFailedImages: React.Dispatch<React.SetStateAction<Set<string>>>;
  getCategoryName: (id: string | null) => string;
  openEditDialog: (product: Product) => void;
  duplicateProduct: (product: Product) => void;
  promoteProduct: (product: Product) => void;
  deleteProduct: { mutate: (id: string) => void };
}

const SortableProductRow = ({ product, index, isActive, isBroken, failedImages, setFailedImages, getCategoryName, openEditDialog, duplicateProduct, promoteProduct, deleteProduct }: SortableProductRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg group transition-all",
        isActive ? "shadow-lg bg-[#F8F9FA] opacity-90 scale-[1.02]" : "",
        isBroken
          ? "bg-destructive/10 border border-destructive/30 hover:bg-destructive/20"
          : "bg-muted/50 hover:bg-muted/70"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>
      <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
      {product.main_image_url && !failedImages.has(product.id) ? (
        <img
          src={product.main_image_url}
          alt={product.name}
          className="w-14 h-14 object-cover rounded"
          onError={() => {
            setFailedImages(prev => new Set(prev).add(product.id));
          }}
        />
      ) : (
        <div className="w-14 h-14 bg-muted rounded flex items-center justify-center relative">
          <Image className="h-6 w-6 text-muted-foreground" />
          {!product.main_image_url && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" title="חסרה תמונה" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{product.name}</p>
          {product.is_featured && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
          {product.is_on_sale && (
            <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">מבצע</span>
          )}
          {(product as any).ai_status === "completed" && (
            <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" />AI
            </span>
          )}
          {isBroken && (
            <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3" />שבור
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {product.sku && <span className="font-mono text-primary">{product.sku} • </span>}
          {getCategoryName(product.category_id)} • {product.gold_type || "ללא סוג זהב"}
        </p>
      </div>
      {product.is_on_sale && product.sale_price ? (
        <div className="text-left">
          <p className="font-medium text-destructive">₪{product.sale_price.toLocaleString()}</p>
          {product.original_price && (
            <p className="text-xs text-muted-foreground line-through">₪{product.original_price.toLocaleString()}</p>
          )}
        </div>
      ) : product.price ? (
        <p className="font-medium">₪{product.price.toLocaleString()}</p>
      ) : null}
      <div className={`px-2 py-1 rounded text-xs ${product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
        {product.is_active ? "פעיל" : "לא פעיל"}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openEditDialog(product)}>
            <Pencil className="h-4 w-4 ml-2" />עריכה
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicateProduct(product)}>
            <Copy className="h-4 w-4 ml-2" />שכפול
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => promoteProduct(product)}>
            <ArrowUp className="h-4 w-4 ml-2" />קידום לראש הרשימה
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => { if (confirm("האם למחוק את המוצר?")) deleteProduct.mutate(product.id); }}
          >
            <Trash2 className="h-4 w-4 ml-2" />מחיקה
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const ProductManager = () => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isDuplicatedProduct, setIsDuplicatedProduct] = useState(false);
  // Image fallback state - tracks images that failed to load
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  // Story editing state
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [editedStoryContent, setEditedStoryContent] = useState("");
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    slug: "",
    sku: "",
    description: "",
    short_description: "",
    gold_type: "",
    stone_type: "",
    stone_weight: "",
    price: "",
    category_id: "",
    main_image_url: "",
    video_url: "",
    is_active: true,
    is_featured: false,
    is_on_sale: false,
    sale_price: "",
    original_price: "",
    sale_badge_text: "מבצע!",
    external_url: "",
    mto_story: "",
    published_at: new Date().toISOString(),
    product_story_id: "",
    // Dynamic pricing fields
    gold_weight_grams: "",
    base_labor_markup: "",
    is_diamond_jewelry: false,
    is_engagement_ring: false,
    is_gemstone_ring: false,
    is_pearl_jewelry: false,
    is_mens_jewelry: false,
    is_mens_pendant: false,
    stock_status: "made_to_order" as 'in_stock' | 'made_to_order' | 'out_of_stock',
    featured_review_id: "",
  });
  const [fixingImages, setFixingImages] = useState(false);
  const [validatingData, setValidatingData] = useState(false);
  const [repairingLinks, setRepairingLinks] = useState(false);
  const [brokenProducts, setBrokenProducts] = useState<Set<string>>(new Set());
  const [validationComplete, setValidationComplete] = useState(false);
  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", getBrandId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories", getBrandId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: productStories } = useQuery({
    queryKey: ["admin-product-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_stories")
        .select("id, title, content_body, category, is_default")
        .order("is_default", { ascending: false })
        .order("title");
      if (error) throw error;
      return data as ProductStory[];
    },
  });

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product) => {
      // Category filter
      const matchesCategory = 
        categoryFilter === "all" || 
        product.category_id === categoryFilter;
      
      // Search filter (name, SKU, or name_en - case-insensitive)
      const searchTerm = debouncedSearch.toLowerCase().trim();
      const matchesSearch = 
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku?.toLowerCase().includes(searchTerm) ||
        product.name_en?.toLowerCase().includes(searchTerm);
      
      return matchesCategory && matchesSearch;
    });
  }, [products, categoryFilter, debouncedSearch]);

  // Check if any filter is active
  const hasActiveFilters = categoryFilter !== "all" || searchQuery.trim() !== "";

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  // Get default story for a category
  const getDefaultStoryForCategory = (categoryId: string | null): string => {
    if (!productStories || !categoryId) return "";
    
    // Find the category name/slug
    const category = categories?.find(c => c.id === categoryId);
    if (!category) return "";
    
    // Map category name to story category value
    const categoryMap: Record<string, string> = {
      "טבעות": "rings",
      "עגילים": "earrings", 
      "תליונים": "pendants",
      "צמידים": "bracelets",
      "שרשראות": "necklaces",
      "סטים": "sets",
    };
    
    const storyCategory = categoryMap[category.name] || "";
    
    // First try to find a default story for this specific category
    const categoryDefault = productStories.find(
      s => s.is_default && s.category === storyCategory
    );
    if (categoryDefault) return categoryDefault.id;
    
    // Fall back to general default
    const generalDefault = productStories.find(
      s => s.is_default && s.category === "general"
    );
    return generalDefault?.id || "";
  };

  // Generate unique slug - now prefers English from name_en
  const generateUniqueSlug = (name: string, sku?: string, nameEn?: string) => {
    // If name_en is provided, use English slug
    if (nameEn?.trim()) {
      try {
        return generateEnglishSlug(nameEn, sku);
      } catch {
        // Fall back to legacy Hebrew slug
      }
    }
    
    // Legacy: Hebrew-based slug with timestamp for uniqueness
    return generateLegacySlug(name, sku);
  };

  const createProduct = useAdminSaveMutation({
    queryKeysToInvalidate: [["admin-products"]],
    successMessage: "המוצר נוצר! כעת ניתן להוסיף וריאנטים ותמונות נוספות.",
    errorMessage: (error) => {
      if (error.message?.includes("products_slug_key") || (error as any).code === "23505") {
        return "מוצר עם שם דומה כבר קיים. נסה שם אחר או הוסף מק״ט ייחודי.";
      }
      return error.message || "שגיאה ביצירת המוצר";
    },
    mutationFn: async (data: typeof formData, signal) => {
      // Validate name_en is provided for new products
      if (!data.name_en?.trim()) {
        throw new Error("שם באנגלית נדרש ליצירת מוצר חדש (לצורך SEO)");
      }
      
      // Generate slug from name_en (English only)
      let slug = data.slug;
      if (!slug) {
        const baseSlug = generateUniqueSlug(data.name, data.sku || undefined, data.name_en);
        slug = await ensureUniqueSlug(baseSlug);
      }
      
      const mainImage = uploadedImages.find(img => img.isMain)?.url || uploadedImages[0]?.url || data.main_image_url;
      
      // Auto-assign default story if none selected
      const storyId = data.product_story_id || getDefaultStoryForCategory(data.category_id);
      
      const { data: newProduct, error } = await (supabase.from("products").insert({
        name: data.name,
        name_en: data.name_en,
        slug,
        sku: data.sku || null,
        description: data.description || null,
        short_description: data.short_description || null,
        gold_type: data.gold_type || null,
        stone_type: data.stone_type || null,
        stone_weight: data.stone_weight || null,
        price: data.price ? parseFloat(data.price) : null,
        category_id: data.category_id || null,
        main_image_url: mainImage || null,
        video_url: data.video_url || null,
        is_active: data.is_active,
        is_featured: data.is_featured,
        is_on_sale: data.is_on_sale,
        sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        sale_badge_text: data.sale_badge_text || "מבצע!",
        mto_story: data.mto_story || null,
        published_at: data.published_at || new Date().toISOString(),
        product_story_id: storyId || null,
        // Dynamic pricing fields
        gold_weight_grams: data.gold_weight_grams ? parseFloat(data.gold_weight_grams) : null,
        base_labor_markup: data.base_labor_markup ? parseFloat(data.base_labor_markup) : 0,
        is_diamond_jewelry: data.is_diamond_jewelry,
        is_engagement_ring: data.is_engagement_ring,
        is_gemstone_ring: data.is_gemstone_ring,
        is_pearl_jewelry: data.is_pearl_jewelry,
        is_mens_jewelry: data.is_mens_jewelry,
        is_mens_pendant: data.is_mens_pendant,
        stock_status: data.stock_status,
        featured_review_id: data.featured_review_id || null,
      }).select().single() as any).abortSignal(signal);
      
      if (error) throw error;

      // Add additional images to product_images table
      if (newProduct && uploadedImages.length > 0) {
        const imagesToInsert = uploadedImages.map((img, index) => ({
          product_id: newProduct.id,
          image_url: img.url,
          alt_text: img.alt_text || null,
          display_order: index,
        }));
        
        const { error: imagesError } = await (supabase.from("product_images").insert(imagesToInsert) as any).abortSignal(signal);
        if (imagesError) throw imagesError;
      }

      return newProduct;
    },
    onSuccess: (newProduct) => {
      // Stay in edit mode with the new product to allow adding variants
      if (newProduct) {
        setEditingProduct(newProduct as Product);
        setFormData(prev => ({
          ...prev,
          slug: newProduct.slug,
        }));
        setUploadedImages([]);
      }
      // Don't close dialog - let user add variants
    },
  });

  const updateProduct = useAdminSaveMutation({
    queryKeysToInvalidate: [["admin-products"], ["admin-inventory"]],
    successMessage: "המוצר עודכן בהצלחה",
    errorMessage: (error) => error.message || "שגיאה בעדכון המוצר",
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }, signal) => {
      const mainImage = uploadedImages.find(img => img.isMain)?.url || uploadedImages[0]?.url || data.main_image_url;
      
      const { error } = await (supabase
        .from("products")
        .update({
          name: data.name,
          name_en: data.name_en || null,
          slug: data.slug,
          sku: data.sku || null,
          description: data.description || null,
          short_description: data.short_description || null,
          gold_type: data.gold_type || null,
          stone_type: data.stone_type || null,
          stone_weight: data.stone_weight || null,
          price: data.price ? parseFloat(data.price) : null,
          category_id: data.category_id || null,
          main_image_url: mainImage || null,
          video_url: data.video_url || null,
          is_active: data.is_active,
          is_featured: data.is_featured,
          is_on_sale: data.is_on_sale,
          sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
          original_price: data.original_price ? parseFloat(data.original_price) : null,
          sale_badge_text: data.sale_badge_text || "מבצע!",
          external_url: data.external_url || null,
          mto_story: data.mto_story || null,
          published_at: data.published_at,
          product_story_id: data.product_story_id || null,
          // Dynamic pricing fields
          gold_weight_grams: data.gold_weight_grams ? parseFloat(data.gold_weight_grams) : null,
          base_labor_markup: data.base_labor_markup ? parseFloat(data.base_labor_markup) : 0,
          is_diamond_jewelry: data.is_diamond_jewelry,
           is_engagement_ring: data.is_engagement_ring,
          is_gemstone_ring: data.is_gemstone_ring,
          is_pearl_jewelry: data.is_pearl_jewelry,
          is_mens_jewelry: data.is_mens_jewelry,
          is_mens_pendant: data.is_mens_pendant,
          stock_status: data.stock_status,
          featured_review_id: data.featured_review_id || null,
        })
        .eq("id", id) as any)
        .abortSignal(signal);
      if (error) throw error;
    },
    onSuccess: () => {
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"], refetchType: 'active' });
      toast.success("המוצר נמחק");
    },
    onError: () => {
      toast.error("שגיאה במחיקת המוצר");
    },
  });

  const updateDisplayOrder = useAdminSaveMutation({
    queryKeysToInvalidate: [["admin-products"]],
    successMessage: "סדר המוצרים עודכן",
    errorMessage: "שגיאה בעדכון הסדר",
    mutationFn: async (updates: { id: string; display_order: number }[], signal) => {
      for (const update of updates) {
        const { error } = await (supabase
          .from("products")
          .update({ display_order: update.display_order })
          .eq("id", update.id) as any)
          .abortSignal(signal);
        if (error) throw error;
      }
    },
  });

  const promoteProduct = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: true, display_order: 0 })
        .eq("id", product.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["admin-products"], refetchType: 'active' });
      toast.success("המוצר קודם להצגה ראשונה");
    } catch (error: any) {
      toast.error(error.message || "שגיאה בקידום המוצר");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDndDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDndDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !filteredProducts) return;

    const oldIndex = filteredProducts.findIndex(p => p.id === active.id);
    const newIndex = filteredProducts.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredProducts, oldIndex, newIndex);
    const updates = reordered.map((p, i) => ({ id: p.id, display_order: i }));
    updateDisplayOrder.mutate(updates);
  };

  const duplicateProduct = async (product: Product) => {
    const newSlug = `${product.slug}-copy-${Date.now()}`;
    
    try {
      const { data: newProduct, error } = await supabase.from("products").insert({
        name: `${product.name} (העתק)`,
        name_en: product.name_en,
        slug: newSlug,
        sku: "", // Empty SKU - force manual entry
        description: product.description,
        short_description: product.short_description,
        gold_type: product.gold_type,
        stone_type: product.stone_type,
        stone_weight: product.stone_weight,
        price: product.price,
        category_id: product.category_id,
        main_image_url: null, // No image - treat as new product
        video_url: null, // No video - treat as new product
        is_active: false, // Start as inactive
        is_featured: false,
        is_on_sale: product.is_on_sale,
        sale_price: product.sale_price,
        original_price: product.original_price,
        sale_badge_text: product.sale_badge_text,
        gold_weight_grams: product.gold_weight_grams,
        base_labor_markup: product.base_labor_markup,
        is_diamond_jewelry: product.is_diamond_jewelry,
        is_engagement_ring: (product as any).is_engagement_ring || false,
        is_gemstone_ring: (product as any).is_gemstone_ring || false,
        is_pearl_jewelry: (product as any).is_pearl_jewelry || false,
        is_mens_jewelry: (product as any).is_mens_jewelry || false,
        is_mens_pendant: (product as any).is_mens_pendant || false,
        stock_status: product.stock_status,
        mto_story: product.mto_story,
        external_url: product.external_url,
      }).select().single();

      if (error) throw error;

      // No image copying - duplicated product starts clean like a new product

      queryClient.invalidateQueries({ queryKey: ["admin-products"], refetchType: 'active' });
      toast.success("המוצר שוכפל. נא להעלות תמונות חדשות.");
      
      // Open the duplicated product for editing
      if (newProduct) {
        setIsDuplicatedProduct(true);
        openEditDialog(newProduct as Product);
      }
    } catch (error: any) {
      toast.error(error.message || "שגיאה בשכפול המוצר");
    }
  };

  const generateAIContent = async () => {
    if (!formData.name) {
      toast.error("נא להזין שם מוצר קודם");
      return;
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-seo", {
        body: {
          type: "product_description",
          title: formData.name,
          content: `${formData.gold_type || ""} ${formData.stone_type || ""} ${formData.stone_weight || ""}`.trim(),
        },
      });

      if (error) throw error;

      // Parse the AI response
      const result = data.result || "";
      let shortDesc = "";
      let fullDesc = "";
      
      const shortMatch = result.match(/SHORT_DESCRIPTION:\s*(.*?)(?=FULL_DESCRIPTION:|$)/s);
      const fullMatch = result.match(/FULL_DESCRIPTION:\s*(.*?)$/s);
      
      if (shortMatch) {
        shortDesc = shortMatch[1].trim();
      }
      if (fullMatch) {
        fullDesc = fullMatch[1].trim();
      }

      setFormData((prev) => ({
        ...prev,
        description: fullDesc || prev.description,
        short_description: shortDesc || prev.short_description,
      }));

      toast.success("תיאור AI נוצר בהצלחה");
    } catch (error: any) {
      toast.error(error.message || "שגיאה ביצירת תיאור AI");
    } finally {
      setGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      name_en: "",
      slug: "",
      sku: "",
      description: "",
      short_description: "",
      gold_type: "",
      stone_type: "",
      stone_weight: "",
      price: "",
      category_id: "",
      main_image_url: "",
      video_url: "",
      is_active: true,
      is_featured: false,
      is_on_sale: false,
      sale_price: "",
      original_price: "",
      sale_badge_text: "מבצע!",
      external_url: "",
      mto_story: "",
      published_at: new Date().toISOString(),
      product_story_id: "",
      gold_weight_grams: "",
      base_labor_markup: "",
      is_diamond_jewelry: false,
      is_engagement_ring: false,
      is_gemstone_ring: false,
      is_pearl_jewelry: false,
      is_mens_jewelry: false,
      is_mens_pendant: false,
      stock_status: "made_to_order",
      featured_review_id: "",
    });
    setEditingProduct(null);
    setUploadedImages([]);
    setIsDuplicatedProduct(false);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    
    // If no main image - this is a duplicated product, reset uploaded images
    if (!product.main_image_url) {
      setUploadedImages([]);
    }
    
    setFormData({
      name: product.name,
      name_en: product.name_en || "",
      slug: product.slug,
      sku: product.sku || "",
      description: product.description || "",
      short_description: product.short_description || "",
      gold_type: product.gold_type || "",
      stone_type: product.stone_type || "",
      stone_weight: product.stone_weight || "",
      price: product.price?.toString() || "",
      category_id: product.category_id || "",
      main_image_url: product.main_image_url || "",
      video_url: product.video_url || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_on_sale: product.is_on_sale || false,
      sale_price: product.sale_price?.toString() || "",
      original_price: product.original_price?.toString() || "",
      sale_badge_text: product.sale_badge_text || "מבצע!",
      external_url: product.external_url || "",
      mto_story: product.mto_story || "",
      published_at: product.published_at || new Date().toISOString(),
      product_story_id: product.product_story_id || "",
      gold_weight_grams: product.gold_weight_grams?.toString() || "",
      base_labor_markup: product.base_labor_markup?.toString() || "",
      is_diamond_jewelry: product.is_diamond_jewelry || false,
      is_engagement_ring: (product as any).is_engagement_ring || false,
      is_gemstone_ring: (product as any).is_gemstone_ring || false,
      is_pearl_jewelry: (product as any).is_pearl_jewelry || false,
      is_mens_jewelry: (product as any).is_mens_jewelry || false,
      is_mens_pendant: (product as any).is_mens_pendant || false,
      stock_status: product.stock_status || "made_to_order",
      featured_review_id: (product as any).featured_review_id || "",
    });
    setUploadedImages([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProduct.mutate(formData);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "ללא קטגוריה";
    return categories?.find((c) => c.id === categoryId)?.name || "לא נמצא";
  };

  // Calculate discount percentage
  const calculateDiscount = () => {
    const original = parseFloat(formData.original_price);
    const sale = parseFloat(formData.sale_price);
    if (original && sale && original > sale) {
      return Math.round(((original - sale) / original) * 100);
    }
    return 0;
  };

  // Fix products with gallery images but no main_image_url
  const fixMissingMainImages = async () => {
    setFixingImages(true);
    try {
      // Get all products without main image
      const { data: productsWithoutImage, error: fetchError } = await supabase
        .from('products')
        .select('id, name')
        .is('main_image_url', null);
      
      if (fetchError) throw fetchError;
      
      let fixed = 0;
      for (const product of productsWithoutImage || []) {
        // Get first gallery image
        const { data: firstImage } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', product.id)
          .order('display_order')
          .limit(1)
          .single();
        
        if (firstImage) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ main_image_url: firstImage.image_url })
            .eq('id', product.id);
          
          if (!updateError) {
            console.log(`Fixed main image for: ${product.name}`);
            fixed++;
          }
        }
      }
      
      if (fixed > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-products"], refetchType: 'active' });
        toast.success(`תוקנו ${fixed} מוצרים`);
      } else {
        toast.info("אין מוצרים לתיקון");
      }
    } catch (error: any) {
      console.error('fixMissingMainImages error:', error);
      toast.error("שגיאה בתיקון תמונות");
    } finally {
      setFixingImages(false);
    }
  };

  // Validate all product data and mark broken records
  const validateProductData = async () => {
    setValidatingData(true);
    setBrokenProducts(new Set());
    setValidationComplete(false);
    
    try {
      const broken = new Set<string>();
      let issues = 0;
      
      for (const product of products || []) {
        const productIssues: string[] = [];
        
        // Check for invalid/broken main_image_url
        if (product.main_image_url) {
          const url = product.main_image_url;
          if (
            url === 'Invalid document' ||
            url === 'undefined' ||
            url === 'null' ||
            (!url.startsWith('http') && !url.startsWith('/'))
          ) {
            productIssues.push('קישור תמונה שבור');
          }
        }
        
        // Check for orphaned category_id
        if (product.category_id) {
          const category = categories?.find(c => c.id === product.category_id);
          if (!category) {
            productIssues.push('קטגוריה לא קיימת');
          }
        }
        
        // Check for invalid price data
        if (product.is_on_sale && !product.sale_price) {
          productIssues.push('במבצע ללא מחיר מבצע');
        }
        
        // Check for missing required fields
        if (!product.name || product.name.trim() === '') {
          productIssues.push('שם מוצר חסר');
        }
        
        if (productIssues.length > 0) {
          broken.add(product.id);
          issues++;
          console.warn(`Product "${product.name}" (${product.sku || product.id}):`, productIssues);
        }
      }
      
      setBrokenProducts(broken);
      setValidationComplete(true);
      
      if (issues > 0) {
        toast.warning(`נמצאו ${issues} מוצרים עם בעיות. מוצרים שבורים מסומנים באדום.`);
      } else {
        toast.success("כל המוצרים תקינים!");
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error("שגיאה בבדיקת הנתונים");
    } finally {
      setValidatingData(false);
    }
  };

  // Repair broken image links in database
  const repairBrokenImageLinks = async () => {
    setRepairingLinks(true);
    
    try {
      console.log("Starting database sanitization for DiamoNY...");
      
      // Find and update records with invalid image URLs
      const { data: brokenRecords, error: fetchError } = await supabase
        .from('products')
        .select('id, name, main_image_url')
        .or('main_image_url.eq.Invalid document,main_image_url.eq.undefined,main_image_url.eq.null');
      
      if (fetchError) throw fetchError;
      
      let repaired = 0;
      
      for (const product of brokenRecords || []) {
        // Try to get first gallery image as replacement
        const { data: firstImage } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', product.id)
          .order('display_order')
          .limit(1)
          .single();
        
        const newImageUrl = firstImage?.image_url || null;
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ main_image_url: newImageUrl })
          .eq('id', product.id);
        
        if (!updateError) {
          console.log(`Repaired: ${product.name} -> ${newImageUrl || 'null'}`);
          repaired++;
        }
      }
      
      // Also find URLs that don't start with http
      const { data: invalidUrls, error: invalidFetchError } = await supabase
        .from('products')
        .select('id, name, main_image_url')
        .not('main_image_url', 'is', null)
        .not('main_image_url', 'ilike', 'http%');
      
      if (!invalidFetchError) {
        for (const product of invalidUrls || []) {
          const { data: firstImage } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', product.id)
            .order('display_order')
            .limit(1)
            .single();
          
          const newImageUrl = firstImage?.image_url || null;
          
          const { error: updateError } = await supabase
            .from('products')
            .update({ main_image_url: newImageUrl })
            .eq('id', product.id);
          
          if (!updateError) {
            console.log(`Fixed invalid URL: ${product.name} -> ${newImageUrl || 'null'}`);
            repaired++;
          }
        }
      }
      
      if (repaired > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-products"], refetchType: 'active' });
        toast.success(`בוצע ניקוי בהצלחה. ${repaired} רשומות עודכנו.`);
        // Re-validate after repair
        setBrokenProducts(new Set());
        setValidationComplete(false);
      } else {
        toast.info("לא נמצאו קישורים שבורים לתיקון");
      }
    } catch (error: any) {
      console.error("Repair failed:", error);
      toast.error("חלה שגיאה במהלך התיקון. בדוק את הרשאות ה-RLS.");
    } finally {
      setRepairingLinks(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            מוצרים ({filteredProducts?.length || 0})
            {hasActiveFilters && products && (
              <span className="text-sm font-normal text-muted-foreground">
                מתוך {products.length}
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {/* Validate Data Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={validateProductData}
              disabled={validatingData}
              className={validationComplete && brokenProducts.size === 0 ? "border-green-500 text-green-600" : ""}
            >
              {validatingData ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : validationComplete && brokenProducts.size === 0 ? (
                <CheckCircle className="h-4 w-4 ml-2" />
              ) : (
                <Search className="h-4 w-4 ml-2" />
              )}
              בדוק נתונים
            </Button>

            {/* Repair Broken Links Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={repairBrokenImageLinks}
              disabled={repairingLinks}
            >
              {repairingLinks ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Wrench className="h-4 w-4 ml-2" />
              )}
              תיקון קישורים שבורים
            </Button>

            {/* Fix Missing Images Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={fixMissingMainImages}
              disabled={fixingImages}
            >
              {fixingImages ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Image className="h-4 w-4 ml-2" />
              )}
              תקן תמונות חסרות
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  מוצר חדש
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "עריכת מוצר" : "מוצר חדש"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">שם המוצר (עברית)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        // Auto-detect engagement ring from name
                        const isEngagement = newName.includes("אירוסין");
                        // Auto-detect pearl jewelry from name
                        const isPearl = newName.includes("פנינ");
                        setFormData({ 
                          ...formData, 
                          name: newName,
                          is_engagement_ring: isEngagement || formData.is_engagement_ring,
                          is_pearl_jewelry: isPearl || formData.is_pearl_jewelry
                        });
                      }}
                      placeholder="טבעת יהלום סוליטר"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_en">
                      שם באנגלית <span className="text-destructive">*</span>
                      <span className="text-xs text-muted-foreground mr-2">(ליצירת URL ידידותי ל-SEO)</span>
                    </Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) => {
                        const nameEn = e.target.value;
                        const newSlug = !editingProduct && nameEn.trim() 
                          ? generateUniqueSlug(formData.name, formData.sku || undefined, nameEn)
                          : formData.slug;
                        setFormData({ ...formData, name_en: nameEn, slug: newSlug });
                      }}
                      placeholder="Solitaire Diamond Ring"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">מק״ט (SKU)</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="RING-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category_id">קטגוריה</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">מחיר רגיל (₪)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                </div>

                {/* Sale Section */}
                <div className="border rounded-lg p-4 bg-destructive/5">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <Tag className="h-4 w-4 text-destructive" />
                      מבצע מיוחד
                    </Label>
                    <Switch
                      checked={formData.is_on_sale}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_on_sale: checked })}
                    />
                  </div>
                  
                  {formData.is_on_sale && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>מחיר מקורי (₪)</Label>
                          <Input
                            type="number"
                            value={formData.original_price}
                            onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                            placeholder="6000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>מחיר מבצע (₪)</Label>
                          <Input
                            type="number"
                            value={formData.sale_price}
                            onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                            placeholder="4500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1 ml-4">
                          <Label>טקסט תגית מבצע</Label>
                          <Input
                            value={formData.sale_badge_text}
                            onChange={(e) => setFormData({ ...formData, sale_badge_text: e.target.value })}
                            placeholder="מבצע!"
                          />
                        </div>
                        {calculateDiscount() > 0 && (
                          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg">
                            <Percent className="h-4 w-4" />
                            <span className="font-bold">{calculateDiscount()}% הנחה</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gold_type">סוג זהב</Label>
                    <Select
                      value={formData.gold_type}
                      onValueChange={(value) => setFormData({ ...formData, gold_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="14K צהוב">14K צהוב</SelectItem>
                        <SelectItem value="14K לבן">14K לבן</SelectItem>
                        <SelectItem value="14K רוזה">14K רוזה</SelectItem>
                        <SelectItem value="18K צהוב">18K צהוב</SelectItem>
                        <SelectItem value="18K לבן">18K לבן</SelectItem>
                        <SelectItem value="18K רוזה">18K רוזה</SelectItem>
                        <SelectItem value="פלטינום">פלטינום</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stone_type">סוג אבן</Label>
                    <Input
                      id="stone_type"
                      value={formData.stone_type}
                      onChange={(e) => setFormData({ ...formData, stone_type: e.target.value })}
                      placeholder="יהלום"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stone_weight">משקל אבן בסיסי</Label>
                    <Input
                      id="stone_weight"
                      value={formData.stone_weight}
                      onChange={(e) => setFormData({ ...formData, stone_weight: e.target.value })}
                      placeholder="0.5 קראט"
                    />
                  </div>
                </div>

                {/* Dynamic Pricing Section - ADMIN ONLY */}
                <div className="border rounded-lg p-4 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <Label className="text-base font-medium">תמחור דינמי (נתונים פנימיים)</Label>
                    <span className="text-xs text-muted-foreground bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                      מידע זה לא מוצג ללקוחות
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gold_weight_grams">משקל זהב (גרם)</Label>
                      <Input
                        id="gold_weight_grams"
                        type="number"
                        step="0.01"
                        value={formData.gold_weight_grams}
                        onChange={(e) => setFormData({ ...formData, gold_weight_grams: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="base_labor_markup">עלות עבודה + מרווח (₪)</Label>
                      <Input
                        id="base_labor_markup"
                        type="number"
                        value={formData.base_labor_markup}
                        onChange={(e) => setFormData({ ...formData, base_labor_markup: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>תכשיט יהלומים</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={formData.is_diamond_jewelry}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_diamond_jewelry: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.is_diamond_jewelry ? 'כן (יציג "החל מ-")' : 'לא'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>טבעת אירוסין</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={formData.is_engagement_ring}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_engagement_ring: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.is_engagement_ring ? 'כן' : 'לא'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>מחרוזת פנינים</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={formData.is_pearl_jewelry}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_pearl_jewelry: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.is_pearl_jewelry ? 'כן' : 'לא'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>טבעת אבני חן</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={formData.is_gemstone_ring}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_gemstone_ring: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.is_gemstone_ring ? 'כן' : 'לא'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>תכשיט לגבר</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={formData.is_mens_jewelry}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_mens_jewelry: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.is_mens_jewelry ? 'כן' : 'לא'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>תליון לגבר</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={formData.is_mens_pendant}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_mens_pendant: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.is_mens_pendant ? 'כן' : 'לא'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>סטטוס מלאי</Label>
                      <Select
                        value={formData.stock_status}
                        onValueChange={(value: 'in_stock' | 'made_to_order' | 'out_of_stock') => 
                          setFormData({ ...formData, stock_status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">במלאי</SelectItem>
                          <SelectItem value="made_to_order">להזמנה</SelectItem>
                          <SelectItem value="out_of_stock">אזל</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Image Upload - For new products AND duplicated products without images */}
                {(!editingProduct || (isDuplicatedProduct && !formData.main_image_url)) && (
                  <ProductImageUploader
                    images={uploadedImages}
                    onImagesChange={setUploadedImages}
                    maxImages={5}
                  />
                )}

                {/* Video Upload */}
                <ProductVideoUploader
                  videoUrl={formData.video_url}
                  onVideoChange={(url) => setFormData({ ...formData, video_url: url })}
                />

                {/* Gallery Manager for existing products with images */}
                {editingProduct && !isDuplicatedProduct && (
                  <div className="border-t pt-4">
                    <ProductGalleryManager productId={editingProduct.id} />
                  </div>
                )}

                {/* Metal Variants Manager */}
                <ProductVariantManager 
                  productId={editingProduct?.id || null}
                  productSku={formData.sku}
                />

                {/* Dynamic Content Section - Moved here for better workflow */}
                <ContentSyncWrapper
                  productName={formData.name}
                  categoryId={formData.category_id}
                  categories={categories}
                  productStories={productStories}
                  initialStoryId={formData.product_story_id}
                  initialLocalOverrides={editingProduct?.local_content_overrides}
                  initialShortDescription={formData.short_description}
                  initialFullDescription={formData.description}
                  imageUrl={formData.main_image_url || uploadedImages.find(img => img.isMain)?.url || uploadedImages[0]?.url}
                  productSlug={editingProduct?.slug || formData.slug}
                  externalUrl={formData.external_url}
                  stockStatus={formData.stock_status}
                  goldType={formData.gold_type}
                  stoneType={formData.stone_type}
                  stoneWeight={formData.stone_weight}
                  onFormUpdate={(updates) => setFormData({ ...formData, ...updates })}
                />

                {/* Technical Specs (AEO) */}
                <ProductAeoSpecs productId={editingProduct?.id || null} />

                {/* Featured Review Selector */}
                <FeaturedReviewSelector
                  value={formData.featured_review_id}
                  onChange={(v) => setFormData({ ...formData, featured_review_id: v })}
                />

                {/* MTO Story Section - Marketing/Brand Content */}
                <div className="space-y-2 border rounded-lg p-4 bg-accent/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="mto_story" className="text-base font-medium">
                      The MTO Story - אמנות היצירה
                    </Label>
                    <span 
                      className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground"
                      title="Explain the bespoke process for this item to build trust"
                    >
                      ⓘ
                    </span>
                  </div>
                  <Textarea
                    id="mto_story"
                    value={formData.mto_story}
                    onChange={(e) => setFormData({ ...formData, mto_story: e.target.value })}
                    placeholder="תאר את תהליך היצירה הייחודי של מוצר זה...&#10;&#10;• פגישת ייעוץ אישית&#10;• תכנון ועיצוב מדויק&#10;• יציקה ידנית&#10;• שיבוץ אבנים מקצועי&#10;• השלמה והברקה"
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    תוכן זה יופיע בעמוד המוצר תחת "אמנות היצירה"
                  </p>
                </div>

                {/* Published Date Picker */}
                <div className="space-y-2">
                  <Label>תאריך פרסום</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !formData.published_at && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="ml-2 h-4 w-4" />
                        {formData.published_at ? (
                          format(new Date(formData.published_at), "dd בMMMM yyyy", { locale: he })
                        ) : (
                          <span>בחר תאריך</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.published_at ? new Date(formData.published_at) : undefined}
                        onSelect={(date) => setFormData({ 
                          ...formData, 
                          published_at: date ? date.toISOString() : new Date().toISOString() 
                        })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    תאריך זה יוצג למבקרים באתר, ניתן לתזמן לעתיד או לאחר לאחור
                  </p>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">פעיל</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label htmlFor="is_featured">מומלץ</Label>
                  </div>
                </div>

                {/* Action Buttons - Static at end of form */}
                <div className="pt-8 mt-6 border-t">
                  <div className="flex items-center justify-between gap-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsDialogOpen(false)}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4 ml-2" />
                      ביטול
                    </Button>
                    
                    <div className="flex items-center gap-3">
                      {/* Preview Button - only if slug exists */}
                      {(editingProduct?.slug || formData.slug) && (
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const slug = editingProduct?.slug || formData.slug;
                            if (slug) window.open(`/product/${slug}`, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          צפייה בעמוד
                        </Button>
                      )}
                      
                      {/* Save Button */}
                      <Button 
                        type="submit" 
                        disabled={createProduct.isPending || updateProduct.isPending}
                        className="min-w-[120px]"
                      >
                        {(createProduct.isPending || updateProduct.isPending) && (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        )}
                        <Save className="h-4 w-4 ml-2" />
                        {editingProduct ? "עדכן מוצר" : "צור מוצר"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="חיפוש לפי שם או מק״ט..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={clearFilters}
                className="shrink-0"
                title="נקה סינון"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !products?.length ? (
            <p className="text-center text-muted-foreground py-8">
              אין מוצרים. צור את המוצר הראשון!
            </p>
          ) : filteredProducts.length === 0 ? (
            /* Empty State for filtered results */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">לא נמצאו מוצרים התואמים לחיפוש</h3>
              <p className="text-sm text-muted-foreground mb-4">
                נסו לשנות את הקטגוריה או לחפש מילות מפתח אחרות
              </p>
              <Button variant="outline" onClick={clearFilters}>
                נקה סינון
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product List with Drag & Drop */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">גרור מוצרים לשינוי סדר התצוגה</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDndDragStart} onDragEnd={handleDndDragEnd}>
                  <SortableContext items={filteredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {filteredProducts.map((product, index) => (
                      <SortableProductRow
                        key={product.id}
                        product={product}
                        index={index}
                        isActive={activeDragId === product.id}
                        isBroken={brokenProducts.has(product.id)}
                        failedImages={failedImages}
                        setFailedImages={setFailedImages}
                        getCategoryName={getCategoryName}
                        openEditDialog={openEditDialog}
                        duplicateProduct={duplicateProduct}
                        promoteProduct={promoteProduct}
                        deleteProduct={deleteProduct}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManager;
