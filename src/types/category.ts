/**
 * Unified Category Type Definitions
 * Single source of truth for all category-related interfaces
 */

// Base category interface
export interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  mto_story?: string | null;
}

// Category with children for tree structure
export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

// Simplified category for dropdowns/selects
export interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
}

// Homepage category (displayed on homepage)
export interface HomepageCategory {
  id: string;
  name: string;
  name_en?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  category_slug?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
}
