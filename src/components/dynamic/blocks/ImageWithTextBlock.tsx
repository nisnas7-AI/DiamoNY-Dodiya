/* rebuild-trigger-v2 */
import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import type { ImageWithTextBlockData } from "../types";

interface ImageWithTextBlockProps {
  data: ImageWithTextBlockData;
}

/**
 * Two-column image + text layout with luxury magazine styling.
 * Supports image_left, image_right, and overlay layouts.
 */
const ImageWithTextBlock = memo(({ data }: ImageWithTextBlockProps) => {
  const {
    image_url,
    alt_text,
    title,
    content,
    layout = 'image_left',
    cta_text,
    cta_url,
  } = data;

  const isImageFirst = layout === 'image_left';
  const isOverlay = layout === 'overlay';

  const imageElement = useMemo(
    () => (
      <div className={`relative ${isOverlay ? 'absolute inset-0' : 'overflow-hidden rounded-lg'}`}>
        <div className={isOverlay ? 'w-full h-full' : 'aspect-[4/3]'}>
          <img
            src={image_url}
            alt={alt_text || title || ''}
            width={800}
            height={600}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        {isOverlay && <div className="absolute inset-0 bg-black/40" />}
      </div>
    ),
    [image_url, alt_text, title, isOverlay]
  );

  const textElement = useMemo(
    () => (
      <div
        className={`
          flex flex-col justify-center
          ${isOverlay
            ? 'relative z-10 text-white p-8 md:p-12 lg:p-16 bg-black/50 backdrop-blur-lg rounded-lg max-w-xl mx-auto'
            : 'py-4 md:py-0'
          }
        `}
      >
        {title && (
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-normal tracking-wide mb-6 text-foreground">
            {title}
          </h2>
        )}

        {content && (
          <div className={`font-body ${isOverlay ? 'text-white/90' : 'text-foreground/75'} mb-8 prose prose-lg max-w-none leading-relaxed`}>
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className={`${isOverlay ? 'text-white/90' : 'text-foreground/75'} leading-relaxed mb-4 text-base md:text-lg`}>
                    {children}
                  </p>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {cta_text && cta_url && (
          <Button
            asChild
            variant={isOverlay ? 'secondary' : 'default'}
            className={`
              self-start font-medium tracking-wider uppercase text-sm px-8 py-6
              transition-all duration-300 hover:-translate-y-0.5
              ${isOverlay
                ? 'bg-white text-foreground hover:bg-white/90'
                : 'bg-accent hover:bg-accent/90 text-white'
              }
            `}
          >
            <Link to={cta_url}>{cta_text}</Link>
          </Button>
        )}
      </div>
    ),
    [title, content, cta_text, cta_url, isOverlay]
  );

  if (isOverlay) {
    return (
      <div className="relative min-h-[50vh] md:min-h-[60vh]">
        {imageElement}
        <div className="relative z-10 container mx-auto px-6 flex items-center justify-center min-h-[50vh] md:min-h-[60vh]">
          {textElement}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        {isImageFirst ? (
          <>
            {imageElement}
            {textElement}
          </>
        ) : (
          <>
            {textElement}
            {imageElement}
          </>
        )}
      </div>
    </div>
  );
});

ImageWithTextBlock.displayName = "ImageWithTextBlock";
export default ImageWithTextBlock;
