import { motion } from "framer-motion";

interface StorySpec {
  label: string;
  value: string;
}

interface StoryImage {
  url: string;
  alt_text: string;
  linked_section: string;
}

interface ProductStory {
  title: string;
  specs: StorySpec[] | null;
  pull_quote: string | null;
  story_part_1: string | null;
  story_part_2: string | null;
  story_images: StoryImage[] | null;
}

interface Props {
  story: ProductStory;
  productName: string;
}

const replacePlaceholder = (text: string, name: string) =>
  text.replace(/\{\{product_name\}\}/g, name);

const ProductStoryEditorial = ({ story, productName }: Props) => {
  const specs = story.specs || [];
  const images = story.story_images || [];
  const part1Image = images.find((img) => img.linked_section === "part1") || images[0];
  const part2Image = images.find((img) => img.linked_section === "part2") || images[1];

  return (
    <article className="mb-8 space-y-0" dir="rtl">
      {/* ── Specs Grid ── */}
      {specs.length > 0 && (
        <section className="py-8 border-t border-border/40">
          <h3 className="font-heading text-base font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-5">
            מפרט טכני
          </h3>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
            {specs.map((spec, i) => (
              <div key={i}>
                <dt className="text-xs text-muted-foreground tracking-wide uppercase mb-0.5">
                  {spec.label}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ── Part 1 + Image — Asymmetric ── */}
      {story.story_part_1 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="py-8 border-t border-border/20"
        >
          <div className={`grid gap-8 items-start ${part1Image ? "md:grid-cols-[1fr_0.8fr]" : ""}`}>
            <div>
              <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground mb-4">
                {story.title || "הסיפור שלנו"}
              </h3>
              <p className="text-sm md:text-[15px] text-muted-foreground leading-[1.85] whitespace-pre-line font-normal">
                {replacePlaceholder(story.story_part_1, productName)}
              </p>
            </div>
            {part1Image && (
              <div className="rounded-2xl overflow-hidden bg-muted aspect-[4/5] shadow-sm">
                <img
                  src={part1Image.url}
                  alt={part1Image.alt_text || productName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* ── Pull Quote — Full Width Break ── */}
      {story.pull_quote && (
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="py-10 md:py-14 border-y border-accent/30 my-2 text-center"
        >
          <p className="font-heading text-xl md:text-2xl lg:text-[1.75rem] text-foreground leading-[1.5] font-normal italic max-w-2xl mx-auto px-4">
            "{replacePlaceholder(story.pull_quote, productName)}"
          </p>
        </motion.blockquote>
      )}

      {/* ── Part 2 + Image — Reversed Asymmetric ── */}
      {story.story_part_2 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="py-8"
        >
          <div className={`grid gap-8 items-start ${part2Image ? "md:grid-cols-[0.8fr_1fr]" : ""}`}>
            {part2Image && (
              <div className="rounded-2xl overflow-hidden bg-muted aspect-[4/5] shadow-sm order-2 md:order-1">
                <img
                  src={part2Image.url}
                  alt={part2Image.alt_text || productName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="order-1 md:order-2">
              <p className="text-sm md:text-[15px] text-muted-foreground leading-[1.85] whitespace-pre-line font-normal">
                {replacePlaceholder(story.story_part_2, productName)}
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </article>
  );
};

export default ProductStoryEditorial;
