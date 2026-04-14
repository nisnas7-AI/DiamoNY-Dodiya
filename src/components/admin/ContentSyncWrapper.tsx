import { useEffect, useRef } from "react";
import ContentSyncSection from "./ContentSyncSection";
import { useProductContent } from "@/hooks/useProductContent";
import { LocalContentOverrides } from "@/lib/contentSync";

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

interface ContentSyncWrapperProps {
  productName: string;
  categoryId: string;
  categories: Category[] | undefined;
  productStories: ProductStory[] | undefined;
  initialStoryId: string;
  initialLocalOverrides?: LocalContentOverrides | null;
  // NEW: Pass existing descriptions from formData
  initialShortDescription?: string;
  initialFullDescription?: string;
  imageUrl?: string;
  productSlug?: string;
  externalUrl: string;
  stockStatus?: 'in_stock' | 'made_to_order' | 'out_of_stock';
  // Product specs for AI generation
  goldType?: string;
  stoneType?: string;
  stoneWeight?: string;
  onFormUpdate: (updates: {
    product_story_id?: string;
    short_description?: string;
    description?: string;
    external_url?: string;
    local_content_overrides?: LocalContentOverrides | null;
  }) => void;
}

/**
 * ContentSyncWrapper integrates useProductContent hook with ContentSyncSection
 * This ensures that template selection properly derives all content fields
 */
const ContentSyncWrapper = ({
  productName,
  categoryId,
  categories,
  productStories,
  initialStoryId,
  initialLocalOverrides,
  initialShortDescription,
  initialFullDescription,
  imageUrl,
  productSlug,
  externalUrl,
  stockStatus,
  goldType,
  stoneType,
  stoneWeight,
  onFormUpdate,
}: ContentSyncWrapperProps) => {
  // Track initial mount to prevent overwriting existing data
  const isInitialMount = useRef(true);
  
  const {
    contentState,
    setTemplateId,
    updateField,
    resetToTemplate,
    getLocalOverrides,
    selectedStory,
    filteredStories,
    categoryMetadata,
    gender,
  } = useProductContent({
    productName: productName || "[שם המוצר]",
    categoryId,
    categories,
    productStories,
    initialStoryId,
    initialLocalOverrides,
    initialShortDescription,
    initialFullDescription,
  });

  // Sync contentState back to formData whenever it changes
  // Skip initial render to prevent overwriting existing product data
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    onFormUpdate({
      product_story_id: contentState.templateId || undefined,
      short_description: contentState.shortDesc,
      description: contentState.fullDesc,
      local_content_overrides: getLocalOverrides(),
    });
  }, [contentState.templateId, contentState.shortDesc, contentState.fullDesc, contentState.isLocallyModified]);

  const handleTemplateChange = (id: string) => {
    if (id === "none") {
      // Clear template - use hook's setTemplateId to reset internal state
      setTemplateId("");
      // Also update form to clear values
      onFormUpdate({
        product_story_id: "",
        short_description: "",
        description: "",
        local_content_overrides: null,
      });
    } else {
      // Use hook's setTemplateId which calls deriveContentFromTemplate
      setTemplateId(id);
    }
  };

  const handleFieldChange = (field: keyof Omit<typeof contentState, "templateId" | "isLocallyModified">, value: string) => {
    updateField(field, value);
  };

  const handleExternalUrlChange = (url: string) => {
    onFormUpdate({ external_url: url });
  };

  return (
    <ContentSyncSection
      contentState={contentState}
      filteredStories={filteredStories}
      allStories={productStories}
      selectedStory={selectedStory}
      productName={productName}
      imageUrl={imageUrl}
      productSlug={productSlug}
      externalUrl={externalUrl}
      stockStatus={stockStatus}
      categoryMetadata={categoryMetadata}
      gender={gender}
      goldType={goldType}
      stoneType={stoneType}
      stoneWeight={stoneWeight}
      onTemplateChange={handleTemplateChange}
      onFieldChange={handleFieldChange}
      onExternalUrlChange={handleExternalUrlChange}
      onResetToTemplate={resetToTemplate}
    />
  );
};

export default ContentSyncWrapper;
