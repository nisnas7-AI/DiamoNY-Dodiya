import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, Bell } from "lucide-react";
import { CategoryWithChildren } from "@/hooks/useCategories";
import ComingSoonLeadModal from "@/components/ComingSoonLeadModal";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  image_url?: string | null;
}

export interface CuratedColumn {
  title: string;
  items: { label: string; slug: string; isAbsolute?: boolean; isEmpty?: boolean }[];
}

type ColumnEntry =
  | { type: "category"; data: CategoryWithChildren }
  | { type: "placeholder"; label: string }
  | { type: "curated"; title: string; items: { label: string; slug: string; isAbsolute?: boolean; isEmpty?: boolean }[] };

interface MegaMenuSectionProps {
  title: string;
  categories: CategoryWithChildren[];
  expectedColumns?: string[];
  curatedColumns?: CuratedColumn[];
  allowedChildNames?: Set<string>;
  /** Map category slug → absolute route override */
  routeOverrides?: Record<string, string>;
  /** Extra links to inject at the bottom of a category column, keyed by category name */
  extraItems?: Record<string, { label: string; slug: string; isAbsolute?: boolean }[]>;
  hoveredCategory: CategoryWithChildren | null;
  hoveredSubCategory: Category | null;
  onCategoryHover: (cat: CategoryWithChildren) => void;
  onSubCategoryHover: (sub: Category, parent: CategoryWithChildren) => void;
  onClose: () => void;
  showTopBorder?: boolean;
}

