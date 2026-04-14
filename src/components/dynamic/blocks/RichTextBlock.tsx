/* rebuild-trigger-v2 */
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { sanitizeHtml } from "@/lib/sanitize";
import type { RichTextBlockData } from "../types";

interface RichTextBlockProps {
  data: RichTextBlockData;
}

/**
 * Rich text block supporting Markdown and sanitized HTML.
 * Uses brand typography with optimal reading width.
 */
const RichTextBlock = memo(({ data }: RichTextBlockProps) => {
  const { content, max_width = 'medium', text_align = 'right' } = data;

  const maxWidthClasses: Record<string, string> = {
    narrow: 'max-w-2xl',
    medium: 'max-w-3xl',
    full: 'max-w-5xl',
  };

  const textAlignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const isHtml = useMemo(() => /<[a-z][\s\S]*>/i.test(content), [content]);

  const sanitizedContent = useMemo(() => {
    return isHtml ? sanitizeHtml(content) : content;
  }, [content, isHtml]);

  const proseClasses = `
    prose prose-lg md:prose-xl max-w-none
    prose-headings:font-heading prose-headings:font-normal prose-headings:tracking-wide prose-headings:text-foreground prose-headings:mb-6
    prose-p:font-body prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-6
    prose-a:text-accent prose-a:no-underline hover:prose-a:underline
    prose-strong:text-foreground
    prose-blockquote:border-accent prose-blockquote:text-muted-foreground prose-blockquote:italic
    prose-li:text-foreground/80 prose-li:leading-relaxed
  `;

  return (
    <div className="px-6 md:px-12">
      <div
        className={`
          mx-auto
          ${maxWidthClasses[max_width] || maxWidthClasses.medium}
          ${textAlignClasses[text_align] || textAlignClasses.right}
        `}
      >
        {isHtml ? (
          <div
            className={proseClasses}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        ) : (
          <div className={proseClasses}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h2 className="font-heading text-2xl md:text-4xl font-normal tracking-wide mb-8 text-foreground">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="font-heading text-xl md:text-2xl font-normal tracking-wide mb-6 text-foreground">
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="font-heading text-lg md:text-xl font-normal tracking-wide mb-4 text-foreground">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-foreground/80 leading-relaxed mb-6 text-base md:text-lg">
                    {children}
                  </p>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-accent hover:underline transition-colors"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

RichTextBlock.displayName = "RichTextBlock";
export default RichTextBlock;
