import { Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type GoldType = 'yellow' | 'white' | 'rose' | 'platinum';

interface GoldSwatchConfig {
  color: string;
  label: string;
  labelEn: string;
}

const GOLD_SWATCHES: Record<GoldType, GoldSwatchConfig> = {
  yellow: {
    color: '#E6BE8A',
    label: 'זהב צהוב',
    labelEn: 'Yellow Gold',
  },
  white: {
    color: '#E5E4E2',
    label: 'זהב לבן',
    labelEn: 'White Gold',
  },
  rose: {
    color: '#B76E79',
    label: 'זהב רוז',
    labelEn: 'Rose Gold',
  },
  platinum: {
    color: '#E5E4E2',
    label: 'פלטינה',
    labelEn: 'Platinum',
  },
};

interface GoldSwatchesProps {
  goldType?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showAllOptions?: boolean;
  selectedType?: GoldType;
  onSelect?: (type: GoldType) => void;
}

const normalizeGoldType = (type: string): GoldType | null => {
  const normalized = type.toLowerCase();
  
  if (normalized.includes('צהוב') || normalized.includes('yellow')) return 'yellow';
  if (normalized.includes('לבן') || normalized.includes('white')) return 'white';
  if (normalized.includes('רוז') || normalized.includes('rose') || normalized.includes('pink')) return 'rose';
  if (normalized.includes('פלטינה') || normalized.includes('platinum')) return 'platinum';
  
  return null;
};

const GoldSwatches = ({ 
  goldType, 
  size = 'md', 
  showLabel = false,
  showAllOptions = false,
  selectedType,
  onSelect 
}: GoldSwatchesProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const renderSwatch = (type: GoldType, config: GoldSwatchConfig, isSelected: boolean = false) => {
    const isPlatinum = type === 'platinum';
    
    return (
      <TooltipProvider key={type}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelect?.(type)}
              className={`
                ${sizeClasses[size]} rounded-full border-2 transition-all duration-200
                flex items-center justify-center
                ${isSelected 
                  ? 'border-primary ring-2 ring-primary/30 scale-110' 
                  : 'border-border/50 hover:border-border hover:scale-105'
                }
                ${onSelect ? 'cursor-pointer' : 'cursor-default'}
              `}
              style={{ backgroundColor: config.color }}
              disabled={!onSelect}
            >
              {isPlatinum && (
                <Crown 
                  className={`
                    ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'}
                    text-gray-600
                  `} 
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Show all options mode
  if (showAllOptions) {
    return (
      <div className="flex items-center gap-2">
        {Object.entries(GOLD_SWATCHES).map(([type, config]) => 
          renderSwatch(type as GoldType, config, selectedType === type)
        )}
        {showLabel && selectedType && (
          <span className="text-xs text-muted-foreground mr-2">
            {GOLD_SWATCHES[selectedType].label}
          </span>
        )}
      </div>
    );
  }

  // Single gold type display
  if (!goldType) return null;
  
  const normalizedType = normalizeGoldType(goldType);
  if (!normalizedType) return null;
  
  const config = GOLD_SWATCHES[normalizedType];

  return (
    <div className="flex items-center gap-2">
      {renderSwatch(normalizedType, config, true)}
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  );
};

export default GoldSwatches;
