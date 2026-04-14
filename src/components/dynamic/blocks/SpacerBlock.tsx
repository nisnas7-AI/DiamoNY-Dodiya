import { memo } from "react";
import type { SpacerBlockData } from "../types";

interface SpacerBlockProps {
  data: SpacerBlockData;
}

/**
 * Visual spacer between sections.
 * Provides consistent vertical rhythm throughout the page.
 */
const SpacerBlock = memo(({ data }: SpacerBlockProps) => {
  const { height = 'md' } = data;

  const heightClasses: Record<string, string> = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
    xl: 'py-16',
  };

  return (
    <div
      className={heightClasses[height] || heightClasses.md}
      aria-hidden="true"
    />
  );
});

SpacerBlock.displayName = "SpacerBlock";
export default SpacerBlock;
