import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips HTML tags from content and returns clean text
 * Useful for blog card previews and excerpts
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return "";
  // Create a temporary element to leverage browser's HTML parsing
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  // Get text content and normalize whitespace
  return (tempDiv.textContent || tempDiv.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
};
