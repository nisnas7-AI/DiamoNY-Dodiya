import { memo } from "react";

/**
 * PriceDisplay – Unified price renderer with smart "החל מ" prefix.
 *
 * Conditional logic (in priority order):
 *  1. isDiamondJewelry  → show prefix
 *  2. hasVariants       → show prefix
 *  3. isCustomizable    → show prefix
 *  4. priceFrom/priceTo → show prefix (range implies variability)
 *  5. forcePrefix       → manual override
 *  6. Otherwise         → no prefix
 *
 * The prefix is rendered in a smaller, muted style so the numeric
 * value remains the dominant focal point.
 */

export interface PriceDisplayProps {
  /** Formatted price string, e.g. "12,500" */
  price?: string | null;
  /** Formatted lower bound, e.g. "8,000" */
  priceFrom?: string | null;
  /** Formatted upper bound, e.g. "15,000" */
  priceTo?: string | null;
  /** Numeric price (used when formatted strings aren't available) */
  numericPrice?: number | null;
  /** Whether this is a diamond jewelry product */
  isDiamondJewelry?: boolean;
  /** Whether the product has variants */
  hasVariants?: boolean;
  /** Whether the product is customizable */
  isCustomizable?: boolean;
  /** Force-show the prefix regardless of other flags */
  forcePrefix?: boolean;
  /** Additional className for the wrapper */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color scheme – "accent" (default gold), "light" (white text for dark bgs), "destructive" (sale) */
  colorScheme?: "accent" | "light" | "destructive";
}

const sizeMap = {
  sm: {
    price: "text-sm",
    prefix: "text-[10px]",
  },
  md: {
    price: "text-base md:text-lg",
    prefix: "text-xs",
  },
  lg: {
    price: "text-2xl md:text-3xl",
    prefix: "text-sm md:text-base",
  },
} as const;

const colorMap = {
  accent: {
    price: "text-accent",
    prefix: "text-muted-foreground",
  },
  light: {
    price: "", // caller controls via style prop
    prefix: "text-muted-foreground",
  },
  destructive: {
    price: "text-destructive",
    prefix: "text-muted-foreground",
  },
} as const;

const PriceDisplay = memo(({
  price,
  priceFrom,
  priceTo,
  numericPrice,
  isDiamondJewelry = false,
  hasVariants = false,
  isCustomizable = false,
  forcePrefix = false,
  className = "",
  size = "md",
  colorScheme = "accent",
}: PriceDisplayProps) => {
  // Build display string
  let displayValue: string | null = null;

  if (priceFrom && priceTo) {
    displayValue = `₪${priceFrom} - ₪${priceTo}`;
  } else if (price) {
    displayValue = `₪${price}`;
  } else if (numericPrice != null) {
    displayValue = `₪${numericPrice.toLocaleString("he-IL")}`;
  }

  if (!displayValue) return null;

  // Determine whether to show prefix
  const isRange = !!(priceFrom && priceTo);
  const showPrefix =
    forcePrefix ||
    isDiamondJewelry ||
    hasVariants ||
    isCustomizable ||
    isRange;

  const sizes = sizeMap[size];
  const colors = colorMap[colorScheme];

  return (
    <span
      className={`inline-flex items-baseline gap-1 font-body ${className}`}
      dir="rtl"
    >
      {showPrefix && (
        <span
          className={`${sizes.prefix} ${colors.prefix} font-normal opacity-80 whitespace-nowrap leading-none`}
        >
          החל מ
        </span>
      )}
      <span
        className={`${sizes.price} ${colors.price} font-bold tracking-tight leading-none`}
      >
        {displayValue}
      </span>
    </span>
  );
});

PriceDisplay.displayName = "PriceDisplay";

export default PriceDisplay;
