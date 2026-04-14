/**
 * Smart Autofill Engine - Parse filenames for product specs
 * Supports patterns like: RING-102_18k_05ct.jpg
 */

export type GoldType = 'yellow' | 'white' | 'rose' | 'platinum';

export const GOLD_TYPE_LABELS: Record<GoldType, string> = {
  yellow: 'זהב צהוב',
  white: 'זהב לבן',
  rose: 'זהב רוז',
  platinum: 'פלטינה',
};

export const GOLD_TYPE_COLORS: Record<GoldType, string> = {
  yellow: '#E6BE8A',
  white: '#E5E4E2',
  rose: '#B76E79',
  platinum: '#E5E4E2',
};

interface ParsedSpecs {
  sku: string | null;
  goldType: GoldType | null;
  caratWeight: string | null;
  goldKarat: string | null;
}

/**
 * Parse filename to extract product specifications
 * Supports formats:
 * - RING-102_18k_05ct.jpg -> SKU: RING-102, Gold: 18k, Carat: 0.5ct
 * - BR456_rose_1ct.jpg -> SKU: BR456, Gold: Rose, Carat: 1ct
 * - earring-diamond-14k-025ct.jpg -> Gold: 14k, Carat: 0.25ct
 */
export const parseFilenameForSpecs = (filename: string): ParsedSpecs => {
  // Remove extension and convert to lowercase
  const name = filename.replace(/\.[^/.]+$/, '').toLowerCase();
  
  const result: ParsedSpecs = {
    sku: null,
    goldType: null,
    caratWeight: null,
    goldKarat: null,
  };

  // Extract SKU patterns
  // Pattern 1: PREFIX-123 or PREFIX_123 at the start
  const skuMatch = name.match(/^([a-z]{1,5}[-_]?\d{2,4})/i);
  if (skuMatch) {
    result.sku = skuMatch[1].toUpperCase().replace('_', '-');
  }

  // Extract Gold Type
  // Pattern: 14k, 18k, 22k, 24k
  const karatMatch = name.match(/\b(\d{2})k\b/);
  if (karatMatch) {
    result.goldKarat = karatMatch[1] + 'k';
  }

  // Pattern: yellow, white, rose, platinum, yg, wg, rg
  const goldPatterns: Record<string, GoldType> = {
    'yellow': 'yellow',
    'yg': 'yellow',
    'white': 'white',
    'wg': 'white',
    'rose': 'rose',
    'rg': 'rose',
    'pink': 'rose',
    'platinum': 'platinum',
    'pt': 'platinum',
    'plat': 'platinum',
  };

  for (const [pattern, type] of Object.entries(goldPatterns)) {
    if (name.includes(pattern)) {
      result.goldType = type;
      break;
    }
  }

  // Extract Carat Weight
  // Patterns: 05ct, 0.5ct, 1ct, 1.5ct, 050ct
  const caratPatterns = [
    /(\d+\.?\d*)ct\b/,           // 0.5ct, 1ct, 1.5ct
    /(\d{2,3})ct\b/,             // 050ct, 100ct (will be converted)
    /[-_](\d{2})ct[-_]/,         // -05ct-
  ];

  for (const pattern of caratPatterns) {
    const caratMatch = name.match(pattern);
    if (caratMatch) {
      let value = caratMatch[1];
      // Convert 05 or 050 format to 0.5 or 0.50
      if (!value.includes('.') && value.length >= 2) {
        if (value.length === 2 && parseInt(value) < 10) {
          value = '0.' + value;
        } else if (value.length === 3) {
          value = value.slice(0, -2) + '.' + value.slice(-2);
        }
      }
      result.caratWeight = parseFloat(value).toString();
      break;
    }
  }

  return result;
};

/**
 * Format carat weight for display
 */
export const formatCaratWeight = (carat: string | null): string => {
  if (!carat) return '';
  const num = parseFloat(carat);
  if (isNaN(num)) return carat;
  return num.toFixed(2) + ' ct';
};

/**
 * Get gold type from Hebrew label
 */
export const getGoldTypeFromLabel = (label: string): GoldType | null => {
  const labelMap: Record<string, GoldType> = {
    'זהב צהוב': 'yellow',
    'זהב לבן': 'white',
    'זהב רוז': 'rose',
    'פלטינה': 'platinum',
    'yellow gold': 'yellow',
    'white gold': 'white',
    'rose gold': 'rose',
    'platinum': 'platinum',
  };
  
  return labelMap[label.toLowerCase()] || null;
};
