import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronDown, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories } from "@/hooks/useCategories";
import { useSocialSettings } from "@/contexts/SocialSettingsContext";
import { SocialIcon } from "@/components/SocialIcons";
import ComingSoonLeadModal from "@/components/ComingSoonLeadModal";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { categoryTree } = useCategories();
  const { getEnabledPlatforms } = useSocialSettings();
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [comingSoonCategory, setComingSoonCategory] = useState<string | null>(null);
  const socialPlatforms = getEnabledPlatforms('header');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Active state detection for categories
  const isActiveCategory = (accordionId: string) => {
    const pathMap: Record<string, string[]> = {
      "diamond-jewelry": ["/catalog/rings", "/catalog/earrings", "/catalog/pendants", "/catalog/bracelets"],
      "pearl-jewelry": ["/collections/pearl-jewelry", "/catalog/pearl-rings", "/catalog/Pearl%20earrings", "/catalog/pearl-pendants", "/catalog/pearl-bracelets"],
      "men-jewelry": ["/catalog/Man%20Rings", "/catalog/%D7%AA%D7%9C%D7%99%D7%95%D7%9F-%D7%9C%D7%92%D7%91%D7%A8"],
    };
    // Check if current path matches any of the category paths
    return pathMap[accordionId]?.some(path => 
      location.pathname.startsWith(path) || location.pathname === path
    ) || false;
  };

  const isActiveSubLink = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href);
  };

  // Category accordions with sub-items
  const COMING_SOON_HREFS = new Set(["/catalog/bracelets", "/catalog/%D7%AA%D7%9C%D7%99%D7%95%D7%9F-%D7%9C%D7%92%D7%91%D7%A8"]);
  const COMING_SOON_LABELS: Record<string, string> = {
    "/catalog/bracelets": "הצמידים שלנו",
    "/catalog/%D7%AA%D7%9C%D7%99%D7%95%D7%9F-%D7%9C%D7%92%D7%91%D7%A8": "תליוני גברים",
  };

  const categoryAccordions = [
    {
      id: "diamond-jewelry",
      label: "תכשיטי יהלומים",
      subLinks: [
        { label: "כל תכשיטי היהלומים", href: "/catalog", title: "כל קולקציית תכשיטי היהלומים - DiamoNY" },
        { label: "טבעות יהלום", href: "/catalog/rings", title: "טבעות יהלום מעוצבות - DiamoNY" },
        { label: "עגילי יהלום", href: "/catalog/earrings", title: "עגילי יהלום מעוצבים - DiamoNY" },
        { label: "תליוני יהלום", href: "/catalog/pendants", title: "תליוני יהלום אלגנטיים - DiamoNY" },
        { label: "צמידי יהלום", href: "/catalog/bracelets", title: "צמידי יהלום יוקרתיים - DiamoNY" },
      ],
    },
    {
      id: "pearl-jewelry",
      label: "תכשיטי פנינים",
      subLinks: [
        { label: "כל תכשיטי הפנינים", href: "/collections/pearl-jewelry", title: "כל קולקציית תכשיטי הפנינים - DiamoNY" },
        { label: "טבעות פנינים", href: "/catalog/pearl-rings", title: "טבעות פנינים מעוצבות - DiamoNY" },
        { label: "עגילי פנינה", href: "/catalog/Pearl%20earrings", title: "עגילי פנינה מעוצבים - DiamoNY" },
        { label: "תליוני פנינים", href: "/catalog/pearl-pendants", title: "תליוני פנינים אלגנטיים - DiamoNY" },
        { label: "צמידי פנינים", href: "/catalog/pearl-bracelets", title: "צמידי פנינים יוקרתיים - DiamoNY" },
      ],
    },
    {
      id: "men-jewelry",
      label: "תכשיטי גברים",
      subLinks: [
        { label: "טבעות גברים", href: "/catalog/Man%20Rings", title: "טבעות גברים מעוצבות - DiamoNY" },
        { label: "תליון לגבר", href: "/category/mens-pendants", title: "תליון לגבר - DiamoNY" },
      ],
    },
  ];

  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  const toggleAccordion = (accordionId: string) => {
    setExpandedAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accordionId)) {
        newSet.delete(accordionId);
      } else {
        newSet.add(accordionId);
      }
      return newSet;
    });
  };

  const staticLinks = [
    { label: "טבעות אירוסין", href: "/catalog?category=Diamonds%20Rings&engagement=true", title: "טבעות אירוסין מעוצבות בעבודת יד - DiamoNY" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Panel - RTL Direction */}
          <motion.div
            dir="rtl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 w-full max-w-[320px] bg-background z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <Link to="/" onClick={onClose}>
                <img
                  src="/lovable-uploads/083379c4-874c-46e2-949d-4b7023e62bc4.png"
                  alt="Logo"
                  className="h-10"
                />
              </Link>
              <button
                onClick={onClose}
                className="p-2 text-gold hover:text-foreground transition-colors"
                aria-label="סגור תפריט"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-6 py-8">
              {/* Main Links */}
              <ul className="space-y-2">
                {/* Static Links (Engagement Rings) */}
                {staticLinks.map((link, index) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={link.href}
                      onClick={onClose}
                      title={link.title}
                      className="block py-4 font-body text-foreground text-[15px] font-medium tracking-wide text-right hover:text-accent transition-colors border-b border-border/30 leading-relaxed"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}

                {/* Category Accordions (Diamond, Pearl, Men's Jewelry) */}
                {categoryAccordions.map((accordion, index) => (
                  <motion.li
                    key={accordion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (staticLinks.length + index) * 0.05, duration: 0.3 }}
                    className="border-b border-border/30"
                  >
                    <button
                      onClick={() => toggleAccordion(accordion.id)}
                      className={`
                        flex flex-row-reverse items-center justify-between w-full min-h-[48px] py-4 
                        transition-colors touch-manipulation
                        ${isActiveCategory(accordion.id) 
                          ? 'text-accent' 
                          : 'text-foreground hover:text-accent'
                        }
                      `}
                    >
                      <span className={`
                        font-body text-[15px] leading-relaxed
                        ${isActiveCategory(accordion.id) ? 'font-semibold' : 'font-medium'}
                      `}>
                        {accordion.label}
                      </span>
                      <ChevronDown 
                        className={`
                          w-5 h-5 shrink-0 transition-transform duration-300
                          ${expandedAccordions.has(accordion.id) ? 'rotate-180' : ''}
                        `} 
                      />
                    </button>
                    {/* SEO: Content always in DOM, CSS controls visibility */}
                    <div
                      className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${expandedAccordions.has(accordion.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                      `}
                      style={{ willChange: 'max-height, opacity' }}
                      aria-hidden={!expandedAccordions.has(accordion.id)}
                    >
                      <ul className="pr-4 pb-4 space-y-3">
                        {accordion.subLinks.map((subLink) => (
                          <li key={subLink.label}>
                            {COMING_SOON_HREFS.has(subLink.href) ? (
                              <button
                                onClick={() => setComingSoonCategory(COMING_SOON_LABELS[subLink.href] || subLink.label)}
                                tabIndex={expandedAccordions.has(accordion.id) ? 0 : -1}
                                className="block w-full py-2 text-[14px] font-body text-foreground/70 hover:text-accent transition-colors text-right leading-relaxed"
                              >
                                {subLink.label}
                              </button>
                            ) : (
                              <Link
                                to={subLink.href}
                                onClick={onClose}
                                title={subLink.title}
                                tabIndex={expandedAccordions.has(accordion.id) ? 0 : -1}
                                className={`
                                  block py-2 text-[14px] font-body transition-colors text-right leading-relaxed
                                  ${isActiveSubLink(subLink.href) 
                                    ? 'text-accent font-medium' 
                                    : 'text-foreground/70 hover:text-accent'
                                  }
                                `}
                              >
                                {subLink.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.li>
                ))}

              </ul>

              {/* Category Accordion */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-accent text-[13px] tracking-wider mb-5 font-body font-semibold text-right">
                  קולקציות
                </p>
                <ul className="space-y-1">
                  {categoryTree.map((category, index) => (
                    <motion.li
                      key={category.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.03, duration: 0.3 }}
                      className="border-b border-border/40"
                    >
                      {category.children.length > 0 ? (
                        <>
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="flex flex-row-reverse items-center justify-between w-full py-4 text-foreground hover:text-accent transition-colors"
                          >
                            <span className="font-body text-[15px] font-medium leading-relaxed text-right">{category.name}</span>
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform duration-300 ${
                                expandedCategories.has(category.id) ? 'rotate-180' : ''
                              }`} 
                            />
                          </button>
                          {/* SEO: Content always in DOM, CSS controls visibility */}
                          <div
                            className={`
                              overflow-hidden transition-all duration-300 ease-in-out
                              ${expandedCategories.has(category.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                            `}
                            style={{ willChange: 'max-height, opacity' }}
                            aria-hidden={!expandedCategories.has(category.id)}
                          >
                            <ul className="pr-4 pb-4 space-y-3">
                              <li>
                                <Link
                                  to={`/catalog?category=${category.slug}`}
                                  onClick={onClose}
                                  title={`צפה בכל ${category.name} - DiamoNY`}
                                  tabIndex={expandedCategories.has(category.id) ? 0 : -1}
                                  className="block py-2 text-[14px] text-foreground/70 hover:text-accent font-body transition-colors text-right leading-relaxed"
                                >
                                  צפה בהכל
                                </Link>
                              </li>
                              {category.children.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    to={`/catalog?category=${child.slug}`}
                                    onClick={onClose}
                                    title={`${child.name} - קולקציית DiamoNY`}
                                    tabIndex={expandedCategories.has(category.id) ? 0 : -1}
                                    className="block py-2 text-[14px] text-foreground/70 hover:text-accent font-body transition-colors text-right leading-relaxed"
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <Link
                          to={`/catalog?category=${category.slug}`}
                          onClick={onClose}
                          title={`${category.name} - קולקציית DiamoNY`}
                          className="block py-4 text-foreground font-body text-[15px] font-medium hover:text-accent transition-colors text-right leading-relaxed"
                        >
                          {category.name}
                        </Link>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Footer - Contact CTA */}
            <div className="px-6 py-6 border-t border-border bg-card/50">
              {/* Contact Button */}
              <Link
                to="/contact"
                onClick={onClose}
                title="צור קשר עם DiamoNY - ייעוץ אישי לתכשיטים"
                className="block w-[90%] mx-auto py-4 text-center border border-accent text-accent font-body text-[14px] font-medium tracking-wide hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              >
                צור קשר
              </Link>

              {/* Quick Contact Links */}
              <div className="flex items-center justify-center gap-8 mt-5">
                <a
                  href="tel:+972546290534"
                  title="התקשרו אלינו עכשיו"
                  className="flex items-center gap-2 text-foreground/60 hover:text-accent text-[14px] transition-colors"
                >
                  <span className="font-body">התקשרו</span>
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href="mailto:info@diamony.me"
                  title="שלחו לנו אימייל"
                  className="flex items-center gap-2 text-foreground/60 hover:text-accent text-[14px] transition-colors"
                >
                  <span className="font-body">אימייל</span>
                  <Mail className="w-4 h-4" />
                </a>
              </div>

              {/* Social Icons */}
              {socialPlatforms.length > 0 && (
                <div className="flex items-center justify-center gap-4 mt-5 pt-5 border-t border-border">
                  {socialPlatforms.map((platform) => (
                    <a
                      key={platform.platform}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gold hover:text-gold-dark transition-colors"
                      aria-label={platform.platform}
                      title={`עקבו אחרינו ב-${platform.platform}`}
                    >
                      <SocialIcon platform={platform.platform} className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <ComingSoonLeadModal
            isOpen={!!comingSoonCategory}
            onClose={() => setComingSoonCategory(null)}
            categoryName={comingSoonCategory || ""}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
