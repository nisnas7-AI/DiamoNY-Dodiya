import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import SortableWidgetCard from "./SortableWidgetCard";
import AdminWidgetCard from "./AdminWidgetCard";
import AddWidgetMenu from "./AddWidgetMenu";
import EmptyWorkspace from "./EmptyWorkspace";
import type { WidgetConfig } from "@/hooks/useAdminDashboardPrefs";

interface SortableWidgetGridProps {
  widgets: WidgetConfig[];
  categoryLabel: string;
  onDrillDown: (tab: string) => void;
  onReorder: (widgets: WidgetConfig[]) => void;
  onToggleVisibility: (id: string) => void;
  onAddWidget: (widget: WidgetConfig) => void;
  onSave: () => void;
  isSaving: boolean;
  statsMap: Record<string, { value: string | number; label: string }>;
}

const SortableWidgetGrid = ({
  widgets,
  categoryLabel,
  onDrillDown,
  onReorder,
  onToggleVisibility,
  onAddWidget,
  onSave,
  isSaving,
  statsMap,
}: SortableWidgetGridProps) => {
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleWidgets = editMode ? widgets : widgets.filter((w) => w.visible);
  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;
  const activeWidgetIds = new Set(widgets.filter((w) => w.visible).map((w) => w.id));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(widgets, oldIndex, newIndex);
      onReorder(reordered);
    },
    [widgets, onReorder]
  );

  const handleToggleEditMode = useCallback(
    (enabled: boolean) => {
      if (!enabled && editMode) {
        onSave();
      }
      setEditMode(enabled);
    },
    [editMode, onSave]
  );

  // Persistent header — always visible regardless of widget count
  const header = (
    <div className="relative z-40 flex items-center justify-between bg-card/95 backdrop-blur-sm rounded-2xl border border-border/40 px-5 py-3 shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
      <div>
        <h2 className="text-lg font-heading font-bold text-foreground">ווידג'טים</h2>
        <p className="text-xs text-muted-foreground">
          {editMode ? "גרור לסידור מחדש • לחץ + להוספה" : "לחץ על ווידג'ט כדי להיכנס לניהול"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Add Widget — always visible, gold accent */}
        <AddWidgetMenu
          activeWidgetIds={activeWidgetIds}
          onAddWidget={(w) => {
            onAddWidget(w);
            if (!editMode) setEditMode(true);
          }}
        />
        <div className="inline-flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5 border border-border/40 w-fit overflow-hidden box-border">
          <Settings2 className={`w-4 h-4 shrink-0 ${editMode ? "text-[#D4AF37] drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]" : "text-foreground/70"}`} />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap leading-none">
            {editMode ? "עריכה" : "נעול"}
          </span>
          <Switch
            checked={editMode}
            onCheckedChange={handleToggleEditMode}
            className="data-[state=checked]:bg-[#D4AF37] shrink-0 h-5 w-9"
          />
        </div>
      </div>
    </div>
  );

  // Empty state — show header + empty workspace
  if (visibleWidgets.length === 0 && !editMode) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyWorkspace
          categoryLabel={categoryLabel}
          onAddWidget={() => setEditMode(true)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {visibleWidgets.map((widget) => (
                <SortableWidgetCard
                  key={widget.id}
                  widget={widget}
                  editMode={editMode}
                  onDrillDown={onDrillDown}
                  onToggleVisibility={onToggleVisibility}
                  stat={statsMap[widget.id]}
                  isDragging={activeId === widget.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {activeWidget ? (
            <div className="opacity-90 scale-105 rotate-1">
              <AdminWidgetCard
                widget={activeWidget}
                editMode
                onDrillDown={() => {}}
                stat={statsMap[activeWidget.id]}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default SortableWidgetGrid;
