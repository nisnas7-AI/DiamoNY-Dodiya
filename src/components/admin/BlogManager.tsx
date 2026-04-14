import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  FileText, Calendar as CalendarIcon, Eye, EyeOff, Sparkles, Loader2, Plus, Edit, Trash2, 
  Save, X, Image, Link, Bold, Italic, List, Heading1, Heading2, 
  Upload, Globe, ChevronDown, FileEdit, ListTree, BookOpen, CheckCircle, Wand2,
  SplitSquareHorizontal, PanelLeft, PanelRight, CalendarDays, Crop, Video, Code
} from "lucide-react";
import { ImageEditor } from "./ImageEditor";
import { BlogMediaSelector, MediaType } from "./BlogMediaSelector";
import { RichTextEditor } from "./RichTextEditor";
import { BlogLivePreview } from "./BlogLivePreview";
import { BlogFAQBuilder } from "./BlogFAQBuilder";
import { processImageForCatalog, CATALOG_IMAGE_CONFIG, blobToDataUrl } from "@/lib/imageProcessor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlogManagerProps {
  limit?: number;
  compact?: boolean;
  showAI?: boolean;
}

import { Json } from "@/integrations/supabase/types";

interface FAQItem {
  question: string;
  answer: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_media_type: string | null; // 'image' | 'video' from DB
  is_published: boolean | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  custom_json_ld: Json | null; // Custom JSON-LD schema
  faq_data?: Json | null;
  created_at: string;
  updated_at: string;
  author_id: string | null;
}

const isRecord = (value: Json | null | undefined): value is Record<string, Json> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isFaqPageSchema = (value: Json | null | undefined): boolean =>
  isRecord(value) && value["@type"] === "FAQPage";

const parseFaqItems = (value: Json | null | undefined): FAQItem[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const question = typeof item.question === "string" ? item.question.trim() : "";
        const answer = typeof item.answer === "string" ? item.answer.trim() : "";
        return question && answer ? { question, answer } : null;
      })
      .filter((item): item is FAQItem => Boolean(item));
  }

  if (!isFaqPageSchema(value)) return [];

  const mainEntity = value["mainEntity"];
  if (!Array.isArray(mainEntity)) return [];

  return mainEntity
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, Json>;
      const question = typeof record.name === "string" ? record.name.trim() : "";
      const acceptedAnswer =
        record.acceptedAnswer && typeof record.acceptedAnswer === "object" && !Array.isArray(record.acceptedAnswer)
          ? (record.acceptedAnswer as Record<string, Json>)
          : null;
      const answer = acceptedAnswer && typeof acceptedAnswer.text === "string" ? acceptedAnswer.text.trim() : "";
      return question && answer ? { question, answer } : null;
    })
    .filter((item): item is FAQItem => Boolean(item));
};

