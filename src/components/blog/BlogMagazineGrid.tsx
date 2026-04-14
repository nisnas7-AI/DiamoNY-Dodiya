import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, ArrowLeft, Clock, ChevronDown, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { stripHtmlTags } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_media_type?: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string;
  source?: "blog" | "page";
}

const getPostUrl = (post: BlogPost) =>
  post.source === "page" ? `/${post.slug}` : `/blog/${post.slug}`;

// Check if URL is a video embed (YouTube/Vimeo)
const isEmbedVideo = (url: string): boolean => {
  return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo");
};

interface BlogMagazineGridProps {
  posts: BlogPost[];
}

// Calculate reading time
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content?.split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Extract category from content (based on keywords)
const extractCategory = (content: string, title: string): string => {
  const combined = (title + " " + content).toLowerCase();
  
  if (combined.includes("טבעת אירוסין") || combined.includes("אירוסין")) return "אירוסין";
  if (combined.includes("יהלום") || combined.includes("יהלומים")) return "יהלומים";
  if (combined.includes("זהב")) return "זהב";
  if (combined.includes("מדריך") || combined.includes("איך")) return "מדריכים";
  if (combined.includes("טרנד") || combined.includes("אופנה")) return "טרנדים";
  if (combined.includes("טיפ")) return "טיפים";
  
  return "כללי";
};

export const BlogMagazineGrid = ({ posts }: BlogMagazineGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Get unique categories
  const categories = Array.from(
    new Set(posts.map((post) => extractCategory(post.content || "", post.title)))
  );

  // Filter and sort posts
  const filteredPosts = posts
    .filter((post) => 
      !selectedCategory || extractCategory(post.content || "", post.title) === selectedCategory
    )
    .sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  // Split into featured (first post) and regular posts
  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/30">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            הכל
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 ml-2" />
              {sortOrder === "newest" ? "החדשים ביותר" : "הישנים ביותר"}
              <ChevronDown className="h-3 w-3 mr-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOrder("newest")}>
              החדשים ביותר
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
              הישנים ביותר
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          אין מאמרים בקטגוריה זו
        </div>
      ) : (
        <>
          {/* Featured Post (Large) */}
          {featuredPost && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Link to={getPostUrl(featuredPost)} className="block">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Media */}
                  <div className="aspect-[4/3] overflow-hidden rounded-xl shadow-xl group-hover:shadow-2xl transition-shadow relative">
                    {featuredPost.featured_image_url ? (
                      featuredPost.featured_media_type === "video" && !isEmbedVideo(featuredPost.featured_image_url) ? (
                        <video
                          src={featuredPost.featured_image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          muted
                          autoPlay
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={featuredPost.featured_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          width={800}
                          height={450}
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        <span className="text-8xl opacity-20">💎</span>
                      </div>
                    )}
                    {featuredPost.featured_media_type === "video" && (
                      <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <span>▶</span> וידאו
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                        {extractCategory(featuredPost.content || "", featuredPost.title)}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(featuredPost.published_at || featuredPost.created_at), "dd MMMM yyyy", { locale: he })}
                      </span>
                    </div>

                    <h2 className="font-heading text-3xl md:text-4xl font-light text-foreground group-hover:text-accent transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>

                    <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">
                      {featuredPost.excerpt || stripHtmlTags(featuredPost.content || "").substring(0, 200) + "..."}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {calculateReadingTime(featuredPost.content || "")} דקות קריאה
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all">
                      קרא עוד
                      <ArrowLeft className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          )}

          {/* Divider */}
          {regularPosts.length > 0 && (
            <div className="border-t border-border/30 pt-8" />
          )}

          {/* Regular Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link to={getPostUrl(post)} className="block">
                  {/* Media with Floating Frame Effect */}
                  <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 mb-5 relative">
                    {post.featured_image_url ? (
                      post.featured_media_type === "video" && !isEmbedVideo(post.featured_image_url) ? (
                        <video
                          src={post.featured_image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      ) : (
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          width={400}
                          height={300}
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        <span className="text-6xl opacity-20">💎</span>
                      </div>
                    )}
                    {post.featured_media_type === "video" && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
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
                      {format(new Date(post.published_at || post.created_at), "dd MMM yyyy", { locale: he })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading text-xl font-light text-foreground group-hover:text-accent transition-colors mb-3 line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt || stripHtmlTags(post.content || "").substring(0, 120) + "..."}
                  </p>

                  {/* Read More */}
                  <span className="inline-flex items-center gap-2 text-sm text-accent font-medium group-hover:gap-3 transition-all">
                    קרא עוד
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </Link>
              </motion.article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BlogMagazineGrid;
