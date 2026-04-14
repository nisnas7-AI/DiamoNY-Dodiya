import { z } from "zod";

// Hero block data
export const heroBlockDataSchema = z.object({
  title: z.string().min(1, "Hero title is required"),
  subtitle: z.string().optional(),
  background_image: z.string().optional(),
  cta_text: z.string().optional(),
  cta_url: z.string().optional(),
  overlay_opacity: z.number().min(0).max(1).optional(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
});

// Rich text block data
export const richTextBlockDataSchema = z.object({
  content: z.string().min(1, "Content is required"),
  max_width: z.enum(['narrow', 'medium', 'full']).optional(),
  text_align: z.enum(['left', 'center', 'right']).optional(),
});

// Image with text block data
export const imageWithTextBlockDataSchema = z.object({
  image_url: z.string().min(1, "Image URL is required"),
  alt_text: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  layout: z.enum(['image_left', 'image_right', 'overlay']).optional(),
  cta_text: z.string().optional(),
  cta_url: z.string().optional(),
});

// Product grid block data
export const productGridBlockDataSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  product_ids: z.array(z.string().uuid()).optional(),
  category_slug: z.string().optional(),
  limit: z.number().int().positive().max(24).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
});

// Spacer block data
export const spacerBlockDataSchema = z.object({
  height: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
});

// FAQ block data
export const faqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const faqBlockDataSchema = z.object({
  title: z.string().optional(),
  items: z.array(faqItemSchema).min(1, "At least one FAQ item is required"),
});

// Product links block data
export const productLinksBlockDataSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  product_ids: z.array(z.string().uuid()).min(1, "At least one product is required"),
});

// Discriminated union for all block types
export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().optional(),
    type: z.literal('hero'),
    data: heroBlockDataSchema,
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('rich_text'),
    data: richTextBlockDataSchema,
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('image_with_text'),
    data: imageWithTextBlockDataSchema,
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('product_grid'),
    data: productGridBlockDataSchema,
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('spacer'),
    data: spacerBlockDataSchema,
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('faq'),
    data: faqBlockDataSchema,
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal('product_links'),
    data: productLinksBlockDataSchema,
  }),
]);

// Content blocks schema
export const contentBlocksSchema = z.object({
  blocks: z.array(blockSchema),
});

// Validation helper function
export function validateContentBlocks(data: unknown) {
  const result = contentBlocksSchema.safeParse(data);
  
  if (!result.success) {
    console.warn("Content blocks validation failed:", result.error.flatten());
    return {
      success: false as const,
      errors: result.error.flatten(),
      data: null,
    };
  }
  
  return {
    success: true as const,
    errors: null,
    data: result.data,
  };
}

// Type exports inferred from Zod
export type ValidatedContentBlocks = z.infer<typeof contentBlocksSchema>;
export type ValidatedBlock = z.infer<typeof blockSchema>;
