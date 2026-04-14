import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Smartphone, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface BlogLivePreviewProps {
  title: string;
  content: string;
  featuredImageUrl?: string | null;
  excerpt?: string | null;
}

export const BlogLivePreview = ({
  title,
  content,
  featuredImageUrl,
  excerpt,
}: BlogLivePreviewProps) => {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const PreviewContent = () => (
    <div className={cn(
      "bg-white overflow-y-auto h-full",
      device === "mobile" ? "max-w-[375px] mx-auto" : ""
    )}>
      <article className={cn(
        "blog-container",
        device === "mobile" ? "px-4 py-6" : "px-12 py-12"
      )}>
        {/* Featured Image */}
        {featuredImageUrl && (
          <figure className="aspect-video overflow-hidden rounded-lg shadow-xl mb-10">
            <img
              src={featuredImageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </figure>
        )}

        {/* Article Header */}
        <header className="mb-10">
          <h1
            className={cn(
              "font-serif text-center mb-6",
              device === "mobile" ? "text-3xl" : "text-4xl md:text-5xl"
            )}
            style={{ color: "#856404", letterSpacing: "-0.02em" }}
          >
            {title || "כותרת המאמר"}
          </h1>

          {excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed text-center max-w-2xl mx-auto">
              {excerpt}
            </p>
          )}
        </header>

        {/* Article Content */}
        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || "<p>תוכן המאמר יופיע כאן...</p>") }}
        />
      </article>
    </div>
  );

  // Fullscreen modal
  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      >
        <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-gray-100 border-b px-4 py-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Button
                variant={device === "desktop" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDevice("desktop")}
              >
                <Monitor className="h-4 w-4 ml-1" />
                Desktop
              </Button>
              <Button
                variant={device === "mobile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDevice("mobile")}
              >
                <Smartphone className="h-4 w-4 ml-1" />
                Mobile
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Preview */}
          <div className="pt-12 h-full overflow-hidden">
            <div className={cn(
              "h-full overflow-y-auto transition-all duration-300",
              device === "mobile" 
                ? "max-w-[375px] mx-auto border-x shadow-xl" 
                : "w-full"
            )}>
              <PreviewContent />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDevice("desktop")}
            className="h-7 px-2 text-xs"
          >
            <Monitor className="h-3 w-3 ml-1" />
            Desktop
          </Button>
          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDevice("mobile")}
            className="h-7 px-2 text-xs"
          >
            <Smartphone className="h-3 w-3 ml-1" />
            Mobile
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="h-7 px-2 text-xs"
        >
          <Maximize2 className="h-3 w-3 ml-1" />
          מסך מלא
        </Button>
      </div>

      {/* Preview Frame */}
      <div className={cn(
        "border rounded-lg bg-white overflow-hidden transition-all duration-300",
        device === "mobile" 
          ? "max-w-[375px] mx-auto h-[600px]" 
          : "w-full h-[600px]"
      )}>
        <div className="h-full overflow-y-auto">
          <PreviewContent />
        </div>
      </div>
    </div>
  );
};

export default BlogLivePreview;
