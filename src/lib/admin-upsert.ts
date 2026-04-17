import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";

type SiteContentUpsertInput = {
  key: string;
  title?: string | null;
  content?: string | null;
  is_active?: boolean | null;
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  signal?: AbortSignal;
};

export const sanitizePlainText = (value: string): string =>
  value.replace(/\u0000/g, "").replace(/[\u2028\u2029]/g, " ").trim();

export const sanitizeFreeText = (value: string): string => value.replace(/\u0000/g, "").replace(/[\u2028\u2029]/g, " ");

export const sanitizeOptionalText = (value?: string | null): string => sanitizeFreeText(value ?? "");

export const stripScriptLikeTags = (value?: string | null): string => {
  const cleaned = sanitizeFreeText(value ?? "");

  if (!cleaned.trim()) {
    return "";
  }

  return cleaned
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "$1")
    .replace(/<\/??script\b[^>]*>/gi, "")
    .replace(/<helmet\b[^>]*>([\s\S]*?)<\/helmet>/gi, "$1")
    .replace(/<\/??helmet\b[^>]*>/gi, "")
    .trim();
};

export const normalizeJsonString = (value?: string | null): string => {
  const cleaned = stripScriptLikeTags(value);

  if (!cleaned) {
    return "";
  }

  try {
    const parsed = JSON.parse(cleaned);
    return JSON.stringify(parsed);
  } catch {
    throw new Error("יש להזין JSON-LD תקין בפורמט JSON בלבד, ללא תגיות script או helmet");
  }
};

export const serializeFaqItems = <T extends { question?: string; answer?: string }>(items: T[]): string =>
  JSON.stringify(
    items
      .map((item) => ({
        question: sanitizePlainText(item.question ?? ""),
        answer: sanitizeFreeText(item.answer ?? ""),
      }))
      .filter((item) => item.question || item.answer),
  );

export const parseFaqItems = <T>(value: unknown, fallback: T): T => {
  if (Array.isArray(value)) {
    return value as T;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export async function upsertSiteContentByKey({
  key,
  title,
  content,
  is_active = true,
  image_url = null,
  metadata = {},
  signal,
}: SiteContentUpsertInput) {
  const request = supabase
    .from("site_content")
    .upsert(
      [
        {
          brand_id: getBrandId(),
          key,
          title,
          content,
          is_active,
          image_url,
          metadata: (metadata ?? {}) as any,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "brand_id,key" },
    )
    .select("id")
    .single() as any;

  const { data, error } = signal ? await request.abortSignal(signal) : await request;

  console.log("SUPABASE_RESPONSE:", data, error);

  if (error) {
    throw error;
  }

  return data;
}