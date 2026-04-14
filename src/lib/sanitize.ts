import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify with a whitelist of safe HTML elements and attributes.
 * 
 * @param dirty - The potentially unsafe HTML string
 * @returns A sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Text formatting
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'sub', 'sup',
      // Links
      'a',
      // Lists
      'ul', 'ol', 'li',
      // Quotes and code
      'blockquote', 'pre', 'code',
      // Media (iframe removed to prevent clickjacking)
      'img', 'figure', 'figcaption', 'video', 'source',
      // Structure
      'hr', 'div', 'span', 'section', 'article',
      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    ],
    ALLOWED_ATTR: [
      // Removed 'style' to prevent CSS injection attacks
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'width', 'height', 'colspan', 'rowspan',
      'type', 'controls', 'autoplay', 'muted', 'loop', 'poster',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    SANITIZE_DOM: true, // Prevent DOM clobbering attacks
  });
};
