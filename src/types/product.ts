/**
 * Unified Product Type Definitions
 * Single source of truth for all product-related interfaces
 */

import type { Database } from "@/integrations/supabase/types";

// Stock status from database enum
export type StockStatus = Database["public"]["Enums"]["stock_status"];

// Product image interface used across gallery, cards, and detail pages
export interface ProductImage {
  url: string;
  alt?: string;
  mediaType?: string; // 'image' | 'video' or any string from database
}

// Core product interface for catalog display
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price?: string;
  priceFrom?: string;
  priceTo?: string;
  image: string;
  category: string;
  categoryId?: string | null;
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  goldType?: string;
  stoneType?: string;
  stoneWeight?: string;
  images: ProductImage[];
  videoUrl?: string;
  mtoStory?: string;
  stockStatus?: StockStatus;
  isDiamondJewelry?: boolean;
}

// Sale product extends Product with sale-specific fields
export interface SaleProduct extends Omit<Product, "price" | "priceFrom" | "priceTo"> {
  originalPrice: string;
  salePrice: string;
  discountPercent: number;
  saleBadge?: string;
}

// Admin product interface with all database fields
export interface AdminProduct {
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
  price_from?: number | null;
  price_to?: number | null;
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
  // Pricing fields
  gold_weight_grams: number | null;
  base_labor_markup: number | null;
  is_diamond_jewelry: boolean;
  is_engagement_ring: boolean;
  is_pearl_jewelry: boolean;
  stock_status: StockStatus;
}

// Product story interface
export interface ProductStory {
  id: string;
  title: string;
  content_body?: string | null;
  category?: string | null;
  is_default?: boolean | null;
}

// Local content overrides for dynamic content
export interface LocalContentOverrides {
  short_description?: string;
  description?: string;
  [key: string]: string | undefined;
}

// Search result interface
export interface ProductSearchResult {
  id: string;
  name: string;
  slug?: string;
  price: number | null;
  main_image_url: string | null;
  category_name: string | null;
  category_id: string | null;
}

// Uploaded image from admin
export interface UploadedProductImage {
  url: string;
  alt_text: string;
  file_name: string;
  isMain?: boolean;
}

// Transform raw database product to display Product
export function transformDbProductToProduct(
  dbProduct: any,
  productImages?: any[],
  defaultImage = "/placeholder.svg"
): Product {
  const images = productImages?.filter(img => img.product_id === dbProduct.id) || [];
  const allImages: ProductImage[] = [];
  
  // Add main image first if exists
  if (dbProduct.main_image_url) {
    allImages.push({ url: dbProduct.main_image_url, alt: dbProduct.name });
  }
  
  // Add additional images
  images.forEach(img => {
    if (img.image_url !== dbProduct.main_image_url) {
      allImages.push({ 
        url: img.image_url, 
        alt: img.alt_text || dbProduct.name,
        mediaType: img.media_type || "image"
      });
    }
  });

  // Format price
  const priceDisplay = dbProduct.price?.toLocaleString('he-IL');

  // Get short description (editable field from admin)
  const shortDesc = dbProduct.short_description?.replace(/\{\{product_name\}\}/g, dbProduct.name);
  
  // Get full description from story or description field
  const fullDesc = (dbProduct.product_stories?.content_body || dbProduct.description)
    ?.replace(/\{\{product_name\}\}/g, dbProduct.name);

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug || dbProduct.id,
    sku: dbProduct.sku || undefined,
    price: priceDisplay,
    priceFrom: dbProduct.price_from?.toLocaleString('he-IL'),
    priceTo: dbProduct.price_to?.toLocaleString('he-IL'),
    image: dbProduct.main_image_url || defaultImage,
    category: dbProduct.categories?.name || "תכשיטים",
    categoryId: dbProduct.category_id,
    description: shortDesc || fullDesc,
    shortDescription: shortDesc,
    fullDescription: fullDesc,
    goldType: dbProduct.gold_type || undefined,
    stoneType: dbProduct.stone_type || undefined,
    stoneWeight: dbProduct.stone_weight || undefined,
    images: allImages.length > 0 
      ? allImages 
      : [{ url: dbProduct.main_image_url || defaultImage, alt: dbProduct.name }],
    videoUrl: dbProduct.video_url || undefined,
    mtoStory: dbProduct.mto_story || undefined,
    stockStatus: dbProduct.stock_status || "made_to_order",
    isDiamondJewelry: dbProduct.is_diamond_jewelry || false,
  };
}

// Transform raw database product to SaleProduct
export function transformDbProductToSaleProduct(
  dbProduct: any,
  productImages?: any[],
  defaultImage = "/placeholder.svg"
): SaleProduct {
  const baseProduct = transformDbProductToProduct(dbProduct, productImages, defaultImage);
  
  const originalPrice = dbProduct.original_price || dbProduct.price || 0;
  const salePrice = dbProduct.sale_price || dbProduct.price || 0;
  const discountPercent = originalPrice > 0 
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  // Remove price fields from base and add sale-specific fields
  const { price, priceFrom, priceTo, ...rest } = baseProduct;

  return {
    ...rest,
    originalPrice: originalPrice.toLocaleString('he-IL'),
    salePrice: salePrice.toLocaleString('he-IL'),
    discountPercent,
    saleBadge: dbProduct.sale_badge_text || "מבצע!",
  };
}
