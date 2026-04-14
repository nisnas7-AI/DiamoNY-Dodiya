/**
 * Dynamic Content Synchronization System
 * Handles placeholder resolution with Hebrew gender-aware grammar
 */

// Gender types for Hebrew grammar
export type HebrewGender = "masculine" | "feminine";

// Category metadata with gender information
export interface CategoryMetadata {
  name: string;
  singular: string;
  plural: string;
  gender: HebrewGender;
  storyCategory: string;
}

// Full category metadata map
export const CATEGORY_METADATA: Record<string, CategoryMetadata> = {
  // Main categories
  "טבעות": {
    name: "טבעות",
    singular: "טבעת",
    plural: "טבעות",
    gender: "feminine",
    storyCategory: "rings",
  },
  "עגילים": {
    name: "עגילים",
    singular: "עגילים",
    plural: "עגילים",
    gender: "masculine",
    storyCategory: "earrings",
  },
  "צמידים": {
    name: "צמידים",
    singular: "צמיד",
    plural: "צמידים",
    gender: "masculine",
    storyCategory: "bracelets",
  },
  "תליונים": {
    name: "תליונים",
    singular: "תליון",
    plural: "תליונים",
    gender: "masculine",
    storyCategory: "pendants",
  },
  "שרשראות": {
    name: "שרשראות",
    singular: "שרשרת",
    plural: "שרשראות",
    gender: "feminine",
    storyCategory: "necklaces",
  },
  "סטים": {
    name: "סטים",
    singular: "סט תכשיטים",
    plural: "סטים",
    gender: "masculine",
    storyCategory: "sets",
  },
  // Sub-categories
  "טבעת סוליטר": {
    name: "טבעת סוליטר",
    singular: "טבעת סוליטר",
    plural: "טבעות סוליטר",
    gender: "feminine",
    storyCategory: "rings",
  },
  "טבעת אירוסין": {
    name: "טבעת אירוסין",
    singular: "טבעת אירוסין",
    plural: "טבעות אירוסין",
    gender: "feminine",
    storyCategory: "rings",
  },
  "טבעת נישואין": {
    name: "טבעת נישואין",
    singular: "טבעת נישואין",
    plural: "טבעות נישואין",
    gender: "feminine",
    storyCategory: "rings",
  },
  "עגילי יהלומים": {
    name: "עגילי יהלומים",
    singular: "עגילי יהלומים",
    plural: "עגילי יהלומים",
    gender: "masculine",
    storyCategory: "earrings",
  },
  "עגילים צמודים": {
    name: "עגילים צמודים",
    singular: "עגילים צמודים",
    plural: "עגילים צמודים",
    gender: "masculine",
    storyCategory: "earrings",
  },
  "עגילים תלויים": {
    name: "עגילים תלויים",
    singular: "עגילים תלויים",
    plural: "עגילים תלויים",
    gender: "masculine",
    storyCategory: "earrings",
  },
  "צמיד טניס": {
    name: "צמיד טניס",
    singular: "צמיד טניס",
    plural: "צמידי טניס",
    gender: "masculine",
    storyCategory: "bracelets",
  },
  "תליון יהלום": {
    name: "תליון יהלום",
    singular: "תליון יהלום",
    plural: "תליוני יהלום",
    gender: "masculine",
    storyCategory: "pendants",
  },
  // English fallbacks
  "rings": {
    name: "טבעות",
    singular: "טבעת",
    plural: "טבעות",
    gender: "feminine",
    storyCategory: "rings",
  },
  "earrings": {
    name: "עגילים",
    singular: "עגילים",
    plural: "עגילים",
    gender: "masculine",
    storyCategory: "earrings",
  },
  "bracelets": {
    name: "צמידים",
    singular: "צמיד",
    plural: "צמידים",
    gender: "masculine",
    storyCategory: "bracelets",
  },
  "pendants": {
    name: "תליונים",
    singular: "תליון",
    plural: "תליונים",
    gender: "masculine",
    storyCategory: "pendants",
  },
  "necklaces": {
    name: "שרשראות",
    singular: "שרשרת",
    plural: "שרשראות",
    gender: "feminine",
    storyCategory: "necklaces",
  },
};

// Default category when not found
const DEFAULT_CATEGORY: CategoryMetadata = {
  name: "תכשיט",
  singular: "תכשיט",
  plural: "תכשיטים",
  gender: "masculine",
  storyCategory: "general",
};

