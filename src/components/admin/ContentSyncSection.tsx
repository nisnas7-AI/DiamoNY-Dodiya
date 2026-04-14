import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  RefreshCw,
  Sparkles,
  Link2,
  Smartphone,
  Wand2,
  Loader2,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ContentState, PLATFORM_LIMITS, checkPlatformLimit, type HebrewGender, type CategoryMetadata } from "@/lib/contentSync";
import imageCompression from "browser-image-compression";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProductStory {
  id: string;
  title: string;
  content_body?: string | null;
  category: string | null;
  is_default: boolean | null;
}

interface ContentSyncSectionProps {
  contentState: ContentState;
  filteredStories: ProductStory[];
  allStories: ProductStory[] | undefined;
  selectedStory: ProductStory | undefined;
  productName: string;
  imageUrl?: string;
  productSlug?: string;
  externalUrl: string;
  stockStatus?: 'in_stock' | 'made_to_order' | 'out_of_stock';
  categoryMetadata?: CategoryMetadata;
  gender?: HebrewGender;
  // Product specs for AI generation
  goldType?: string;
  stoneType?: string;
  stoneWeight?: string;
  onTemplateChange: (id: string) => void;
  onFieldChange: (field: keyof Omit<ContentState, "templateId" | "isLocallyModified">, value: string) => void;
  onExternalUrlChange: (value: string) => void;
  onResetToTemplate: () => void;
}

// Jewelry emojis for social copy
const JEWELRY_EMOJIS = ["💎", "✨", "💍", "👑", "🌟", "💫", "🔮", "💝", "🤍", "⭐"];

const getRandomEmojis = (count: number = 3): string => {
  const shuffled = [...JEWELRY_EMOJIS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join("");
};

// Supabase Edge Function for AI
const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  || (import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : "");
const EDGE_FUNCTION_URL = `${SUPABASE_BASE_URL}/functions/v1/process-jewelry-vision`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Compress image for AI
const compressImageForAI = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/jpeg" as const,
    };
    const compressedFile = await imageCompression(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error("Image compression failed:", error);
    throw error;
  }
};

