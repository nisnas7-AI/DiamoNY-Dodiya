import { Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type MetalType = 'yellow' | 'white' | 'rose';

interface MetalConfig {
  color: string;
  gradient: string;
  label: string;
  labelEn: string;
}

export const METAL_CONFIGS: Record<MetalType, MetalConfig> = {
  yellow: {
    color: '#d4af37',
    gradient: 'radial-gradient(circle at 30% 30%, #f9f4e1 0%, #d4af37 40%, #b8860b 100%)',
    label: 'זהב צהוב',
    labelEn: 'Yellow Gold',
  },
  white: {
    color: '#e5e4e2',
    gradient: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e5e4e2 40%, #b0c4de 100%)',
    label: 'זהב לבן',
    labelEn: 'White Gold',
  },
  rose: {
    color: '#b76e79',
    gradient: 'radial-gradient(circle at 30% 30%, #e8c3c9 0%, #b76e79 40%, #965a61 100%)',
    label: 'זהב רוז',
    labelEn: 'Rose Gold',
  },
};

interface ProductVariant {
  id: string;
  variant_value: MetalType;
  sku?: string;
  is_available: boolean;
  has_images: boolean;
}

interface MetalSelectorProps {
  variants: ProductVariant[];
  selectedMetal: MetalType;
  onSelect: (metal: MetalType) => void;
  showLabels?: boolean;
  className?: string;
}

const MetalSelector = ({
  variants,
  selectedMetal,
  onSelect,
  showLabels = true,
  className,
}: MetalSelectorProps) => {
  const availableMetals: MetalType[] = ['yellow', 'white', 'rose'];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showLabels && (
        <p className="text-sm text-muted-foreground">בחר סוג זהב:</p>
      )}
      <div className="flex items-center" style={{ gap: '15px' }}>
        {availableMetals.map((metal) => {
          const config = METAL_CONFIGS[metal];
          const variant = variants.find(v => v.variant_value === metal);
          const isSelected = selectedMetal === metal;
          const isAvailable = variant?.is_available !== false;
          
          return (
            <TooltipProvider key={metal}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelect(metal)}
                    disabled={!isAvailable}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-300 ease-out relative",
                      "focus:outline-none cursor-pointer",
                      isSelected 
                        ? "scale-[1.15] border-2 border-foreground/80" 
                        : "border-2 border-transparent hover:-translate-y-0.5",
                      !isAvailable && "opacity-40 cursor-not-allowed"
                    )}
                    style={{ 
                      background: config.gradient,
                      boxShadow: isSelected 
                        ? 'inset 0 1px 3px rgba(255,255,255,0.5), 0 0 10px rgba(0,0,0,0.15)'
                        : 'inset 0 1px 3px rgba(255,255,255,0.5), 0 2px 5px rgba(0,0,0,0.2)',
                    }}
                    aria-label={config.label}
                  >
                    {/* Selection indicator dot */}
                    {isSelected && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground/70" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-sm">
                  <p>{config.label}</p>
                  {variant?.sku && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      מק״ט: {variant.sku}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      {/* Selected metal label */}
      {showLabels && (
        <p className="text-sm font-medium text-foreground">
          {METAL_CONFIGS[selectedMetal].label}
        </p>
      )}
      
      {/* Rose Gold order notice */}
      {selectedMetal === 'rose' && (
        <p className="text-sm text-primary font-medium animate-in fade-in duration-300">
          זהב אדום זמין בהזמנה
        </p>
      )}
    </div>
  );
};

export default MetalSelector;