/** Strips domains, protocols, slashes — returns clean lowercase slug */
const sanitizeBlogSlug = (raw: string): string => {
  return raw
    .replace(/^https?:\/\//i, '')
    .replace(/^[a-z0-9-]+\.[a-z]{2,}\//i, '')
    .replace(/\//g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const BlogManager = ({ limit, compact = false, showAI = false }: BlogManagerProps) => {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [remoteUrlInput, setRemoteUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  
  // AI Writing dialogs
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [showOutlineDialog, setShowOutlineDialog] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  
  // Preview mode: 'edit' | 'preview' | 'split'
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'split'>('split');
  
  // Raw JSON-LD text for editing (separate from parsed value)
  const [jsonLdText, setJsonLdText] = useState("");
  
  // FAQ items are local to the currently edited post only
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  
  // Quick preview from list
  const [quickPreviewPost, setQuickPreviewPost] = useState<BlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", limit],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: mediaItems } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createPost = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const payload = {
        title: post.title || "מאמר חדש",
        slug: post.slug || `post-${Date.now()}`,
        content: post.content || "",
        excerpt: post.excerpt || "",
        featured_image_url: post.featured_image_url || null,
        is_published: post.is_published || false,
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || "",
        custom_json_ld: post.custom_json_ld || null,
        faq_data: post.faq_data || null,
      } as any;

      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("המאמר נוצר בהצלחה");
      setIsEditing(false);
      setEditingPost(null);
      setJsonLdText("");
      setFaqItems([]);
    },
    onError: (error: any) => {
      if (error?.code === "23505") {
        toast.error("כותרת/כתובת URL זו כבר קיימת. נא לבחור כותרת אחרת.");
      } else {
        toast.error(error.message || "שגיאה ביצירת המאמר");
      }
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BlogPost> }) => {
      // Strip read-only / non-updatable fields to avoid Supabase errors
      const { id: _id, created_at, updated_at, author_id, ...cleanUpdates } = updates as any;
      console.log("[BlogManager] Updating post", id, "payload keys:", Object.keys(cleanUpdates));
      const { error } = await supabase
        .from("blog_posts")
        .update(cleanUpdates)
        .eq("id", id);
      if (error) {
        console.error("[BlogManager] Update error:", error);
        throw error;
      }
    },
    onSuccess: async (_data, variables) => {
      // Immediately update local state so the list reflects changes without waiting
      queryClient.setQueryData(["blog-posts", limit], (old: BlogPost[] | undefined) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === variables.id ? { ...p, ...variables.updates, updated_at: new Date().toISOString() } : p
        );
      });
      // Also invalidate to get the authoritative server state
      await queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("הפוסט עודכן בהצלחה ✅");
      setIsEditing(false);
      setEditingPost(null);
      setJsonLdText("");
      setFaqItems([]);
    },
    onError: (error: any) => {
      console.error("[BlogManager] Mutation error:", error);
      if (error?.code === "23505") {
        toast.error("כותרת/כתובת URL זו כבר קיימת. נא לבחור כותרת אחרת.");
      } else {
        toast.error(error.message || "שגיאה בעדכון הפוסט");
      }
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("המאמר נמחק");
    },
    onError: () => {
      toast.error("שגיאה במחיקת המאמר");
    },
  });

  // Enhanced AI generation that works for new posts too
  const generateAIContent = async (type: string, extraData?: { topic?: string; selectedText?: string }) => {
    const loadingKey = `ai-${type}`;
    setAiLoading((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("ai-seo", {
        body: {
          type,
          title: editingPost?.title || "",
          content: editingPost?.content || "",
          topic: extraData?.topic || editingPost?.title || "",
          selectedText: extraData?.selectedText || "",
        },
      });

      if (error) {
        console.error("[BlogManager] AI edge function error:", error);
        throw new Error(typeof error === "object" && error.message ? error.message : "שגיאה בקריאה לשרת AI");
      }

      if (!data || !data.result) {
        throw new Error("תשובת AI ריקה – נא לנסות שוב");
      }

      const result = data.result;
      
      switch (type) {
        case "meta_title":
          setEditingPost((prev) => ({ ...prev, meta_title: result }));
          toast.success("כותרת מטא נוצרה - לא לשכוח לשמור!");
          break;
        case "meta_description":
          setEditingPost((prev) => ({ ...prev, meta_description: result }));
          toast.success("תיאור מטא נוצר - לא לשכוח לשמור!");
          break;
        case "excerpt":
          setEditingPost((prev) => ({ ...prev, excerpt: result }));
          toast.success("תקציר נוצר - לא לשכוח לשמור!");
          break;
        case "improve_content":
          setEditingPost((prev) => ({ ...prev, content: result }));
          toast.success("התוכן שופר - לא לשכוח לשמור!");
          break;
        case "generate_article":
          // Extract title from generated article (first line usually)
          const lines = result.split('\n');
          const generatedTitle = lines[0]?.replace(/^#\s*/, '').trim() || extraData?.topic || "";
          setEditingPost((prev) => ({ 
            ...prev, 
            content: result,
            title: prev?.title || generatedTitle
          }));
          setShowArticleDialog(false);
          setAiTopic("");
          toast.success("מאמר נוצר בהצלחה! ✨");
          break;
        case "generate_outline":
          setEditingPost((prev) => ({ ...prev, content: result }));
          setShowOutlineDialog(false);
          setAiTopic("");
          toast.success("מבנה מאמר נוצר - אפשר להרחיב כל סעיף!");
          break;
        case "expand_text":
          // Replace selected text with expanded version
          const textarea = contentRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentContent = editingPost?.content || "";
            const newContent = 
              currentContent.substring(0, start) + 
              result + 
              currentContent.substring(end);
            setEditingPost((prev) => ({ ...prev, content: newContent }));
          }
          toast.success("הטקסט הורחב בהצלחה!");
          break;
        case "write_intro":
          const currentContentIntro = editingPost?.content || "";
          setEditingPost((prev) => ({ 
            ...prev, 
            content: result + "\n\n" + currentContentIntro 
          }));
          toast.success("מבוא נכתב והוספ לתחילת המאמר!");
          break;
        case "write_conclusion":
          const currentContentConclusion = editingPost?.content || "";
          setEditingPost((prev) => ({ 
            ...prev, 
            content: currentContentConclusion + "\n\n" + result 
          }));
          toast.success("סיכום נכתב והוסף לסוף המאמר!");
          break;
      }
    } catch (error: any) {
      console.error("AI content error:", error);
      toast.error(error.message || "שגיאה ביצירת תוכן AI");
    } finally {
      setAiLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Get selected text from textarea
  const getSelectedText = useCallback(() => {
    const textarea = contentRef.current;
    if (!textarea) return "";
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    return (editingPost?.content || "").substring(start, end);
  }, [editingPost]);

  const insertTextAtCursor = useCallback((before: string, after: string = "") => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = editingPost?.content || "";
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    setEditingPost((prev) => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [editingPost]);

  const insertImage = (imageUrl: string) => {
    insertTextAtCursor(`\n![תמונה](${imageUrl})\n`);
    setShowMediaPicker(false);
  };

  const insertVideo = (videoUrl: string) => {
    insertTextAtCursor(`\n<video src="${videoUrl}" controls style="max-width: 100%;"></video>\n`);
    setShowMediaPicker(false);
  };

  const uploadFromUrl = async (url: string, isVideo: boolean = false) => {
    if (!url) return;
    
    setUrlLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("שגיאה בהורדת הקובץ");
      
      let blob = await response.blob();
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const originalFilename = pathParts[pathParts.length - 1] || "file";
      let fileExt = originalFilename.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
      let contentType = blob.type || (isVideo ? `video/${fileExt}` : `image/${fileExt}`);

      // Process image if not video
      if (!isVideo && blob.type.startsWith("image/") && !blob.type.includes("gif")) {
        try {
          const result = await processImageForCatalog(url);
          blob = result.blob;
          contentType = result.format === 'webp' ? 'image/webp' : 'image/jpeg';
          fileExt = result.format;
        } catch (error) {
          console.error("Error processing image:", error);
          // Fall back to original blob
        }
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalog-media")
        .upload(filePath, blob, { contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("catalog-media")
        .getPublicUrl(filePath);

      await supabase.from("media").insert({
        filename: fileName,
        original_filename: originalFilename,
        file_url: publicUrl,
        file_type: contentType,
        file_size: blob.size,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      
      if (isVideo) {
        insertVideo(publicUrl);
      } else {
        insertImage(publicUrl);
      }
      
      setRemoteUrlInput("");
      toast.success("הקובץ הועלה בהצלחה");
    } catch (error: any) {
      console.error("URL upload error:", error);
      toast.error(error.message || "שגיאה בהעלאה מכתובת URL");
    } finally {
      setUrlLoading(false);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      const linkMarkdown = linkText ? `[${linkText}](${linkUrl})` : `[${linkUrl}](${linkUrl})`;
      insertTextAtCursor(linkMarkdown);
      setLinkText("");
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };

  const startNewPost = () => {
    setEditingPost({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image_url: null,
      featured_media_type: "image",
      is_published: false,
      meta_title: "",
      meta_description: "",
      custom_json_ld: null,
      faq_data: [],
    });
    setFaqItems([]);
    setJsonLdText("");
    setIsEditing(true);
  };

  const startEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setFaqItems(parseFaqItems(post.faq_data || (isFaqPageSchema(post.custom_json_ld) ? post.custom_json_ld : null)));
    setJsonLdText(
      post.custom_json_ld && !isFaqPageSchema(post.custom_json_ld)
        ? JSON.stringify(post.custom_json_ld, null, 2)
        : ""
    );
    setIsEditing(true);
  };

  const savePost = async () => {
    if (!editingPost) return;

    setIsSaving(true);

    try {
      if (!editingPost.title?.trim()) {
        toast.error("נא להזין כותרת למאמר");
        return;
      }

      let parsedJsonLd: Json | null = null;
      if (jsonLdText.trim()) {
        try {
          parsedJsonLd = JSON.parse(jsonLdText) as Json;
        } catch {
          toast.error("קוד JSON-LD לא תקין - נא לתקן לפני שמירה");
          return;
        }
      }

      const slug = sanitizeBlogSlug(editingPost.slug || editingPost.title || `post-${Date.now()}`);
      const validFaqItems = faqItems.filter((item) => item.question.trim() && item.answer.trim());

      const slugQuery = supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", slug);

      const { data: dupeSlug, error: slugError } = editingPost.id
        ? await slugQuery.neq("id", editingPost.id).maybeSingle()
        : await slugQuery.maybeSingle();

      if (slugError) {
        throw slugError;
      }

      if (dupeSlug) {
        toast.warning("כתובת ה-URL הזו כבר קיימת. נא לבחור slug אחר לפני שמירה.");
        return;
      }

      const postData: Partial<BlogPost> = {
        title: editingPost.title,
        slug,
        content: editingPost.content ?? null,
        excerpt: editingPost.excerpt ?? null,
        featured_image_url: editingPost.featured_image_url ?? null,
        featured_media_type: editingPost.featured_media_type ?? "image",
        is_published: editingPost.is_published ?? false,
        published_at: editingPost.published_at ?? null,
        meta_title: editingPost.meta_title ?? null,
        meta_description: editingPost.meta_description ?? null,
        custom_json_ld: parsedJsonLd,
        faq_data: validFaqItems as unknown as Json,
      };

      console.log("[BlogManager] savePost — atomic payload:", JSON.stringify(postData));

      if (editingPost.id) {
        await updatePost.mutateAsync({ id: editingPost.id, updates: postData });
      } else {
        await createPost.mutateAsync(postData);
      }
    } catch (error: any) {
      console.error("[BlogManager] savePost error:", error);
      if (error?.code === "23505") {
        toast.error("כותרת/כתובת URL זו כבר קיימת. נא לבחור כותרת אחרת.");
      } else {
        toast.error(error?.message || "שגיאה בשמירת המאמר");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingPost(null);
    setFaqItems([]);
    setJsonLdText("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Editor View
  if (isEditing && editingPost) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {editingPost.id ? "עריכת מאמר" : "מאמר חדש"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4 ml-2" />
              ביטול
            </Button>
            <Button onClick={savePost}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              שמור
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">תוכן</TabsTrigger>
            <TabsTrigger value="preview">תצוגה מקדימה</TabsTrigger>
            <TabsTrigger value="seo">SEO & AEO</TabsTrigger>
            <TabsTrigger value="settings">הגדרות</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת</Label>
              <Input
                id="title"
                value={editingPost.title || ""}
                onChange={(e) => setEditingPost((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="כותרת המאמר"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">כתובת URL (slug)</Label>
              <Input
                id="slug"
                value={editingPost.slug || ""}
                onChange={(e) => {
                  setEditingPost((prev) => ({ ...prev, slug: e.target.value }));
                }}
                onBlur={(e) => {
                  const sanitized = sanitizeBlogSlug(e.target.value);
                  setEditingPost((prev) => ({ ...prev, slug: sanitized }));
                }}
                placeholder="auto-generated-from-title"
                dir="ltr"
              />
              {(editingPost.slug || editingPost.title) && (
                <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                  Live URL: /blog/{sanitizeBlogSlug(editingPost.slug || editingPost.title || "")}
                </p>
              )}
            </div>

            {/* Featured Media Selector */}
            <BlogMediaSelector
              mediaUrl={editingPost.featured_image_url || null}
              mediaType={(editingPost.featured_media_type as MediaType) || "image"}
              onMediaChange={(url, type) => {
                setEditingPost((prev) => ({
                  ...prev,
                  featured_image_url: url,
                  featured_media_type: type,
                }));
              }}
              label="מדיה ראשית (תמונה או וידאו)"
            />

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <Label>תוכן המאמר</Label>
              <RichTextEditor
                content={editingPost.content || ""}
                onChange={(html) => setEditingPost((prev) => ({ ...prev, content: html }))}
                placeholder="התחל לכתוב את תוכן המאמר שלך..."
                onAIGenerate={async (type, selectedText) => {
                  const loadingKey = `ai-${type}`;
                  setAiLoading((prev) => ({ ...prev, [loadingKey]: true }));
                  
                  try {
                    let aiType = type;
                    // Map editor AI types to backend types
                    if (type === 'article') aiType = 'generate_article';
                    if (type === 'outline') aiType = 'generate_outline';
                    if (type === 'improve') aiType = 'improve_content';
                    if (type === 'expand') aiType = 'expand_text';
                    if (type === 'intro') aiType = 'write_intro';
                    if (type === 'conclusion') aiType = 'write_conclusion';
                    
                    const { data, error } = await supabase.functions.invoke("ai-seo", {
                      body: {
                        type: aiType,
                        title: editingPost?.title || "",
                        content: editingPost?.content || "",
                        topic: editingPost?.title || "",
                        selectedText: selectedText || "",
                        outputFormat: "html", // Request HTML output for RichTextEditor
                      },
                    });
                    
                    if (error) {
                      console.error("[BlogManager] AI inline error:", error);
                      throw new Error(typeof error === "object" && error.message ? error.message : "שגיאה בקריאה לשרת AI");
                    }
                    
                    if (!data?.result) {
                      throw new Error("תשובת AI ריקה – נא לנסות שוב");
                    }
                    
                    toast.success("תוכן AI נוצר בהצלחה!");
                    return data.result;
                  } catch (error: any) {
                    console.error("[BlogManager] AI content error:", error);
                    toast.error(error.message || "שגיאה ביצירת תוכן AI – ייתכן שהדפדפן חוסם את הבקשה");
                    return null;
                  } finally {
                    setAiLoading((prev) => ({ ...prev, [loadingKey]: false }));
                  }
                }}
                isAILoading={Object.values(aiLoading).some(Boolean)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">תקציר</Label>
              <div className="flex gap-2">
                <Textarea
                  id="excerpt"
                  value={editingPost.excerpt || ""}
                  onChange={(e) => setEditingPost((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="תקציר קצר של המאמר"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => generateAIContent("excerpt")}
                  disabled={aiLoading["ai-excerpt"] || !editingPost.content}
                  title="צור תקציר עם AI"
                >
                  {aiLoading["ai-excerpt"] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Live Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <BlogLivePreview
              title={editingPost.title || ""}
              content={editingPost.content || ""}
              featuredImageUrl={editingPost.featured_image_url}
              excerpt={editingPost.excerpt}
            />
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  אופטימיזציית SEO עם AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">כותרת מטא (SEO)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="meta_title"
                      value={editingPost.meta_title || ""}
                      onChange={(e) => setEditingPost((prev) => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="כותרת לתוצאות חיפוש"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => generateAIContent("meta_title")}
                      disabled={aiLoading["ai-meta_title"] || (!editingPost.title && !editingPost.content)}
                      title="צור כותרת מטא עם AI"
                    >
                      {aiLoading["ai-meta_title"] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(editingPost.meta_title?.length || 0)}/60 תווים
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">תיאור מטא (SEO)</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="meta_description"
                      value={editingPost.meta_description || ""}
                      onChange={(e) => setEditingPost((prev) => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="תיאור קצר לתוצאות חיפוש"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => generateAIContent("meta_description")}
                      disabled={aiLoading["ai-meta_description"] || (!editingPost.title && !editingPost.content)}
                      title="צור תיאור מטא עם AI"
                    >
                      {aiLoading["ai-meta_description"] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(editingPost.meta_description?.length || 0)}/160 תווים
                  </p>
                </div>

                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  💡 כלי AI פועלים גם על מאמרים חדשים - מספיק להזין כותרת או תוכן
                </p>
              </CardContent>
            </Card>

            {/* FAQ Builder for AEO */}
            <BlogFAQBuilder
              faqItems={faqItems}
              onChange={(items) => {
                setFaqItems(items);
                setEditingPost((prev) => (prev ? { ...prev, faq_data: items as unknown as Json } : prev));
              }}
              postTitle={editingPost.title}
              postContent={editingPost.content || ""}
            />

            {/* Custom JSON-LD Schema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5 text-primary" />
                  JSON-LD מותאם אישית (מתקדם)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom_json_ld">Structured Data (JSON-LD)</Label>
                  <Textarea
                    id="custom_json_ld"
                    value={jsonLdText}
                    onChange={(e) => setJsonLdText(e.target.value)}
                    onBlur={() => {
                      if (!jsonLdText.trim()) {
                        setEditingPost((prev) => (prev ? { ...prev, custom_json_ld: null } : prev));
                        return;
                      }
                      try {
                        const parsed = JSON.parse(jsonLdText) as Json;
                        if (isFaqPageSchema(parsed)) {
                          toast.error("FAQ Schema מנוהל כעת בנפרד לכל פוסט. השתמש בעורך השאלות למעלה.");
                          return;
                        }
                        setEditingPost((prev) => (prev ? { ...prev, custom_json_ld: parsed } : prev));
                      } catch {
                        toast.error("JSON לא תקין - תקן לפני שמירה");
                      }
                    }}
                    placeholder='{"@context": "https://schema.org", "@type": "BlogPosting", ...}'
                    className="font-mono text-xs min-h-[200px] ltr"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    FAQ נשמר בנפרד לכל מאמר ואינו מוזרק יותר דרך JSON-LD מותאם אישית.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>סטטוס פרסום</Label>
                    <p className="text-sm text-muted-foreground">
                      {editingPost.is_published ? "המאמר מפורסם וגלוי לציבור" : "המאמר במצב טיוטה"}
                    </p>
                  </div>
                  <Switch
                    checked={editingPost.is_published || false}
                    onCheckedChange={(checked) => setEditingPost((prev) => ({ 
                      ...prev, 
                      is_published: checked,
                      published_at: checked && !prev?.published_at ? new Date().toISOString() : prev?.published_at
                    }))}
                  />
                </div>

                {/* Publication Date Picker */}
                <div className="space-y-2">
                  <Label>תאריך פרסום</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !editingPost.published_at && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="ml-2 h-4 w-4" />
                        {editingPost.published_at ? (
                          format(new Date(editingPost.published_at), "dd בMMMM yyyy", { locale: he })
                        ) : (
                          <span>בחר תאריך פרסום</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingPost.published_at ? new Date(editingPost.published_at) : undefined}
                        onSelect={(date) => setEditingPost((prev) => ({ 
                          ...prev, 
                          published_at: date ? date.toISOString() : null 
                        }))}
                        initialFocus
                        locale={he}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    תאריך זה יוצג בעמוד הבלוג ובמאמר עצמו
                  </p>
                </div>

                {/* Created At Info (read-only) */}
                {editingPost.created_at && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">תאריך יצירה</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(editingPost.created_at), "dd בMMMM yyyy, HH:mm", { locale: he })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Article Generation Dialog */}
        <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-primary" />
                כתוב מאמר חדש עם AI
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>נושא המאמר</Label>
                <Input
                  placeholder="לדוגמה: איך לבחור טבעת אירוסין מושלמת"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  הזן נושא או כותרת - ה-AI יכתוב מאמר מקיף ומותאם SEO
                </p>
              </div>
              <Button 
                onClick={() => generateAIContent("generate_article", { topic: aiTopic })}
                disabled={!aiTopic.trim() || aiLoading["ai-generate_article"]}
                className="w-full"
              >
                {aiLoading["ai-generate_article"] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    כותב מאמר...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 ml-2" />
                    צור מאמר
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Outline Generation Dialog */}
        <Dialog open={showOutlineDialog} onOpenChange={setShowOutlineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListTree className="h-5 w-5 text-primary" />
                צור מבנה למאמר עם AI
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>נושא המאמר</Label>
                <Input
                  placeholder="לדוגמה: סוגי יהלומים וחיתוכים"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  הזן נושא - ה-AI ייצור מבנה מפורט עם כותרות משנה ונקודות
                </p>
              </div>
              <Button 
                onClick={() => generateAIContent("generate_outline", { topic: aiTopic })}
                disabled={!aiTopic.trim() || aiLoading["ai-generate_outline"]}
                className="w-full"
              >
                {aiLoading["ai-generate_outline"] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    יוצר מבנה...
                  </>
                ) : (
                  <>
                    <ListTree className="h-4 w-4 ml-2" />
                    צור מבנה
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Editor */}
        {editingImageUrl && (
          <ImageEditor
            imageUrl={editingImageUrl}
            isOpen={showImageEditor}
            onClose={() => {
              setShowImageEditor(false);
              setEditingImageUrl(null);
            }}
            onSave={(croppedImageUrl) => {
              insertImage(croppedImageUrl);
              setShowImageEditor(false);
              setEditingImageUrl(null);
            }}
          />
        )}
      </div>
    );
  }

  // List View
  if (!posts?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">אין מאמרים להצגה</p>
        <Button onClick={startNewPost}>
          <Plus className="h-4 w-4 ml-2" />
          צור מאמר חדש
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                {post.published_at 
                  ? format(new Date(post.published_at), "dd/MM/yyyy", { locale: he })
                  : format(new Date(post.created_at), "dd/MM/yyyy", { locale: he })}
              </p>
            </div>
            <Badge variant={post.is_published ? "default" : "secondary"}>
              {post.is_published ? "פורסם" : "טיוטה"}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  const quickPreviewSheet = (
    <Sheet open={!!quickPreviewPost} onOpenChange={(open) => !open && setQuickPreviewPost(null)}>
      <SheetContent side="left" className="w-full sm:max-w-2xl lg:max-w-4xl p-0 overflow-hidden">
        <SheetHeader className="p-4 border-b bg-background sticky top-0 z-10">
          <SheetTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="truncate">{quickPreviewPost?.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (quickPreviewPost) {
                    window.open(`/blog/${quickPreviewPost.slug}`, '_blank');
                  }
                }}
              >
                <Globe className="h-4 w-4 ml-1" />
                פתח באתר
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (quickPreviewPost) {
                    startEditPost(quickPreviewPost);
                    setQuickPreviewPost(null);
                  }
                }}
              >
                <Edit className="h-4 w-4 ml-1" />
                עריכה
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          {quickPreviewPost && (
            <BlogLivePreview
              title={quickPreviewPost.title}
              content={quickPreviewPost.content || ""}
              featuredImageUrl={quickPreviewPost.featured_image_url}
              excerpt={quickPreviewPost.excerpt}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={startNewPost}>
          <Plus className="h-4 w-4 ml-2" />
          מאמר חדש
        </Button>
      </div>

      {posts.map((post) => (
        <Card key={post.id} className={selectedPost === post.id ? "ring-2 ring-primary" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {post.published_at 
                      ? format(new Date(post.published_at), "dd בMMMM yyyy", { locale: he })
                      : format(new Date(post.created_at), "dd/MM/yyyy", { locale: he })}
                  </span>
                  <Badge variant={post.is_published ? "default" : "secondary"} className="flex items-center gap-1">
                    {post.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {post.is_published ? "פורסם" : "טיוטה"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickPreviewPost(post as BlogPost)}
                >
                  <Eye className="h-4 w-4 ml-1" />
                  תצוגה מקדימה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditPost(post)}
                >
                  <Edit className="h-4 w-4 ml-1" />
                  עריכה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                >
                  {selectedPost === post.id ? "סגור" : "פרטים"}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (confirm("האם למחוק את המאמר?")) {
                      deletePost.mutate(post.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {selectedPost === post.id && (
            <CardContent className="space-y-4">
              {post.featured_image_url && (
                <div>
                  <h4 className="font-medium text-sm mb-1">תמונה ראשית:</h4>
                  <img 
                    src={post.featured_image_url} 
                    alt="Featured" 
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm mb-1">תקציר:</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {post.excerpt || "אין תקציר"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">כותרת מטא (SEO):</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {post.meta_title || "לא הוגדר"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">תיאור מטא (SEO):</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {post.meta_description || "לא הוגדר"}
                </p>
              </div>

              {showAI && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    שיפור SEO באמצעות AI
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPost(post);
                        generateAIContent("meta_title");
                      }}
                      disabled={aiLoading["ai-meta_title"]}
                    >
                      {aiLoading["ai-meta_title"] ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 ml-1" />
                      )}
                      צור כותרת מטא
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPost(post);
                        generateAIContent("meta_description");
                      }}
                      disabled={aiLoading["ai-meta_description"]}
                    >
                      {aiLoading["ai-meta_description"] ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 ml-1" />
                      )}
                      צור תיאור מטא
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPost(post);
                        generateAIContent("excerpt");
                      }}
                      disabled={aiLoading["ai-excerpt"]}
                    >
                      {aiLoading["ai-excerpt"] ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 ml-1" />
                      )}
                      צור תקציר
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPost(post);
                        generateAIContent("improve_content");
                      }}
                      disabled={aiLoading["ai-improve_content"]}
                    >
                      {aiLoading["ai-improve_content"] ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 ml-1" />
                      )}
                      שפר תוכן ל-SEO
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
    {quickPreviewSheet}
    </>
  );
};

export default BlogManager;
