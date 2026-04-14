import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Link2, Smartphone, Wand2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

interface MagicWritePanelProps {
  productName: string;
  goldType: string;
  stoneType: string;
  stoneWeight: string;
  sku?: string;
  description: string;
  externalUrl: string;
  imageUrl?: string;
  productSlug?: string;
  categoryId?: string; // Added for category-aware story filtering
  stockStatus?: 'in_stock' | 'made_to_order' | 'out_of_stock'; // For MTO story integration
  onDescriptionChange: (value: string) => void;
  onExternalUrlChange: (value: string) => void;
}

interface ProductStory {
  id: string;
  title: string;
  category: string | null;
  content_body: string | null;
}

// Jewelry emojis for auto-formatting
const JEWELRY_EMOJIS = ["💎", "✨", "💍", "👑", "🌟", "💫", "🔮", "💝", "🤍", "⭐"];

// Character limits for different platforms
const PLATFORM_LIMITS = {
  instagram: 2200,
  twitter: 280,
  facebook: 63206,
};

// Supabase Edge Function endpoint
const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  || (import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : "");
const EDGE_FUNCTION_URL = `${SUPABASE_BASE_URL}/functions/v1/process-jewelry-vision`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getRandomEmojis = (count: number = 3): string => {
  const shuffled = [...JEWELRY_EMOJIS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join("");
};

// Compress image for AI analysis (max 1024px, 80% quality)
const compressImageForAI = async (imageUrl: string): Promise<string> => {
  try {
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    
    const blob = await response.blob();
    const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });

    // Compression options
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/jpeg" as const,
    };

    console.log(`Original image size: ${(file.size / 1024).toFixed(1)}KB`);
    
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed image size: ${(compressedFile.size / 1024).toFixed(1)}KB`);

    // Convert to base64 data URL for sending
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

const MagicWritePanel = ({
  productName,
  goldType,
  stoneType,
  stoneWeight,
  sku,
  description,
  externalUrl,
  imageUrl,
  productSlug,
  categoryId,
  stockStatus,
  onDescriptionChange,
  onExternalUrlChange,
}: MagicWritePanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [stories, setStories] = useState<ProductStory[]>([]);
  const [categorySlug, setCategorySlug] = useState<string>("");

  // Fetch category slug for filtering stories
  useEffect(() => {
    const fetchCategorySlug = async () => {
      if (!categoryId) {
        setCategorySlug("");
        return;
      }
      const { data } = await supabase
        .from("categories")
        .select("slug")
        .eq("id", categoryId)
        .single();
      if (data) {
        setCategorySlug(data.slug);
      }
    };
    fetchCategorySlug();
  }, [categoryId]);

  // Fetch product stories from database
  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from("product_stories")
        .select("id, title, category, content_body")
        .order("title");
      
      if (!error && data) {
        setStories(data);
        // Auto-select first matching story
        const matching = data.find(s => 
          categorySlug && s.category?.toLowerCase() === categorySlug.toLowerCase()
        );
        if (matching) {
          setSelectedStoryId(matching.id);
        } else if (data.length > 0) {
          setSelectedStoryId(data[0].id);
        }
      }
    };
    fetchStories();
  }, [categorySlug]);

  // Filter stories by category
  const filteredStories = categorySlug
    ? stories.filter(s => s.category?.toLowerCase() === categorySlug.toLowerCase())
    : stories;

  const selectedStory = stories.find(s => s.id === selectedStoryId);

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

    setIsGenerating(true);
    try {
      // Compress image client-side before sending to AI
      toast.info("מכווץ תמונה לניתוח AI...");
      const compressedDataUrl = await compressImageForAI(imageUrl);
      
      // Get selected story content
      const storyHook = selectedStory?.content_body
        ? selectedStory.content_body.replace(/\{\{product_name\}\}/g, productName || "התכשיט")
        : "";
      
      // Log for debugging
      console.log('Magic Write - Selected Story:', selectedStory?.title);
      console.log('Magic Write - Story Hook:', storyHook);
      
      // Build product context JSON for luxury Hebrew storytelling
      const brandContext = JSON.stringify({
        productName: productName || "יצירת תכשיטים יוקרתית",
        sku: sku || "",
        goldType: goldType || "",
        stoneType: stoneType || "",
        stoneWeight: stoneWeight || "",
        storyHook: storyHook,
        storyStyle: selectedStory?.title || "",
        stockStatus: stockStatus || "made_to_order" // Default to MTO for gold choice logic
      });
      
      console.log('Magic Write - brandContext being sent:', brandContext);

      // Direct POST request to Supabase Edge Function with compressed image
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          imageUrl: compressedDataUrl, // Send compressed base64 data URL
          brandContext,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("429");
        }
        if (response.status === 402) {
          throw new Error("402");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();

      // Parse Gemini response (returns JSON directly with socialPost and shortDescription)
      if (data?.socialPost) {
        onDescriptionChange(data.socialPost);
        toast.success("תיאור AI נוצר בהצלחה! ✨");
      } else if (data?.shortDescription) {
        onDescriptionChange(data.shortDescription);
        toast.success("תיאור AI נוצר בהצלחה! ✨");
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        // Fallback: try to extract any text content
        const textContent = JSON.stringify(data);
        if (textContent && textContent !== "{}") {
          onDescriptionChange(textContent);
          toast.success("תיאור AI נוצר בהצלחה! ✨");
        } else {
          throw new Error("לא התקבלה תשובה מה-AI");
        }
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
      setIsGenerating(false);
    }
  };

  const copyForSocial = async () => {
    if (!description.trim()) {
      toast.error("אין טקסט להעתקה");
      return;
    }

    // Add jewelry emojis at the end
    const emojis = getRandomEmojis(3);
    const textWithEmojis = `${description.trim()} ${emojis}`;
    
    // Concatenate text + two newlines + URL
    const fullText = externalUrl 
      ? `${textWithEmojis}\n\n${externalUrl}`
      : textWithEmojis;

    try {
      await navigator.clipboard.writeText(fullText);
      toast.success("מוכן לפרסום! הטקסט והקישור הועתקו ללוח 📱", {
        duration: 3000,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("שגיאה בהעתקה ללוח");
    }
  };

  const charCount = description.length;
  const getCharCountColor = () => {
    if (charCount > PLATFORM_LIMITS.instagram) return "text-red-500";
    if (charCount > PLATFORM_LIMITS.twitter) return "text-amber-500";
    return "text-muted-foreground";
  };

  return (
    <div className="border border-violet-200/50 rounded-lg p-4 bg-gradient-to-br from-violet-50/50 to-purple-50/30 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <h4 className="font-medium text-violet-700">Magic Write Suite</h4>
      </div>

      {/* Story Selector from Database */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-500" />
          בחירת כותרת סיפור
        </Label>
        <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
          <SelectTrigger className="bg-background border-border/50">
            <SelectValue placeholder="בחר סיפור מותג" />
          </SelectTrigger>
          <SelectContent>
            {filteredStories.length > 0 ? (
              filteredStories.map((story) => (
                <SelectItem key={story.id} value={story.id}>
                  {story.title}
                </SelectItem>
              ))
            ) : (
              stories.map((story) => (
                <SelectItem key={story.id} value={story.id}>
                  {story.title} ({story.category || "כללי"})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {selectedStory && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {selectedStory.content_body?.replace(/\{\{product_name\}\}/g, productName || "התכשיט").slice(0, 100)}...
          </p>
        )}
      </div>

      {/* Magic Write Button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          onClick={generateMagicWrite}
          disabled={isGenerating || !imageUrl}
          variant="outline"
          className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700 hover:text-violet-800 transition-all duration-200 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              Thinking... ✨
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 ml-2" />
              Magic Write ✨
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {imageUrl ? "ניתוח תמונה ויצירת טקסט שיווקי באמצעות AI" : "העלה תמונה כדי להפעיל"}
        </span>
      </div>

      {/* Description Textarea */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">תיאור שיווקי (AI)</Label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="הזן תיאור מוצר או לחץ על Magic Write ליצירה אוטומטית..."
          className="min-h-[120px] resize-y bg-background border-border/50 focus:border-primary/50 transition-colors font-sans leading-relaxed"
        />
        
        {/* Character Counter */}
        <div className={`text-xs flex items-center justify-between ${getCharCountColor()}`}>
          <span>{charCount} תווים</span>
          <span className="flex gap-3 text-muted-foreground">
            <span className={charCount <= PLATFORM_LIMITS.twitter ? "text-green-600" : "text-red-400"}>
              𝕏: {PLATFORM_LIMITS.twitter - charCount > 0 ? `נותרו ${PLATFORM_LIMITS.twitter - charCount}` : `חריגה של ${charCount - PLATFORM_LIMITS.twitter}`}
            </span>
            <span className={charCount <= PLATFORM_LIMITS.instagram ? "text-green-600" : "text-red-400"}>
              IG: {PLATFORM_LIMITS.instagram - charCount > 0 ? `נותרו ${PLATFORM_LIMITS.instagram - charCount}` : `חריגה של ${charCount - PLATFORM_LIMITS.instagram}`}
            </span>
          </span>
        </div>
      </div>

      {/* External URL Input */}
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
            className="flex-1 bg-background border-border/50 focus:border-primary/50 transition-colors"
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

      {/* Copy for Social Button */}
      <Button
        type="button"
        onClick={copyForSocial}
        disabled={!description.trim()}
        className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Smartphone className="h-4 w-4 ml-2" />
        📱 Copy for Social
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        מעתיק את הטקסט עם אימוג'ים וקישור לפרסום מיידי
      </p>
    </div>
  );
};

export default MagicWritePanel;
