/**
 * TypeScript interfaces for DynamicSection content blocks
 * Used by the CMS pages table to render modular page content
 */

export interface BaseBlock {
  id?: string;
  type: string;
  data: Record<string, unknown>;
}

export interface HeroBlockData {
  title: string;
  subtitle?: string;
  background_image?: string;
  cta_text?: string;
  cta_url?: string;
  overlay_opacity?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface RichTextBlockData {
  content: string;
  max_width?: 'narrow' | 'medium' | 'full';
  text_align?: 'left' | 'center' | 'right';
}

export interface ImageWithTextBlockData {
  image_url: string;
  alt_text?: string;
  title?: string;
  content?: string;
  layout?: 'image_left' | 'image_right' | 'overlay';
  cta_text?: string;
  cta_url?: string;
}

export interface ProductGridBlockData {
  title?: string;
  subtitle?: string;
  product_ids?: string[];
  category_slug?: string;
  limit?: number;
  columns?: 2 | 3 | 4;
}

export interface SpacerBlockData {
  height?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqBlockData {
  title?: string;
  items: FaqItem[];
}

export interface ProductLinksBlockData {
  title?: string;
  subtitle?: string;
  product_ids: string[];
}

export type Block =
  | { id?: string; type: 'hero'; data: HeroBlockData }
  | { id?: string; type: 'rich_text'; data: RichTextBlockData }
  | { id?: string; type: 'image_with_text'; data: ImageWithTextBlockData }
  | { id?: string; type: 'product_grid'; data: ProductGridBlockData }
  | { id?: string; type: 'spacer'; data: SpacerBlockData }
  | { id?: string; type: 'faq'; data: FaqBlockData }
  | { id?: string; type: 'product_links'; data: ProductLinksBlockData }
  | BaseBlock;

export interface ContentBlocks {
  blocks: Block[];
}
