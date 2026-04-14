/**
 * Centralized Type Exports
 * Re-exports all shared types for convenient imports
 */

// Product types
export type {
  ProductImage,
  Product,
  SaleProduct,
  AdminProduct,
  ProductStory,
  LocalContentOverrides,
  ProductSearchResult,
  UploadedProductImage,
  StockStatus,
} from "./product";

export {
  transformDbProductToProduct,
  transformDbProductToSaleProduct,
} from "./product";

// Category types
export type {
  Category,
  CategoryWithChildren,
  CategoryOption,
  HomepageCategory,
} from "./category";
