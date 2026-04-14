import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { HeroBlockData } from "../types";

interface HeroBlockProps {
  data: HeroBlockData;
}

/**
 * Full-width hero section with background image, overlay, and CTA.
 * Designed for high-impact page headers with Scandinavian luxury styling.
 */
const HeroBlock = memo(({ data }: HeroBlockProps) => {
  const {
    title,
    subtitle,
    background_image,
    cta_text,
    cta_url,
    overlay_opacity = 0.4,
    alignment = 'center',
  } = data;

  const alignmentClasses: Record<string, string> = {
    left: 'items-start text-right',
    center: 'items-center text-center',
    right: 'items-end text-left',
  };

  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] w-full overflow-hidden">
      {/* Background Image */}
      {background_image && (
        <img
          src={background_image}
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlay_opacity }}
      />

      {/* Content Container */}
      <div
        className={`
          relative z-10 flex flex-col justify-center
          min-h-[60vh] md:min-h-[70vh]
          px-6 md:px-12 lg:px-20
          ${alignmentClasses[alignment] || alignmentClasses.center}
        `}
      >
        <div className="max-w-3xl animate-fade-in">
          {/* Title */}
          <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl text-white font-normal tracking-wide mb-4">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg md:text-xl text-white/80 font-body font-light max-w-2xl mb-8">
              {subtitle}
            </p>
          )}

          {/* CTA Button */}
          {cta_text && cta_url && (
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white font-medium tracking-wider uppercase text-sm px-8 py-6 transition-all duration-300 hover:-translate-y-1"
            >
              <Link to={cta_url}>{cta_text}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
});

HeroBlock.displayName = "HeroBlock";
export default HeroBlock;
