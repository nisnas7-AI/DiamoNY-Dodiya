import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBrandId } from '@/lib/brandId';

interface Category {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  is_hidden: boolean;
  is_updating_soon: boolean;
  created_at: string;
  updated_at: string;
  mto_story: string | null;
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Fetch all active categories ordered by display_order
        const { data, error: supabaseError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (supabaseError) throw supabaseError;

        setCategories(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Transform flat list to hierarchical tree structure (excluding hidden)
  const categoryTree = useMemo((): CategoryWithChildren[] => {
    const visibleCategories = categories.filter(c => !c.is_hidden);
    if (!visibleCategories.length) return [];

    const map: Record<string, CategoryWithChildren> = {};
    const tree: CategoryWithChildren[] = [];

    visibleCategories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });

    visibleCategories.forEach(cat => {
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat.parent_id].children.push(map[cat.id]);
      } else if (!cat.parent_id) {
        tree.push(map[cat.id]);
      }
    });

    return tree;
  }, [categories]);

  // Get flat list of all categories
  const flatCategories = categories;

  // Find a category by slug
  const getCategoryBySlug = (slug: string): Category | undefined => {
    return categories.find(cat => cat.slug === slug);
  };

  // Get parent categories only (excluding hidden)
  const parentCategories = useMemo(() => {
    return categories.filter(cat => !cat.parent_id && !cat.is_hidden);
  }, [categories]);

  // Get children of a specific category (excluding hidden)
  const getChildrenOf = (parentId: string): Category[] => {
    return categories.filter(cat => cat.parent_id === parentId && !cat.is_hidden);
  };

  // Get all descendant IDs recursively (including the category itself)
  const getAllDescendantIds = (categoryId: string): string[] => {
    const ids = [categoryId];
    const children = categories.filter(c => c.parent_id === categoryId);
    children.forEach(child => {
      ids.push(...getAllDescendantIds(child.id));
    });
    return ids;
  };

  // Get parent category of a given category
  const getParentCategory = (categoryId: string): Category | undefined => {
    const category = categories.find(c => c.id === categoryId);
    if (category?.parent_id) {
      return categories.find(c => c.id === category.parent_id);
    }
    return undefined;
  };

  // Check if a category is a descendant of another
  const isDescendantOf = (childSlug: string, parentSlug: string): boolean => {
    const child = categories.find(c => c.slug === childSlug);
    const parent = categories.find(c => c.slug === parentSlug);
    if (!child || !parent) return false;
    
    let current = child;
    while (current) {
      if (current.parent_id === parent.id) return true;
      const parentCat = categories.find(c => c.id === current.parent_id);
      if (!parentCat) break;
      current = parentCat;
    }
    return false;
  };

  // Check if category is active (selected or is parent of selected)
  const isActiveCategory = (categorySlug: string, selectedSlug: string | null): boolean => {
    if (!selectedSlug) return false;
    if (categorySlug === selectedSlug) return true;
    return isDescendantOf(selectedSlug, categorySlug);
  };

  // Check if a category is hidden
  const isCategoryHidden = (slug: string): boolean => {
    const cat = categories.find(c => c.slug === slug);
    return cat?.is_hidden === true;
  };

  // Get IDs of all hidden categories (for product filtering)
  const hiddenCategoryIds = useMemo(() => {
    return categories.filter(c => c.is_hidden).map(c => c.id);
  }, [categories]);

  return { 
    categoryTree, 
    flatCategories,
    parentCategories,
    loading, 
    error,
    getCategoryBySlug,
    getChildrenOf,
    getAllDescendantIds,
    getParentCategory,
    isDescendantOf,
    isActiveCategory,
    isCategoryHidden,
    hiddenCategoryIds
  };
};
