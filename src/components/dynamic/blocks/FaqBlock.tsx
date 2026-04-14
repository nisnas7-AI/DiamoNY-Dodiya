/* rebuild-trigger-v2 */
import { memo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqBlockData } from "../types";

interface FaqBlockProps {
  data: FaqBlockData;
}

/**
 * FAQ / Accordion block optimized for AEO.
 * Minimalist luxury design with thin dividers and generous spacing.
 */
const FaqBlock = memo(({ data }: FaqBlockProps) => {
  const { title, items } = data;

  if (!items || items.length === 0) return null;

  return (
    <div className="px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        {title && (
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-normal tracking-wide text-center mb-12 text-foreground">
            {title}
          </h2>
        )}

        <Accordion type="single" collapsible className="divide-y divide-border/40">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-0 py-2"
            >
              <AccordionTrigger className="text-right font-body text-base md:text-lg font-medium py-6 hover:no-underline hover:text-accent transition-colors [&[data-state=open]]:text-accent">
                <h3 className="text-right leading-relaxed pr-4">{item.question}</h3>
              </AccordionTrigger>
              <AccordionContent className="text-right font-body text-foreground/70 leading-relaxed pb-8 text-sm md:text-base pr-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
});

FaqBlock.displayName = "FaqBlock";
export default FaqBlock;