const ContentSyncSection = ({
  contentState,
  filteredStories,
  allStories,
  selectedStory,
  productName,
  imageUrl,
  productSlug,
  externalUrl,
  stockStatus,
  categoryMetadata,
  gender,
  goldType,
  stoneType,
  stoneWeight,
  onTemplateChange,
  onFieldChange,
  onExternalUrlChange,
  onResetToTemplate,
}: ContentSyncSectionProps) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Character limits checks
  const shortDescLimit = checkPlatformLimit(contentState.shortDesc, "shortDesc");
  const fullDescLimit = checkPlatformLimit(contentState.fullDesc, "fullDesc");
  const twitterLimit = checkPlatformLimit(contentState.marketingCopy, "twitter");
  const instagramLimit = checkPlatformLimit(contentState.marketingCopy, "instagram");

  const generateProductUrl = () => {
    if (productSlug) {
      const baseUrl = window.location.origin;
      const productUrl = `${baseUrl}/catalog?product=${productSlug}`;
      onExternalUrlChange(productUrl);
      toast.success("קישור נוצר בהצלחה");
    }
  };

  const generateMagicWrite = async () => {
    if (!imageUrl) {
      toast.error("נא להעלות תמונה קודם כדי להשתמש ב-Magic Write");
      return;
    }

    // Validation warnings for missing product specs
    const missingSpecs: string[] = [];
    if (!goldType) missingSpecs.push("סוג זהב");
    if (!stoneType) missingSpecs.push("סוג אבן");
    if (!stoneWeight) missingSpecs.push("משקל אבן");
    
    if (missingSpecs.length > 0) {
      toast.warning(`שימו לב: חסרים פרטים טכניים (${missingSpecs.join(", ")}). ה-AI ימשיך עם הנתונים הזמינים.`);
    }

    setIsGeneratingAI(true);
    try {
      toast.info("מכווץ תמונה לניתוח AI...");
      const compressedDataUrl = await compressImageForAI(imageUrl);

      const storyHook = selectedStory?.content_body
        ? selectedStory.content_body.replace(/\{\{product_name\}\}/g, productName || "התכשיט")
        : "";

      // Include all product specs in brand context for AI generation
      const brandContext = JSON.stringify({
        productName: productName || "יצירת תכשיטים יוקרתית",
        storyHook,
        storyStyle: selectedStory?.title || "",
        stockStatus: stockStatus || "made_to_order",
        // Product technical specs for 100% accuracy
        goldType: goldType || "",
        stoneType: stoneType || "",
        stoneWeight: stoneWeight || "",
      });

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ imageUrl: compressedDataUrl, brandContext }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("429");
        if (response.status === 402) throw new Error("402");
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data?.socialPost) {
        onFieldChange("marketingCopy", data.socialPost);
        toast.success("קופי שיווקי נוצר בהצלחה! ✨");
      } else if (data?.shortDescription) {
        onFieldChange("marketingCopy", data.shortDescription);
        toast.success("קופי שיווקי נוצר בהצלחה! ✨");
      }
    } catch (error: any) {
      console.error("Magic Write error:", error);
      if (error.message?.includes("429")) {
        toast.error("חריגה ממגבלת בקשות. נסה שוב מאוחר יותר.");
      } else if (error.message?.includes("402")) {
        toast.error("נדרש תשלום. יש להוסיף קרדיטים.");
      } else {
        toast.error(error.message || "שגיאה ביצירת תיאור AI");
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const copyForSocial = async () => {
    if (!contentState.marketingCopy.trim()) {
      toast.error("אין טקסט להעתקה");
      return;
    }

    const emojis = getRandomEmojis(3);
    const textWithEmojis = `${contentState.marketingCopy.trim()} ${emojis}`;
    const fullText = externalUrl ? `${textWithEmojis}\n\n${externalUrl}` : textWithEmojis;

    try {
      await navigator.clipboard.writeText(fullText);
      toast.success("מוכן לפרסום! הטקסט והקישור הועתקו ללוח 📱");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("שגיאה בהעתקה ללוח");
    }
  };

  const storiesToShow = filteredStories.length > 0 ? filteredStories : (allStories || []);

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-br from-violet-50/30 to-purple-50/20 dark:from-violet-950/20 dark:to-purple-950/10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-violet-600" />
          <h3 className="font-medium text-violet-800 dark:text-violet-300">
            📖 סנכרון תוכן דינמי
          </h3>
          {/* Gender Badge */}
          {categoryMetadata && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-normal",
                gender === "feminine" 
                  ? "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300" 
                  : "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-300"
              )}
            >
              {gender === "feminine" ? "נקבה ♀" : "זכר ♂"} • {categoryMetadata.singular}
            </Badge>
          )}
        </div>
        {contentState.isLocallyModified && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetToTemplate}
            className="text-xs gap-1 text-violet-600 hover:text-violet-700"
          >
            <RefreshCw className="h-3 w-3" />
            איפוס לתבנית
          </Button>
        )}
      </div>

      {/* Story Selection - Now at the TOP */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          📚 תבנית סיפור
          {contentState.isLocallyModified && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
              שינויים מקומיים
            </span>
          )}
        </Label>
        <Select value={contentState.templateId} onValueChange={onTemplateChange}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="בחר תבנית סיפור" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">ללא תבנית</SelectItem>
            {storiesToShow.map((story) => (
              <SelectItem key={story.id} value={story.id}>
                {story.title} {story.is_default && "⭐"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Short Description - Now below Story Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            תיאור קצר
            {contentState.isLocallyModified && (
              <Pencil className="h-3 w-3 text-amber-500" />
            )}
          </Label>
          <span
            className={cn(
              "text-xs",
              shortDescLimit.isOver ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {contentState.shortDesc.length}/{PLATFORM_LIMITS.shortDesc}
          </span>
        </div>
        <Textarea
          value={contentState.shortDesc}
          onChange={(e) => onFieldChange("shortDesc", e.target.value)}
          placeholder="תיאור קצר למכירה (עד 120 תווים)..."
          rows={2}
          className={cn(
            "resize-none",
            contentState.isLocallyModified && "border-amber-300 focus:border-amber-400"
          )}
        />
      </div>

      {/* Full Description - Now below Short Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            תיאור מלא
            {contentState.isLocallyModified && (
              <Pencil className="h-3 w-3 text-amber-500" />
            )}
          </Label>
          <span
            className={cn(
              "text-xs",
              fullDescLimit.isOver ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {contentState.fullDesc.length}/{PLATFORM_LIMITS.fullDesc}
          </span>
        </div>
        <Textarea
          value={contentState.fullDesc}
          onChange={(e) => onFieldChange("fullDesc", e.target.value)}
          placeholder="תיאור מפורט של המוצר (עד 500 תווים)..."
          rows={4}
          className={cn(
            "resize-y",
            contentState.isLocallyModified && "border-amber-300 focus:border-amber-400"
          )}
        />
      </div>


      {/* Marketing Copy with Magic Write */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            קופי שיווקי (AI Marketing)
          </Label>
          <Button
            type="button"
            onClick={generateMagicWrite}
            disabled={isGeneratingAI || !imageUrl}
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700 text-xs"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 ml-1" />
                Magic Write ✨
              </>
            )}
          </Button>
        </div>
        <Textarea
          value={contentState.marketingCopy}
          onChange={(e) => onFieldChange("marketingCopy", e.target.value)}
          placeholder="הזן טקסט שיווקי או לחץ Magic Write ליצירה אוטומטית..."
          rows={3}
          className={cn(
            "resize-y",
            contentState.isLocallyModified && "border-amber-300 focus:border-amber-400"
          )}
        />

        {/* Platform Limits */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {contentState.marketingCopy.length} תווים
          </span>
          <div className="flex gap-3">
            <span className={twitterLimit.isOver ? "text-red-500" : "text-green-600"}>
              𝕏: {twitterLimit.isOver ? `חריגה ${Math.abs(twitterLimit.remaining)}` : `נותרו ${twitterLimit.remaining}`}
            </span>
            <span className={instagramLimit.isOver ? "text-red-500" : "text-green-600"}>
              IG: {instagramLimit.isOver ? `חריגה ${Math.abs(instagramLimit.remaining)}` : `נותרו ${instagramLimit.remaining}`}
            </span>
          </div>
        </div>
      </div>

      {/* External URL */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          קישור לעמוד המוצר
        </Label>
        <div className="flex gap-2">
          <Input
            type="url"
            value={externalUrl}
            onChange={(e) => onExternalUrlChange(e.target.value)}
            placeholder="https://example.com/product"
            className="flex-1"
          />
          {productSlug && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={generateProductUrl}
              title="צור קישור אוטומטי"
              className="shrink-0"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Copy for Social */}
      <Button
        type="button"
        onClick={copyForSocial}
        disabled={!contentState.marketingCopy.trim()}
        className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
      >
        <Smartphone className="h-4 w-4 ml-2" />
        📱 Copy for Social
      </Button>

      {/* Notice */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          שינויים ידניים נשמרים רק למוצר זה, לא לתבנית הגלובלית. לחץ "איפוס לתבנית" לשחזור.
        </p>
      </div>
    </div>
  );
};

export default ContentSyncSection;
