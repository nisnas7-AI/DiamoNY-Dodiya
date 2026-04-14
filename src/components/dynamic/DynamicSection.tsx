/* rebuild-trigger-v2 */
import { memo, useMemo } from "react";
import BlockRenderer from "./BlockRenderer";
import BlockErrorBoundary from "./BlockErrorBoundary";
import { validateContentBlocks } from "./schemas";
import type { ContentBlocks } from "./types";

interface DynamicSectionProps {
  blocks: ContentBlocks | unknown | null;
  className?: string;
  onValidationError?: (errors: unknown) => void;
}

/**
 * Main orchestrator component for rendering modular page content.
 * Iterates through content_blocks from the pages table and renders
 * each block using the appropriate component.
 *
 * Features:
 * - Zod validation of JSON structure at runtime
 * - Graceful handling of empty or malformed JSON
 * - Error boundary per block to prevent cascade failures
 * - Memoized for optimal performance with complex JSON structures
 */
const DynamicSection = memo(({ 
  blocks, 
  className = "",
  onValidationError 
}: DynamicSectionProps) => {
  // Validate and memoize the content blocks
  const validatedBlocks = useMemo(() => {
    if (!blocks) return null;
    
    const result = validateContentBlocks(blocks);
    
    if (!result.success) {
      onValidationError?.(result.errors);
      return null;
    }
    
    return result.data;
  }, [blocks, onValidationError]);

  if (!validatedBlocks || validatedBlocks.blocks.length === 0) {
    return null;
  }

  return (
    <div className={`dynamic-section ${className}`}>
      {validatedBlocks.blocks.map((block, index) => {
        const isLast = index === validatedBlocks.blocks.length - 1;
        const spacing = block.type === 'spacer'
          ? ''
          : isLast
            ? 'py-8 md:py-12 pb-4 md:pb-6'
            : 'py-8 md:py-12';

        return (
          <section
            key={block.id || `block-${index}`}
            aria-label={block.type === 'hero' ? 'hero' : undefined}
            className={spacing}
          >
            <BlockErrorBoundary
              fallbackMessage="אירעה שגיאה בטעינת הבלוק"
            >
              <BlockRenderer block={block} />
            </BlockErrorBoundary>
          </section>
        );
      })}
    </div>
  );
});

DynamicSection.displayName = "DynamicSection";
export default DynamicSection;

// Re-export types for convenience
export type { ContentBlocks } from "./types";
