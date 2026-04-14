/**
 * DiamoNY Global SEO Keyword Engine
 * Central repository for all SEO keywords used across AI content generation
 */

// Master list of 50 SEO keywords for DiamoNY
export const SEO_KEYWORDS = [
  // Lab & Natural Diamonds
  "יהלומי מעבדה",
  "יהלומים טבעיים",
  "יהלומי איכות",
  "יהלומים בדרגת Excellent",
  "יהלומים ללא פגמים",
  "יהלומים מלוטשים",
  
  // Engagement & Wedding
  "טבעות אירוסין",
  "טבעות נישואין",
  "טבעת סוליטר",
  "טבעת אינסוף",
  "טבעות יוקרה",
  "הצעת נישואין",
  "מתנה ליום נישואין",
  
  // Custom & Design
  "עיצוב תכשיטים בהתאמה אישית",
  "תכשיט בעיצוב אישי",
  "שדרוג תכשיטים",
  "תכשיטים מעוצבים",
  "תכשיטי וינטאג'",
  
  // Luxury & Quality
  "תכשיטי יוקרה",
  "High Jewelry",
  "צורף אומן",
  "צורפות בעבודת יד",
  
  // Gold Types
  "זהב 14K",
  "זהב 18K",
  "תכשיטי זהב לבן",
  "תכשיטי זהב צהוב",
  "זהב ורוד (Rose Gold)",
  
  // Certifications
  "תעודת GIA",
  "Diamond clarity",
  "ניקיון יהלום",
  "חיתוך יהלום",
  "משקל קראט",
  
  // Jewelry Types
  "עגילי יהלום",
  "עגילי חישוק יהלומים",
  "צמיד טניס",
  "צמיד קשיח זהב",
  "שרשרת יהלום",
  "תליון משובץ",
  "תכשיטי לכלה",
  "שיבוץ יהלומים",
  "Lab grown diamonds",
  
  // Business & Trust
  "קולקציית יהלומים",
  "יהלומים בבורסה",
  "קניית יהלומים בטוחה",
  "מותג תכשיטים ישראלי",
  "יצרן תכשיטים",
  "אולם תצוגה תכשיטים",
  "משלוח תכשיטים מאובטח",
  "מחירי יהלומים",
  
  // Gift & Occasions
  "מתנה לאישה",
  
  // Brand Specific
  "תכשיטי יהלומים DiamoNY",
] as const;

// Keywords grouped by category for intelligent selection
export const KEYWORD_CATEGORIES = {
  diamonds: [
    "יהלומי מעבדה",
    "יהלומים טבעיים",
    "יהלומי איכות",
    "יהלומים בדרגת Excellent",
    "יהלומים ללא פגמים",
    "יהלומים מלוטשים",
    "Lab grown diamonds",
    "Diamond clarity",
  ],
  engagement: [
    "טבעות אירוסין",
    "טבעות נישואין",
    "טבעת סוליטר",
    "טבעת אינסוף",
    "טבעות יוקרה",
    "הצעת נישואין",
    "מתנה ליום נישואין",
  ],
  rings: [
    "טבעות אירוסין",
    "טבעות נישואין",
    "טבעת סוליטר",
    "טבעת אינסוף",
    "טבעות יוקרה",
  ],
  earrings: [
    "עגילי יהלום",
    "עגילי חישוק יהלומים",
  ],
  bracelets: [
    "צמיד טניס",
    "צמיד קשיח זהב",
  ],
  necklaces: [
    "שרשרת יהלום",
    "תליון משובץ",
  ],
  pendants: [
    "תליון משובץ",
    "שרשרת יהלום",
  ],
  gold: [
    "זהב 14K",
    "זהב 18K",
    "תכשיטי זהב לבן",
    "תכשיטי זהב צהוב",
    "זהב ורוד (Rose Gold)",
  ],
  quality: [
    "תעודת GIA",
    "ניקיון יהלום",
    "חיתוך יהלום",
    "משקל קראט",
    "צורף אומן",
    "צורפות בעבודת יד",
  ],
  luxury: [
    "תכשיטי יוקרה",
    "High Jewelry",
    "יוקרה שקטה",
    "צורפות עילית",
  ],
  custom: [
    "עיצוב תכשיטים בהתאמה אישית",
    "תכשיט בעיצוב אישי",
    "שדרוג תכשיטים",
    "תכשיטים מעוצבים",
  ],
  bridal: [
    "תכשיטי לכלה",
    "טבעות אירוסין",
    "טבעות נישואין",
  ],
  trust: [
    "קניית יהלומים בטוחה",
    "מותג תכשיטים ישראלי",
    "משלוח תכשיטים מאובטח",
    "תעודת GIA",
  ],
} as const;

// High-priority keywords that should be included more frequently
export const HIGH_PRIORITY_KEYWORDS = [
  "יהלומי מעבדה",
  "טבעות אירוסין",
  "צורפות עילית",
  "יוקרה שקטה",
  "זהב 14K",
  "תעודת GIA",
  "תכשיט בעיצוב אישי",
  "תכשיטי יהלומים DiamoNY",
] as const;

// Power words for premium brand voice
export const BRAND_POWER_WORDS = [
  "צורפות עילית",
  "דיוק תלת-ממדי",
  "יוקרה שקטה",
  "שיבוץ קפדני",
  "נצחיות",
  "חותם אישי",
  "אור אורגני",
  "צללית נקייה",
  "מסורת מודרנית",
  "איכות ללא פשרות",
] as const;

