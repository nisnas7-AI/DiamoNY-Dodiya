/* rebuild-trigger-v2 */
import { memo, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Block } from "./types";
import type { ValidatedBlock } from "./schemas";

// Lightweight blocks - imported directly
import SpacerBlock from "./blocks/SpacerBlock";
import HeroBlock from "./blocks/HeroBlock";

// Heavy blocks - lazy loaded for better initial page load
const RichTextBlock = lazy(() => import("./blocks/RichTextBlock"));
const ImageWithTextBlock = lazy(() => import("./blocks/ImageWithTextBlock"));
const ProductGridBlock = lazy(() => import("./blocks/ProductGridBlock"));
const FaqBlock = lazy(() => import("./blocks/FaqBlock"));
const ProductLinksBlock = lazy(() => import("./blocks/ProductLinksBlock"));

interface BlockRendererProps {
  block: Block | ValidatedBlock;
}

/**
 * Loading fallback for lazy-loaded blocks.
 */
const BlockSkeleton = ({ type }: { type: string }) => {
  switch (type) {
    case 'product_grid':
    case 'product_links':
      return (
        <div className="py-12 md:py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-10 w-48 mx-auto mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/5] rounded-2xl" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    
    case 'image_with_text':
      return (
        <div className="py-12 md:py-16 px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-[4/5] rounded-lg" />
            <div className="space-y-4 py-8">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      );
    
    case 'rich_text':
      return (
        <div className="py-12 md:py-16 px-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="py-12 md:py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-3">
            <Skeleton className="h-10 w-48 mx-auto mb-8" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      );
    
    default:
      return <Skeleton className="h-32 w-full" />;
  }
};

/**
 * Maps block types to their corresponding components.
 */
const BlockRenderer = memo(({ block }: BlockRendererProps) => {
  // Lightweight blocks - no Suspense needed
  if (block.type === 'hero') {
    return <HeroBlock data={block.data as any} />;
  }
  
  if (block.type === 'spacer') {
    return <SpacerBlock data={block.data as any} />;
  }

  // Heavy blocks - wrapped in Suspense with skeleton fallbacks
  return (
    <Suspense fallback={<BlockSkeleton type={block.type} />}>
      {block.type === 'rich_text' && <RichTextBlock data={block.data as any} />}
      {block.type === 'image_with_text' && <ImageWithTextBlock data={block.data as any} />}
      {block.type === 'product_grid' && <ProductGridBlock data={block.data as any} />}
      {block.type === 'faq' && <FaqBlock data={block.data as any} />}
      {block.type === 'product_links' && <ProductLinksBlock data={block.data as any} />}
      {!['rich_text', 'image_with_text', 'product_grid', 'hero', 'spacer', 'faq', 'product_links'].includes(block.type) && (
        console.warn(`Unknown block type: ${block.type}`),
        null
      )}
    </Suspense>
  );
});

BlockRenderer.displayName = "BlockRenderer";
export default BlockRenderer;
