import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Search, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  main_image_url: string | null;
  category_id: string | null;
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (product: Product | null) => void;
  selectedProduct: Product | null;
  placeholder?: string;
  label?: string;
  searchBySku?: boolean;
  disabled?: boolean;
}

const ProductAutocomplete = ({
  value,
  onChange,
  onProductSelect,
  selectedProduct,
  placeholder = "חיפוש מוצר...",
  label,
  searchBySku = false,
  disabled = false,
}: ProductAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch products for autocomplete
  const { data: products = [] } = useQuery({
    queryKey: ["products-autocomplete", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      let query = supabase
        .from("products")
        .select("id, name, sku, main_image_url, category_id")
        .eq("is_active", true)
        .limit(10);

      if (searchBySku) {
        // Search by SKU (exact or partial match)
        query = query.or(`sku.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      } else {
        // Search by name
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: searchQuery.length >= 2 && !selectedProduct,
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync external value
  useEffect(() => {
    if (!selectedProduct) {
      setSearchQuery(value);
    }
  }, [value, selectedProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
    
    // Clear selected product if user modifies the text
    if (selectedProduct && newValue !== selectedProduct.name) {
      onProductSelect(null);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSearchQuery(product.name);
    onChange(product.name);
    onProductSelect(product);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onProductSelect(null);
    setIsOpen(false);
  };

  const showDropdown = isOpen && searchQuery.length >= 2 && !selectedProduct;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <Label className="text-xs mb-1 block">{label}</Label>
      )}
      
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "h-9 pr-9",
            selectedProduct && "border-green-500 bg-green-50/50"
          )}
          disabled={disabled}
        />
        {selectedProduct && (
          <Check className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
        )}
      </div>

      {/* Selected product indicator */}
      {selectedProduct && (
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs gap-1">
            <Package className="w-3 h-3" />
            מוצר קיים: {selectedProduct.sku || selectedProduct.name}
          </Badge>
          <button
            type="button"
            onClick={() => {
              onProductSelect(null);
              setSearchQuery("");
              onChange("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            בטל
          </button>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg">
          <ScrollArea className="max-h-60">
            {products.length > 0 ? (
              <div className="p-1">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded text-right transition-colors"
                  >
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {product.sku}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                לא נמצאו מוצרים תואמים
              </div>
            ) : null}

            {/* Create new option */}
            <div className="border-t p-1">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded text-right transition-colors text-primary"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">צור מוצר חדש: "{searchQuery}"</span>
              </button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;