// Hebrew verb conjugations based on gender
export interface GrammarForms {
  // Demonstratives (this)
  this_m: string;  // הזה
  this_f: string;  // הזאת
  // Past tense verbs
  was_designed_m: string;  // עוצב
  was_designed_f: string;  // עוצבה
  was_created_m: string;   // נוצר
  was_created_f: string;   // נוצרה
  was_made_m: string;      // הוכן
  was_made_f: string;      // הוכנה
  // Present tense verbs
  is_m: string;       // הוא
  is_f: string;       // היא
  combines_m: string; // משלב
  combines_f: string; // משלבת
  carries_m: string;  // נושא
  carries_f: string;  // נושאת
  // Adjectives
  perfect_m: string;     // מושלם
  perfect_f: string;     // מושלמת
  unique_m: string;      // ייחודי
  unique_f: string;      // ייחודית
  beautiful_m: string;   // יפה
  beautiful_f: string;   // יפה
  stunning_m: string;    // מרהיב
  stunning_f: string;    // מרהיבה
  elegant_m: string;     // אלגנטי
  elegant_f: string;     // אלגנטית
  luxurious_m: string;   // יוקרתי
  luxurious_f: string;   // יוקרתית
  handcrafted_m: string; // עבודת יד
  handcrafted_f: string; // עבודת יד
  special_m: string;     // מיוחד
  special_f: string;     // מיוחדת
}

const GRAMMAR_FORMS: GrammarForms = {
  // Demonstratives
  this_m: "הזה",
  this_f: "הזאת",
  // Past tense
  was_designed_m: "עוצב",
  was_designed_f: "עוצבה",
  was_created_m: "נוצר",
  was_created_f: "נוצרה",
  was_made_m: "הוכן",
  was_made_f: "הוכנה",
  // Present tense
  is_m: "הוא",
  is_f: "היא",
  combines_m: "משלב",
  combines_f: "משלבת",
  carries_m: "נושא",
  carries_f: "נושאת",
  // Adjectives
  perfect_m: "מושלם",
  perfect_f: "מושלמת",
  unique_m: "ייחודי",
  unique_f: "ייחודית",
  beautiful_m: "יפה",
  beautiful_f: "יפה",
  stunning_m: "מרהיב",
  stunning_f: "מרהיבה",
  elegant_m: "אלגנטי",
  elegant_f: "אלגנטית",
  luxurious_m: "יוקרתי",
  luxurious_f: "יוקרתית",
  handcrafted_m: "עבודת יד",
  handcrafted_f: "עבודת יד",
  special_m: "מיוחד",
  special_f: "מיוחדת",
};

/**
 * Get category metadata by category name
 */
export const getCategoryMetadata = (categoryName: string): CategoryMetadata => {
  return CATEGORY_METADATA[categoryName] || DEFAULT_CATEGORY;
};

/**
 * Get the story category key for filtering stories
 */
export const getStoryCategory = (categoryName: string): string => {
  const metadata = getCategoryMetadata(categoryName);
  return metadata.storyCategory;
};

/**
 * Resolve grammar-aware placeholders in template content
 * Supports placeholders like:
 * - {{product_name}} - Product name
 * - {{product_type}} / [Product_Type] - Singular category name
 * - {{this}} - הזה/הזאת based on gender
 * - {{was_designed}} - עוצב/עוצבה
 * - {{was_created}} - נוצר/נוצרה
 * - {{is}} - הוא/היא
 * - {{adj_perfect}} - מושלם/מושלמת
 * - {{adj_unique}} - ייחודי/ייחודית
 * - {{adj_stunning}} - מרהיב/מרהיבה
 * - {{adj_elegant}} - אלגנטי/אלגנטית
 * - {{adj_luxurious}} - יוקרתי/יוקרתית
 * - {{adj_special}} - מיוחד/מיוחדת
 * - {{combines}} - משלב/משלבת
 * - {{carries}} - נושא/נושאת
 */