const MegaMenuSection = ({
  title,
  categories,
  expectedColumns = [],
  curatedColumns = [],
  allowedChildNames,
  routeOverrides = {},
  extraItems = {},
  hoveredCategory,
  hoveredSubCategory,
  onCategoryHover,
  onSubCategoryHover,
  onClose,
  showTopBorder = false,
}: MegaMenuSectionProps) => {
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalCategory, setLeadModalCategory] = useState("");

  // Build column entries: real categories + curated + placeholders
  const columns: ColumnEntry[] = [];
  const usedNames = new Set(categories.map((c) => c.name));

  // Add curated columns first (they appear alongside real categories)
  curatedColumns.forEach((col) => {
    columns.push({ type: "curated", title: col.title, items: col.items });
    usedNames.add(col.title);
  });

  categories.forEach((cat) => columns.push({ type: "category", data: cat }));

  expectedColumns.forEach((label) => {
    if (!usedNames.has(label)) {
      columns.push({ type: "placeholder", label });
    }
  });

  const handleLeadClick = (label: string) => {
    setLeadModalCategory(label);
    setLeadModalOpen(true);
  };

  return (
    <>
      {showTopBorder && <div className="h-px bg-border mx-8" />}

      <div className="py-6 px-8">
        {/* Section header */}
        <div className="w-full text-right mb-6 pb-5 border-b border-border">
          <Link
            to="/catalog"
            onClick={onClose}
            className="inline-flex items-center gap-3 hover:opacity-75 transition-opacity duration-300 group"
            style={{
              color: "hsl(var(--accent))",
              fontFamily: '"Cormorant Garamond", "Playfair Display", "Georgia", serif',
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "0.5px",
              textDecoration: "none",
            }}
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{title}</span>
            <ArrowLeft className="w-4 h-4 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-accent" />
          </Link>
        </div>

        {/* Category columns */}
        <div className="flex flex-row items-stretch gap-0 w-full" dir="rtl">
          {columns.map((col, index) => (
            <div key={col.type === "category" ? col.data.id : col.type === "curated" ? `curated-${col.title}` : col.label} className="flex items-stretch flex-1">
              <div className="w-full px-3.5 space-y-3 text-center text-center" style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
                {col.type === "category" ? (
                  /* ── Real category ── */
                  <div onMouseEnter={() => onCategoryHover(col.data)}>
                    <Link
                      to={routeOverrides[col.data.slug] || routeOverrides[col.data.slug] || `/catalog/${col.data.slug}`}
                      onClick={onClose}
                      style={{ fontWeight: 500, fontSize: "16px" }}
                      className={`block font-body tracking-wide pb-2.5 border-b border-border transition-all duration-300 ${
                        hoveredCategory?.id === col.data.id && !hoveredSubCategory ? "text-accent" : "text-foreground hover:text-accent"
                      }`}
                    >
                      {col.data.name}
                    </Link>

                    {col.data.children.length > 0 ? (
                      <ul className="space-y-2.5 pt-2">
                        {col.data.children
                          .filter((child) => !allowedChildNames || allowedChildNames.has(child.name))
                          .map((child) => (
                            <li key={child.id}>
                              <Link
   to={routeOverrides[child.slug] || `/catalog/${child.slug}`}
                                onClick={onClose}
                                onMouseEnter={() => onSubCategoryHover(child, col.data)}
                                style={{ fontWeight: 500, fontSize: "14px" }}
                                className={`block font-body tracking-wide transition-all duration-300 ${
                                  hoveredSubCategory?.id === child.id
                                    ? "text-accent"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        {/* Extra injected items for this category */}
                        {(extraItems[col.data.name] || []).map((item) => (
                          <li key={item.slug}>
                            <Link
                              to={item.isAbsolute ? item.slug : `/catalog/${item.slug}`}
                              onClick={onClose}
                              style={{ fontWeight: 500, fontSize: "14px" }}
                              className="block font-body tracking-wide text-muted-foreground hover:text-accent transition-all duration-300"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                        {/* If filter removed all children, show empty state */}
                        {allowedChildNames && col.data.children.filter((c) => allowedChildNames.has(c.name)).length === 0 && (
                          <EmptyColumnState label={col.data.name} onCtaClick={() => handleLeadClick(col.data.name)} />
                        )}
                      </ul>
                    ) : (
                      <EmptyColumnState label={col.data.name} onCtaClick={() => handleLeadClick(col.data.name)} />
                    )}
                  </div>
                ) : col.type === "curated" ? (
                  /* ── Curated column ── */
                  <div>
                    <span
                      className="block font-body tracking-wide pb-2.5 border-b border-border text-foreground"
                      style={{ fontWeight: 500, fontSize: "16px" }}
                    >
                      {col.title}
                    </span>
                    {col.items.length > 0 ? (
                      <ul className="space-y-2.5 pt-2">
                        {col.items.map((item) => (
                          <li key={item.slug || item.label}>
                            {item.isEmpty ? (
                              <button
                                onClick={() => handleLeadClick(item.label)}
                                style={{ fontWeight: 500, fontSize: "14px" }}
                                className="block w-full font-body tracking-wide text-muted-foreground hover:text-accent transition-all duration-300 text-center"
                              >
                                {item.label}
                              </button>
                            ) : (
                              <Link
                                to={item.isAbsolute ? item.slug : `/catalog/${item.slug || encodeURIComponent(item.label)}`}
                                onClick={onClose}
                                style={{ fontWeight: 500, fontSize: "14px" }}
                                className="block font-body tracking-wide text-muted-foreground hover:text-accent transition-all duration-300"
                              >
                                {item.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyColumnState label={col.title} onCtaClick={() => handleLeadClick(col.title)} />
                    )}
                  </div>
                ) : (
                  /* ── Placeholder column ── */
                  <div>
                    <span className="block font-body tracking-wide pb-2.5 border-b border-border text-foreground" style={{ fontWeight: 500, fontSize: "16px" }}>
                      {col.label}
                    </span>
                    <EmptyColumnState label={col.label} onCtaClick={() => handleLeadClick(col.label)} />
                  </div>
                )}
              </div>

              {/* Tapered gold divider */}
              {index < columns.length - 1 && (
                <div className="flex items-center flex-shrink-0" style={{ width: "2px", alignSelf: "stretch" }}>
                  <div
                    style={{
                      width: "1px",
                      height: "70%",
                      background: "linear-gradient(to bottom, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0.4) 50%, rgba(212, 175, 55, 0) 100%)",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ComingSoonLeadModal isOpen={leadModalOpen} onClose={() => setLeadModalOpen(false)} categoryName={leadModalCategory} />
    </>
  );
};

/* ── Elegant empty state for a column ── */
const EmptyColumnState = ({ label, onCtaClick }: { label: string; onCtaClick: () => void }) => (
  <div className="pt-4 space-y-3 text-center">
    <p className="text-sm text-muted-foreground leading-relaxed">הקולקציה מתעדכנת בימים אלו.</p>
    <button
      onClick={onCtaClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors duration-200"
    >
      <Bell className="w-3.5 h-3.5" />
      <span className="border-b border-accent/30 pb-px">לקבלת עדכונים</span>
    </button>
  </div>
);

export default MegaMenuSection;
