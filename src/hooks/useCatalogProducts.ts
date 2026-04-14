import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { type Product, transformDbProductToProduct } from "@/types";

type StockStatus = Database["public"]["Enums"]["stock_status"];

const ITEMS_PER_PAGE = 12;

interface UseCatalogProductsOptions {
  categoryIdsToFilter: string[] | null;
  engagementFilter: boolean;
  isPearlCollection: boolean;
  hiddenCategoryIds: string[];
  stockFilter: string[];
  metalFilter: string[];
  page: number;
  categoriesLoading: boolean;
}

interface CatalogProductsResult {
  products: Product[];
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
}

export const useCatalogProducts = ({
  categoryIdsToFilter,
  engagementFilter,
  isPearlCollection,
  hiddenCategoryIds,
  stockFilter,
  metalFilter,
  page,
  categoriesLoading,
}: UseCatalogProductsOptions): CatalogProductsResult => {
  // H-2 fix: Server-side pagination with .range()
  const { data, isLoading } = useQuery({
    queryKey: [
      "catalog-products",
      categoryIdsToFilter,
      engagementFilter,
      isPearlCollection,
      hiddenCategoryIds,
      stockFilter,
      metalFilter,
      page,
    ],
    queryFn: async () => {
      // --- Step 1: Count query (lightweight) ---
      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (categoryIdsToFilter && categoryIdsToFilter.length > 0) {
        countQuery = countQuery.in("category_id", categoryIdsToFilter);
      }
      if (engagementFilter) countQuery = countQuery.eq("is_engagement_ring", true);
      if (isPearlCollection) countQuery = countQuery.eq("is_pearl_jewelry", true);
      if (hiddenCategoryIds.length > 0) {
        countQuery = countQuery.not("category_id", "in", `(${hiddenCategoryIds.join(",")})`);
      }
      // Server-side stock filter
      if (stockFilter.length > 0) {
        countQuery = countQuery.in("stock_status", stockFilter as StockStatus[]);
      }
      // Server-side metal filter
      if (metalFilter.length > 0) {
        const metalConditions = metalFilter.map(m => `gold_type.ilike.%${m}%`).join(",");
        countQuery = countQuery.or(metalConditions);
      }

      const { count } = await countQuery;
      const totalCount = count ?? 0;

      // --- Step 2: Paginated data query ---
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let dataQuery = supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          sku,
          price,
          price_from,
          price_to,
          main_image_url,
          video_url,
          description,
          short_description,
          gold_type,
          stone_type,
          stone_weight,
          category_id,
          mto_story,
          stock_status,
          is_diamond_jewelry,
          is_engagement_ring,
          is_pearl_jewelry,
          product_story_id,
          categories(id, name),
          product_stories(id, title, content_body),
          product_images(id, image_url, alt_text, display_order, media_type, product_id)
        `)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .range(from, to);

      if (categoryIdsToFilter && categoryIdsToFilter.length > 0) {
        dataQuery = dataQuery.in("category_id", categoryIdsToFilter);
      }
      if (engagementFilter) dataQuery = dataQuery.eq("is_engagement_ring", true);
      if (isPearlCollection) dataQuery = dataQuery.eq("is_pearl_jewelry", true);
      if (hiddenCategoryIds.length > 0) {
        dataQuery = dataQuery.not("category_id", "in", `(${hiddenCategoryIds.join(",")})`);
      }
      if (stockFilter.length > 0) {
        dataQuery = dataQuery.in("stock_status", stockFilter as StockStatus[]);
      }
      if (metalFilter.length > 0) {
        const metalConditions = metalFilter.map(m => `gold_type.ilike.%${m}%`).join(",");
        dataQuery = dataQuery.or(metalConditions);
      }

      const { data: rows, error } = await dataQuery;
      if (error) throw error;

      const products: Product[] = (rows || []).map((p: any) => {
        const inlineImages = p.product_images || [];
        return transformDbProductToProduct(p, inlineImages);
      });

      return { products, totalCount };
    },
    enabled: !categoriesLoading,
  });

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    products: data?.products ?? [],
    totalCount,
    totalPages,
    isLoading,
  };
};

export { ITEMS_PER_PAGE };