export const resolvePlaceholders = (
  template: string,
  productName: string,
  categoryName: string
): string => {
  if (!template) return "";
  
  const metadata = getCategoryMetadata(categoryName);
  const gender = metadata.gender;
  const isFeminine = gender === "feminine";
  
  // Build replacement map based on gender
  const replacements: Record<string, string> = {
    // Product info
    "{{product_name}}": productName || "[שם המוצר]",
    "{{product_type}}": metadata.singular,
    "[Product_Type]": metadata.singular,
    "[product_type]": metadata.singular,
    
    // Demonstratives
    "{{this}}": isFeminine ? GRAMMAR_FORMS.this_f : GRAMMAR_FORMS.this_m,
    "הזה/הזאת": isFeminine ? GRAMMAR_FORMS.this_f : GRAMMAR_FORMS.this_m,
    "הזה/זאת": isFeminine ? "הזאת" : "הזה",
    
    // Past tense verbs
    "{{was_designed}}": isFeminine ? GRAMMAR_FORMS.was_designed_f : GRAMMAR_FORMS.was_designed_m,
    "עוצב/ה": isFeminine ? GRAMMAR_FORMS.was_designed_f : GRAMMAR_FORMS.was_designed_m,
    "עוצב/עוצבה": isFeminine ? GRAMMAR_FORMS.was_designed_f : GRAMMAR_FORMS.was_designed_m,
    
    "{{was_created}}": isFeminine ? GRAMMAR_FORMS.was_created_f : GRAMMAR_FORMS.was_created_m,
    "נוצר/ה": isFeminine ? GRAMMAR_FORMS.was_created_f : GRAMMAR_FORMS.was_created_m,
    "נוצר/נוצרה": isFeminine ? GRAMMAR_FORMS.was_created_f : GRAMMAR_FORMS.was_created_m,
    
    "{{was_made}}": isFeminine ? GRAMMAR_FORMS.was_made_f : GRAMMAR_FORMS.was_made_m,
    
    // Present tense
    "{{is}}": isFeminine ? GRAMMAR_FORMS.is_f : GRAMMAR_FORMS.is_m,
    "הוא/היא": isFeminine ? GRAMMAR_FORMS.is_f : GRAMMAR_FORMS.is_m,
    
    "{{combines}}": isFeminine ? GRAMMAR_FORMS.combines_f : GRAMMAR_FORMS.combines_m,
    "משלב/ת": isFeminine ? GRAMMAR_FORMS.combines_f : GRAMMAR_FORMS.combines_m,
    
    "{{carries}}": isFeminine ? GRAMMAR_FORMS.carries_f : GRAMMAR_FORMS.carries_m,
    "נושא/ת": isFeminine ? GRAMMAR_FORMS.carries_f : GRAMMAR_FORMS.carries_m,
    
    // Adjectives
    "{{adj_perfect}}": isFeminine ? GRAMMAR_FORMS.perfect_f : GRAMMAR_FORMS.perfect_m,
    "מושלם/ת": isFeminine ? GRAMMAR_FORMS.perfect_f : GRAMMAR_FORMS.perfect_m,
    "מושלם/מושלמת": isFeminine ? GRAMMAR_FORMS.perfect_f : GRAMMAR_FORMS.perfect_m,
    
    "{{adj_unique}}": isFeminine ? GRAMMAR_FORMS.unique_f : GRAMMAR_FORMS.unique_m,
    "ייחודי/ת": isFeminine ? GRAMMAR_FORMS.unique_f : GRAMMAR_FORMS.unique_m,
    
    "{{adj_stunning}}": isFeminine ? GRAMMAR_FORMS.stunning_f : GRAMMAR_FORMS.stunning_m,
    "מרהיב/ה": isFeminine ? GRAMMAR_FORMS.stunning_f : GRAMMAR_FORMS.stunning_m,
    
    "{{adj_elegant}}": isFeminine ? GRAMMAR_FORMS.elegant_f : GRAMMAR_FORMS.elegant_m,
    "אלגנטי/ת": isFeminine ? GRAMMAR_FORMS.elegant_f : GRAMMAR_FORMS.elegant_m,
    
    "{{adj_luxurious}}": isFeminine ? GRAMMAR_FORMS.luxurious_f : GRAMMAR_FORMS.luxurious_m,
    "יוקרתי/ת": isFeminine ? GRAMMAR_FORMS.luxurious_f : GRAMMAR_FORMS.luxurious_m,
    
    "{{adj_special}}": isFeminine ? GRAMMAR_FORMS.special_f : GRAMMAR_FORMS.special_m,
    "מיוחד/ת": isFeminine ? GRAMMAR_FORMS.special_f : GRAMMAR_FORMS.special_m,
  };
  
  // Apply all replacements (case-insensitive for placeholders)
  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    const regex = new RegExp(escapeRegExp(placeholder), "gi");
    result = result.replace(regex, value);
  }
  
  return result;
};

