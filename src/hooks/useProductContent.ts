import { useState, useCallback, useEffect } from "react";
import {
  ContentState,
  LocalContentOverrides,
  createInitialContentState,
  deriveContentFromTemplate,
  resolvePlaceholders,
  PLATFORM_LIMITS,
  getCategoryNameById,
  getCategoryMetadata,
  getStoryCategory,
  type HebrewGender,
  type CategoryMetadata,
} from "@/lib/contentSync";

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

interface UseProductContentProps {
  productName: string;
  categoryId: string | null;
  categories: Category[] | undefined;
  productStories: ProductStory[] | undefined;
  initialStoryId?: string;
  initialLocalOverrides?: LocalContentOverrides | null;
  // NEW: Allow passing existing descriptions from the product
  initialShortDescription?: string;
  initialFullDescription?: string;
}

interface UseProductContentReturn {
  contentState: ContentState;
  setTemplateId: (id: string) => void;
  updateField: (field: keyof Omit<ContentState, "templateId" | "isLocallyModified">, value: string) => void;
  resetToTemplate: () => void;
  syncFromTemplate: (templateId: string) => void;
  getLocalOverrides: () => LocalContentOverrides | null;
  selectedStory: ProductStory | undefined;
  filteredStories: ProductStory[];
  categoryName: string;
  categoryMetadata: CategoryMetadata;
  gender: HebrewGender;
}

export const useProductContent = ({
  productName,
  categoryId,
  categories,
  productStories,
  initialStoryId,
  initialLocalOverrides,
  initialShortDescription,
  initialFullDescription,
}: UseProductContentProps): UseProductContentReturn => {
  const [contentState, setContentState] = useState<ContentState>(() => {
    // Priority 1: Local overrides (saved customizations)
    if (initialLocalOverrides) {
      return {
        templateId: initialStoryId || "",
        shortDesc: initialLocalOverrides.shortDesc || "",
        fullDesc: initialLocalOverrides.fullDesc || "",
        marketingCopy: initialLocalOverrides.marketingCopy || "",
        isLocallyModified: true,
      };
    }
    
    // Priority 2: Existing product descriptions (from DB fields)
    if (initialShortDescription || initialFullDescription) {
      return {
        templateId: initialStoryId || "",
        shortDesc: initialShortDescription || "",
        fullDesc: initialFullDescription || "",
        marketingCopy: "",
        isLocallyModified: true, // Mark as modified to preserve custom content
      };
    }
    
    // Priority 3: Empty state (new product)
    return {
      ...createInitialContentState(),
      templateId: initialStoryId || "",
    };
  });

  // Get category name and metadata from ID
  const categoryName = getCategoryNameById(categoryId, categories);
  const categoryMetadata = getCategoryMetadata(categoryName);
  const gender = categoryMetadata.gender;
  
  // Use centralized story category from metadata
  const storyCategory = getStoryCategory(categoryName);

  // Filter stories by category
  const filteredStories = productStories?.filter((story) => {
    if (!storyCategory) return true;
    return story.category === storyCategory || story.category === "general";
  }) || [];

  // Get selected story
  const selectedStory = productStories?.find((s) => s.id === contentState.templateId);

  // Set template ID and derive content
  const setTemplateId = useCallback((id: string) => {
    // Handle empty/none case - fully reset state
    if (!id || id === "none") {
      setContentState({
        templateId: "",
        shortDesc: "",
        fullDesc: "",
        marketingCopy: "",
        isLocallyModified: false,
      });
      return;
    }
    
    const story = productStories?.find((s) => s.id === id);
    if (story?.content_body) {
      const derived = deriveContentFromTemplate(
        story.content_body,
        productName,
        categoryName
      );
      setContentState({
        templateId: id,
        ...derived,
        isLocallyModified: false,
      });
    } else {
      setContentState((prev) => ({ ...prev, templateId: id }));
    }
  }, [productStories, productName, categoryName]);

  // Update a single field and mark as locally modified
  const updateField = useCallback(
    (field: keyof Omit<ContentState, "templateId" | "isLocallyModified">, value: string) => {
      setContentState((prev) => ({
        ...prev,
        [field]: value,
        isLocallyModified: true,
      }));
    },
    []
  );

  // Reset all fields to template defaults
  const resetToTemplate = useCallback(() => {
    const story = productStories?.find((s) => s.id === contentState.templateId);
    if (story?.content_body) {
      const derived = deriveContentFromTemplate(
        story.content_body,
        productName,
        categoryName
      );
      setContentState({
        templateId: contentState.templateId,
        ...derived,
        isLocallyModified: false,
      });
    } else {
      setContentState({
        ...createInitialContentState(),
        templateId: contentState.templateId,
      });
    }
  }, [productStories, productName, categoryName, contentState.templateId]);

  // Sync content from a specific template (manual trigger)
  const syncFromTemplate = useCallback((templateId: string) => {
    const story = productStories?.find((s) => s.id === templateId);
    if (story?.content_body) {
      const derived = deriveContentFromTemplate(
        story.content_body,
        productName,
        categoryName
      );
      setContentState({
        templateId,
        ...derived,
        isLocallyModified: false,
      });
    }
  }, [productStories, productName, categoryName]);

  // Get local overrides for saving
  const getLocalOverrides = useCallback((): LocalContentOverrides | null => {
    if (!contentState.isLocallyModified) return null;
    return {
      shortDesc: contentState.shortDesc,
      fullDesc: contentState.fullDesc,
      marketingCopy: contentState.marketingCopy,
    };
  }, [contentState]);


  return {
    contentState,
    setTemplateId,
    updateField,
    resetToTemplate,
    syncFromTemplate,
    getLocalOverrides,
    selectedStory,
    filteredStories,
    categoryName,
    categoryMetadata,
    gender,
  };
};

export default useProductContent;
