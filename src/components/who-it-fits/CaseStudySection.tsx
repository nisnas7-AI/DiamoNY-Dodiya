import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface SpecItem {
  label: string;
  value: string;
}

interface StoryImage {
  url: string;
  linked_section: "part_1" | "part_2";
}

const CaseStudySection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["case-study-data"],
    queryFn: async () => {
      const keys = [
        "case-study-client",
        "case-study-result-image",
        "case-study-editorial",
      ];
      const { data, error } = await supabase
        .from("site_content")
        .select("key, content, metadata")
        .in("key", keys);

      if (error) throw error;

      const map: Record<string, { content: string | null; metadata: Record<string, unknown> | null }> = {};
      for (const row of data || []) {
        map[row.key] = { content: row.content, metadata: row.metadata as Record<string, unknown> | null };
      }
      return map;
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-full max-w-lg mx-auto" />
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </section>
    );
  }

  const clientName = data?.["case-study-client"]?.content || "";

  // Editorial data
  const editorial = data?.["case-study-editorial"]?.metadata as {
    specs?: SpecItem[];
    pull_quote?: string;
    story_part_1?: string;
    story_part_2?: string;
    story_images?: StoryImage[];
  } | null;

  const specs = editorial?.specs || [];
  const storyPart1 = editorial?.story_part_1 || "";
  const storyPart2 = editorial?.story_part_2 || "";
  const storyImages = editorial?.story_images || [];

  // Result image
  const resultImageMeta = data?.["case-study-result-image"]?.metadata as { image_url?: string } | null;
  const resultImageUrl = resultImageMeta?.image_url || "";

  const hasEditorial = storyPart1 || storyPart2 || specs.length > 0;

  if (!clientName && !hasEditorial) return null;

  const part1Image = storyImages.find((img) => img.linked_section === "part_1")?.url;
  const part2Image = storyImages.find((img) => img.linked_section === "part_2")?.url;

  return (
    <section className="py-10 md:py-14 px-4 bg-card/50">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 tracking-tight italic">
            תיאור מקרה: מהשראה לתכשיט מוגמר
          </h2>
          {clientName && (
            <p className="font-body text-base md:text-lg text-muted-foreground/80 italic mb-6">{clientName}</p>
          )}
        </motion.div>

        {/* ── EDITORIAL LAYOUT ── */}
        {hasEditorial && (
          <div className="space-y-10 md:space-y-16 mb-10 md:mb-14">
            {/* Specs Grid */}
            {specs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto"
              >
                {specs.map((spec, i) => (
                  <div key={i} className="text-center space-y-1">
                    <span className="block font-body text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {spec.label}
                    </span>
                    <span className="block font-heading text-sm md:text-base font-semibold text-foreground">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Story Part 1 + Image — asymmetric */}
            {storyPart1 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-[1fr_0.8fr] gap-10 md:gap-14 items-center"
              >
                <div className="order-2 md:order-1 max-w-3xl">
                  <p className="font-body text-sm md:text-[15px] text-muted-foreground/90 leading-[2] text-right whitespace-pre-line tracking-wide">
                    {storyPart1}
                  </p>
                </div>
                {part1Image && (
                  <div className="order-1 md:order-2">
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border/40 aspect-[4/5]">
                      <img
                        src={part1Image}
                        alt="השראה ותהליך עיצוב התכשיט"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Story Part 2 + Image — reversed asymmetric */}
            {storyPart2 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-[0.8fr_1fr] gap-10 md:gap-14 items-center"
              >
                {part2Image && (
                  <div>
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border/40 aspect-[4/5]">
                      <img
                        src={part2Image}
                        alt="התוצאה הסופית — תכשיט מוגמר"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
                <div className="max-w-3xl">
                  <p className="font-body text-sm md:text-[15px] text-muted-foreground/90 leading-[2] text-right whitespace-pre-line tracking-wide">
                    {storyPart2}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}


        {/* Result Image */}
        {resultImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden shadow-sm border border-border/40"
          >
            <img
              src={resultImageUrl}
              alt="התוצאה הסופית — תכשיט מוגמר"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CaseStudySection;
