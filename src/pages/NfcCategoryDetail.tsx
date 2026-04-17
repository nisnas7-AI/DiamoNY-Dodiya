import { useState, useEffect } from "react";
import { SITE_URL } from "@/lib/siteConfig";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { getBrandId } from "@/lib/brandId";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import diamonyIcon from "@/assets/diamony-brand-icon.png";

interface Product {
  id: string;
  name: string;
  slug: string;
  main_image_url: string | null;
  price: number | null;
  price_from: number | null;
  price_to: number | null;
  is_price_range: boolean | null;
  short_description: string | null;
}

const NfcCategoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetch = async () => {
      // First find the NFC card or category by slug
      const { data: cat } = await supabase
        .from("categories")
        .select("id, name")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (cat) {
        setCategoryName(cat.name);

        // Get products + child category products
        const { data: childCats } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", cat.id)
          .eq("is_active", true);

        const categoryIds = [cat.id, ...(childCats?.map((c) => c.id) || [])];

        const { data: prods } = await supabase
          .from("products")
          .select("id, name, slug, main_image_url, price, price_from, price_to, is_price_range, short_description")
          .in("category_id", categoryIds)
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(50);

        setProducts(prods || []);
      } else {
        // Fallback: try to decode title from slug
        setCategoryName(decodeURIComponent(slug));
      }
      setLoading(false);
    };

    fetch();
  }, [slug]);

  const formatPrice = (p: Product) => {
    if (p.is_price_range && p.price_from) {
      return `₪${p.price_from.toLocaleString()}${p.price_to ? ` - ₪${p.price_to.toLocaleString()}` : "+"}`;
    }
    if (p.price) return `₪${p.price.toLocaleString()}`;
    return "צור קשר לתמחיר";
  };

  const whatsappLink = (product: Product) => {
    const msg = encodeURIComponent(
      `שלום, אשמח לשמוע פרטים על: ${product.name}\n${SITE_URL}/product/${product.slug}`
    );
    return `https://wa.me/972544714727?text=${msg}`;
  };

  return (
    <>
      <Helmet>
        <title>{categoryName ? `${categoryName} | DiamoNY` : "קטלוג תכשיטים | DiamoNY"}</title>
        <meta
          name="description"
          content={`${categoryName} – קולקציית תכשיטים מעוצבים בהתאמה אישית מבית DiamoNY. צפו בקטלוג ובחרו את התכשיט המושלם.`}
        />
        <meta name="geo.region" content="IL" />
        <meta name="geo.placename" content="Ashkelon" />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link
              to="/nfc-catalog"
              className="flex items-center gap-1 text-[#c9a96e] text-sm font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Link>
            <div className="flex-1 text-center">
              <img src={diamonyIcon} alt="DiamoNY" className="w-8 h-8 mx-auto rounded-full" />
            </div>
            <div className="w-14" /> {/* Balance spacer */}
          </div>
        </header>

        {/* Title */}
        <div className="px-4 pt-6 pb-4 text-center">
          <h1 className="text-xl font-bold text-[#c9a96e]">{categoryName}</h1>
        </div>

        {/* Products Grid */}
        <section className="px-3 pb-12">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl bg-white/5" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <p>אין מוצרים בקטגוריה זו כרגע</p>
              <Link to="/nfc-catalog" className="text-[#c9a96e] text-sm mt-2 inline-block">
                חזרה לקטלוג
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="relative rounded-xl overflow-hidden shadow-lg bg-[#111] group"
                >
                  <Link to={`/product/${product.slug}`} className="block">
                    <div className="aspect-[3/4] relative">
                      {product.main_image_url ? (
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  </Link>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#c9a96e] font-medium mb-2">
                      {formatPrice(product)}
                    </p>
                    <a
                      href={whatsappLink(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#25D366] text-white text-xs font-bold transition-opacity hover:opacity-90"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      שלח הודעה
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default NfcCategoryDetail;