/**
 * Escape special regex characters
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Legacy PRODUCT_TYPE_MAP for backward compatibility
export const PRODUCT_TYPE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_METADATA).map(([key, meta]) => [key, meta.singular])
);

// Platform character limits
export const PLATFORM_LIMITS = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  shortDesc: 120,
  fullDesc: 500,
};

/**
 * Truncate text to a maximum length, ending at a sentence boundary
 */
export const truncateToSentence = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastQuestion = truncated.lastIndexOf("?");
  const lastExclamation = truncated.lastIndexOf("!");
  
  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
  
  if (lastSentenceEnd > maxLength * 0.5) {
    return text.substring(0, lastSentenceEnd + 1);
  }
  
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
};

/**
 * Truncate text to first paragraph or max length
 */
export const truncateToParagraph = (text: string, maxLength: number): string => {
  if (!text) return "";
  
  const paragraphs = text.split(/\n\n+/);
  const firstParagraph = paragraphs[0] || text;
  
  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }
  
  return truncateToSentence(firstParagraph, maxLength);
};

/**
 * Add marketing tone with emojis
 */
export const addMarketingTone = (text: string): string => {
  if (!text) return "";
  
  const cleaned = text.trim();
  const emojis = ["💎", "✨", "👑", "💍", "🌟", "💫", "🔥", "❤️"];
  const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
  
  return `${randomEmoji()} ${cleaned}`;
};

/**
 * Content state interface for unified management
 */
export interface ContentState {
  templateId: string;
  shortDesc: string;
  fullDesc: string;
  marketingCopy: string;
  isLocallyModified: boolean;
}

/**
 * Local content overrides interface (stored in DB)
 */
export interface LocalContentOverrides {
  shortDesc?: string;
  fullDesc?: string;
  marketingCopy?: string;
}

/**
 * Initialize content state from defaults
 */
export const createInitialContentState = (): ContentState => ({
  templateId: "",
  shortDesc: "",
  fullDesc: "",
  marketingCopy: "",
  isLocallyModified: false,
});

/**
 * Derive all content fields from a template
 */
export const deriveContentFromTemplate = (
  templateContent: string,
  productName: string,
  categoryName: string
): Omit<ContentState, "templateId" | "isLocallyModified"> => {
  const resolved = resolvePlaceholders(templateContent, productName, categoryName);
  
  return {
    shortDesc: truncateToSentence(resolved, PLATFORM_LIMITS.shortDesc),
    fullDesc: truncateToParagraph(resolved, PLATFORM_LIMITS.fullDesc),
    marketingCopy: addMarketingTone(truncateToParagraph(resolved, 300)),
  };
};

/**
 * Check if content exceeds platform limit
 */
export const checkPlatformLimit = (
  text: string,
  platform: keyof typeof PLATFORM_LIMITS
): { isOver: boolean; remaining: number; percentage: number } => {
  const limit = PLATFORM_LIMITS[platform];
  const length = text?.length || 0;
  
  return {
    isOver: length > limit,
    remaining: limit - length,
    percentage: Math.min((length / limit) * 100, 100),
  };
};

/**
 * Get category name from category ID
 */
export const getCategoryNameById = (
  categoryId: string | null,
  categories: Array<{ id: string; name: string }> | undefined
): string => {
  if (!categoryId || !categories) return "תכשיט";
  const category = categories.find((c) => c.id === categoryId);
  return category?.name || "תכשיט";
};

/**
 * Generate product text with gender-aware grammar
 * Main entry point for the storytelling engine
 */
export const generateProductText = (
  storyContent: string,
  productName: string,
  categoryName: string
): {
  preview: string;
  shortDesc: string;
  fullDesc: string;
  marketingCopy: string;
  gender: HebrewGender;
  categoryInfo: CategoryMetadata;
} => {
  const categoryInfo = getCategoryMetadata(categoryName);
  const resolved = resolvePlaceholders(storyContent, productName, categoryName);
  
  return {
    preview: resolved,
    shortDesc: truncateToSentence(resolved, PLATFORM_LIMITS.shortDesc),
    fullDesc: truncateToParagraph(resolved, PLATFORM_LIMITS.fullDesc),
    marketingCopy: addMarketingTone(truncateToParagraph(resolved, 300)),
    gender: categoryInfo.gender,
    categoryInfo,
  };
};
