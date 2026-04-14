import { cn } from "@/lib/utils";

type Position = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface PositionPickerProps {
  value: Position;
  onChange: (position: Position) => void;
  className?: string;
}

const positions: { value: Position; label: string }[] = [
  { value: 'top-right', label: 'למעלה ימין' },
  { value: 'top-center', label: 'למעלה מרכז' },
  { value: 'top-left', label: 'למעלה שמאל' },
  { value: 'center-right', label: 'אמצע ימין' },
  { value: 'center', label: 'מרכז' },
  { value: 'center-left', label: 'אמצע שמאל' },
  { value: 'bottom-right', label: 'למטה ימין' },
  { value: 'bottom-center', label: 'למטה מרכז' },
  { value: 'bottom-left', label: 'למטה שמאל' },
];

const PositionPicker = ({ value, onChange, className }: PositionPickerProps) => {
  return (
    <div className={cn("grid grid-cols-3 gap-1 w-fit", className)}>
      {positions.map((pos) => (
        <button
          key={pos.value}
          type="button"
          onClick={() => onChange(pos.value)}
          className={cn(
            "w-10 h-10 rounded border-2 transition-all text-xs flex items-center justify-center",
            value === pos.value 
              ? "bg-primary border-primary text-primary-foreground" 
              : "bg-muted/50 border-muted-foreground/20 hover:border-primary/50"
          )}
          title={pos.label}
        >
          {value === pos.value && "✓"}
        </button>
      ))}
    </div>
  );
};

export default PositionPicker;
export type { Position };
