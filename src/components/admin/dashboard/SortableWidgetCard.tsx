import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AdminWidgetCard from "./AdminWidgetCard";
import type { WidgetConfig } from "@/hooks/useAdminDashboardPrefs";

interface SortableWidgetCardProps {
  widget: WidgetConfig;
  editMode: boolean;
  onDrillDown: (tab: string) => void;
  onToggleVisibility: (id: string) => void;
  stat?: { value: string | number; label: string };
  isDragging: boolean;
}

const SortableWidgetCard = memo(
  ({ widget, editMode, onDrillDown, onToggleVisibility, stat, isDragging }: SortableWidgetCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: widget.id, disabled: !editMode });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
      zIndex: isDragging ? 0 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...(editMode ? listeners : {})}>
        <AdminWidgetCard
          widget={widget}
          editMode={editMode}
          onDrillDown={onDrillDown}
          onToggleVisibility={onToggleVisibility}
          stat={stat}
        />
      </div>
    );
  }
);

SortableWidgetCard.displayName = "SortableWidgetCard";
export default SortableWidgetCard;
