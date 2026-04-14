import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { stripHtmlTags } from "@/lib/utils";
import blog1 from "@/assets/blog-1.jpg";
import blog2 from "@/assets/blog-2.jpg";
import blog3 from "@/assets/blog-3.jpg";

// Fallback posts for when DB is empty
const fallbackPosts = [
  {
    id: "1",
    title: "איך בוחרים טבעת אירוסין?",
    excerpt: "המדריך המלא לבחירת טבעת האירוסין המושלמת – מהתקציב ועד לעיצוב.",
    published_at: "2025-11-15",
    featured_image_url: blog1,
    featured_media_type: "image" as const,
    slug: "how-to-choose-engagement-ring",
    content: "",
  },
  {
    id: "2",
    title: "ההבדל בין זהב 14K ל-18K",
    excerpt: "כל מה שצריך לדעת על סוגי הזהב השונים ומה מתאים לכם.",
    published_at: "2025-11-10",
    featured_image_url: blog2,
    featured_media_type: "image" as const,
    slug: "14k-vs-18k-gold",
    content: "",
  },
  {
    id: "3",
    title: "טרנדים בתכשיטים ל-2025",
    excerpt: "הצצה לעולם התכשיטים של השנה הבאה – מה יהיה חם ומה יוצא מהאופנה.",
    published_at: "2025-11-05",
    featured_image_url: blog3,
    featured_media_type: "image" as const,
    slug: "jewelry-trends-2025",
    content: "",
  },
];

// Extract category from content
const extractCategory = (content: string, title: string): string => {
  const combined = (title + " " + content).toLowerCase();
  if (combined.includes("טבעת אירוסין") || combined.includes("אירוסין")) return "אירוסין";
  if (combined.includes("יהלום") || combined.includes("יהלומים")) return "יהלומים";
  if (combined.includes("זהב")) return "זהב";
  if (combined.includes("מדריך") || combined.includes("איך")) return "מדריכים";
  if (combined.includes("טרנד") || combined.includes("אופנה")) return "טרנדים";
  return "מדריכים";
};

// Calculate reading time
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content?.split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

const BlogPreview = () => {
  const { data: dbPosts } = useQuery({
    queryKey: ["homepage-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const posts = dbPosts && dbPosts.length > 0 ? dbPosts : fallbackPosts;

  return (
    <section id="blog" className="px-4 md:px-8 py-10 md:py-14 lg:py-16 bg-background">
      <div className="container-luxury">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <span className="text-accent font-light text-sm tracking-[0.25em] uppercase mb-2 block">
              DIAMONY JOURNAL
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-light">
              מגזין התכשיטים
            </h2>
          </div>
          <Link
            to="/blog"
            className="hidden md:inline-flex items-center gap-2 text-foreground hover:text-accent transition-colors link-underline font-medium"
          >
            לכל המאמרים
          </Link>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
              className="group blog-card-premium"
            >
              <Link to={`/blog/${post.slug}`} className="block">
                {/* Featured Media with Floating Frame */}
                <div 
                  className="aspect-[4/3] overflow-hidden mb-5 relative"
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.4s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                  }}
                >
                  {post.featured_media_type === "video" ? (
                    <video
                      src={post.featured_image_url || ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ borderRadius: '12px' }}
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.featured_image_url || blog1}
                      alt={post.title}
                      width={600}
                      height={450}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ borderRadius: '12px' }}
                      loading="lazy"
                    />
                  )}
                  {post.featured_media_type === "video" && (
                    <div 
                      className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 text-xs flex items-center gap-1"
                      style={{ borderRadius: '6px' }}
                    >
                      <span>▶</span> וידאו
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs mb-3">
                  <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                    {extractCategory(post.content || "", post.title)}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.published_at
                      ? format(new Date(post.published_at), "dd MMM", { locale: he })
                      : ""}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {calculateReadingTime(post.content || "")} דק׳
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-heading text-xl font-light mb-2 group-hover:text-accent transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                  {post.excerpt || stripHtmlTags(post.content || "").substring(0, 100) + "..."}
                </p>

                {/* Read More */}
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent hover:gap-3 transition-all">
                  קרא עוד
                  <ArrowLeft className="w-4 h-4" />
                </span>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Mobile Link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-accent font-medium"
          >
            לכל המאמרים
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
