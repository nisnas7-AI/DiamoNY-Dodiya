import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
}

interface MigrationResult {
  storiesCreated: number;
  productsLinked: number;
  duplicatesFound: number;
  details: string[];
}

// Simple hash function for deduplication
function hashDescription(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Extract title from description
function extractTitle(description: string, productName: string): string {
  // Try to get first sentence
  const firstSentence = description.split(/[.!?]/)[0]?.trim();
  
  // If first sentence is reasonable length, use it
  if (firstSentence && firstSentence.length > 3 && firstSentence.length < 60) {
    return firstSentence;
  }
  
  // Otherwise use product name
  return productName;
}

// Map category to story category
function mapCategory(categoryId: string | null): string | null {
  // We'll let the story inherit the general category type
  return categoryId ? 'jewelry' : null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result: MigrationResult = {
      storiesCreated: 0,
      productsLinked: 0,
      duplicatesFound: 0,
      details: []
    };

    // 1. Fetch all products with descriptions that don't have a story linked
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, description, category_id')
      .not('description', 'is', null)
      .is('product_story_id', null);

    if (fetchError) throw fetchError;

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No products to migrate',
          result 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    result.details.push(`Found ${products.length} products to migrate`);

    // 2. Group products by description hash for deduplication
    const descriptionGroups = new Map<string, Product[]>();
    
    for (const product of products) {
      if (!product.description) continue;
      
      const hash = hashDescription(product.description);
      if (!descriptionGroups.has(hash)) {
        descriptionGroups.set(hash, []);
      }
      descriptionGroups.get(hash)!.push(product as Product);
    }

    result.details.push(`Found ${descriptionGroups.size} unique descriptions`);
    result.duplicatesFound = products.length - descriptionGroups.size;

    // 3. Create stories and link products
    for (const [hash, groupProducts] of descriptionGroups) {
      const firstProduct = groupProducts[0];
      const description = firstProduct.description!;
      
      // Extract title
      const title = extractTitle(description, firstProduct.name);
      const category = mapCategory(firstProduct.category_id);

      // Create the story
      const { data: story, error: createError } = await supabase
        .from('product_stories')
        .insert({
          title,
          content_body: description,
          category,
          ai_prompt_context: `Story for: ${title}`
        })
        .select()
        .single();

      if (createError) {
        result.details.push(`Error creating story for "${title}": ${createError.message}`);
        continue;
      }

      result.storiesCreated++;
      result.details.push(`Created story: "${title}" (ID: ${story.id})`);

      // Link all products in this group to the story
      const productIds = groupProducts.map(p => p.id);
      const { error: updateError } = await supabase
        .from('products')
        .update({ product_story_id: story.id })
        .in('id', productIds);

      if (updateError) {
        result.details.push(`Error linking products to story "${title}": ${updateError.message}`);
        continue;
      }

      result.productsLinked += productIds.length;
      result.details.push(`Linked ${productIds.length} products to story "${title}"`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Migration complete: ${result.storiesCreated} stories created, ${result.productsLinked} products linked`,
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
