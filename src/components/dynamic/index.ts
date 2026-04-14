/**
 * Dynamic content block system for CMS pages
 * Renders modular content from the pages.content_blocks JSONB field
 */

export { default as DynamicSection } from "./DynamicSection";

// Types
export type { ContentBlocks, Block } from "./types";
export type {
  HeroBlockData,
  RichTextBlockData,
  ImageWithTextBlockData,
  ProductGridBlockData,
  SpacerBlockData,
  FaqBlockData,
  FaqItem,
  ProductLinksBlockData,
} from "./types";

// Validation
export { 
  validateContentBlocks, 
  contentBlocksSchema,
  blockSchema,
} from "./schemas";
export type { 
  ValidatedContentBlocks, 
  ValidatedBlock 
} from "./schemas";