/**
 * Get relevant keywords based on product category
 */
export function getKeywordsByCategory(categorySlug: string): string[] {
  const normalizedSlug = categorySlug.toLowerCase();
  
  // Map category slugs to keyword categories
  const categoryMap: Record<string, (keyof typeof KEYWORD_CATEGORIES)[]> = {
    "engagement-rings": ["engagement", "rings", "diamonds", "luxury"],
    "wedding-rings": ["engagement", "rings", "gold", "luxury"],
    "rings": ["rings", "diamonds", "gold", "luxury"],
    "earrings": ["earrings", "diamonds", "gold"],
    "bracelets": ["bracelets", "diamonds", "gold", "luxury"],
    "necklaces": ["necklaces", "diamonds", "gold"],
    "pendants": ["pendants", "diamonds", "gold"],
    "bridal": ["bridal", "engagement", "luxury", "diamonds"],
    "custom": ["custom", "luxury", "quality"],
    "lab-diamonds": ["diamonds", "quality", "trust"],
  };
  
  const relevantCategories = categoryMap[normalizedSlug] || ["luxury", "quality", "diamonds"];
  
  // Collect unique keywords from relevant categories
  const keywords = new Set<string>();
  relevantCategories.forEach(cat => {
    KEYWORD_CATEGORIES[cat]?.forEach(kw => keywords.add(kw));
  });
  
  // Always add high priority keywords
  HIGH_PRIORITY_KEYWORDS.forEach(kw => keywords.add(kw));
  
  return Array.from(keywords);
}

/**
 * Generate AI system prompt injection for SEO optimization
 */
export function generateSEOPromptInjection(categorySlug?: string): string {
  const relevantKeywords = categorySlug 
    ? getKeywordsByCategory(categorySlug)
    : SEO_KEYWORDS;
  
  return `
## מנוע SEO גלובלי - DiamoNY

### הנחיות אופטימיזציה ל-SEO:
שלב את מילות המפתח הבאות בצורה **טבעית ואלגנטית** בתוך הטקסט.
הימנע מ-keyword stuffing - המילים צריכות לזרום טבעית בתוך המשפטים.
שמור על הטון היוקרתי, המינימליסטי והמקצועי של DiamoNY.

### מילות מפתח לשילוב (בחר 5-8 מתאימות):
${relevantKeywords.slice(0, 25).map(kw => `• ${kw}`).join('\n')}

### מילות כוח חובה (שלב לפחות 2-3):
${BRAND_POWER_WORDS.map(pw => `• ${pw}`).join('\n')}

### כללי שילוב:
1. **התאמה לקונטקסט**: בחר מילות מפתח שמתאימות לסוג המוצר/התוכן
2. **פיזור טבעי**: פזר את המילים לאורך כל הטקסט
3. **שמירה על סגנון**: הטקסט צריך להישמע טבעי ויוקרתי, לא "מכירתי"
4. **עדיפות למילות כוח**: מילות הכוח של המותג צריכות לקבל עדיפות
`;
}

/**
 * Analyze text and find which SEO keywords are present
 */
export function analyzeKeywordPresence(text: string): {
  found: string[];
  missing: string[];
  score: number;
  powerWordsFound: string[];
} {
  const normalizedText = text.toLowerCase();
  
  const found: string[] = [];
  const missing: string[] = [];
  
  SEO_KEYWORDS.forEach(keyword => {
    if (normalizedText.includes(keyword.toLowerCase())) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  });
  
  const powerWordsFound = BRAND_POWER_WORDS.filter(pw => 
    normalizedText.includes(pw.toLowerCase())
  ) as string[];
  
  // Calculate SEO score (0-100)
  const keywordScore = Math.min((found.length / 8) * 50, 50); // Max 50 points for keywords
  const powerWordScore = Math.min((powerWordsFound.length / 3) * 50, 50); // Max 50 points for power words
  const score = Math.round(keywordScore + powerWordScore);
  
  return {
    found,
    missing,
    score,
    powerWordsFound,
  };
}

/**
 * Get suggested keywords to add based on content analysis
 */
export function getSuggestedKeywords(text: string, categorySlug?: string, limit: number = 5): string[] {
  const { missing } = analyzeKeywordPresence(text);
  
  // Prioritize keywords based on category
  const categoryKeywords = categorySlug 
    ? getKeywordsByCategory(categorySlug)
    : [];
  
  // Sort missing keywords by priority
  const prioritized = missing.sort((a, b) => {
    const aInCategory = categoryKeywords.includes(a);
    const bInCategory = categoryKeywords.includes(b);
    const aHighPriority = HIGH_PRIORITY_KEYWORDS.includes(a as any);
    const bHighPriority = HIGH_PRIORITY_KEYWORDS.includes(b as any);
    
    if (aInCategory && !bInCategory) return -1;
    if (!aInCategory && bInCategory) return 1;
    if (aHighPriority && !bHighPriority) return -1;
    if (!aHighPriority && bHighPriority) return 1;
    return 0;
  });
  
  return prioritized.slice(0, limit);
}

export type SEOKeyword = typeof SEO_KEYWORDS[number];
export type BrandPowerWord = typeof BRAND_POWER_WORDS[number];
