import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, User, ShoppingBag, Menu, Phone, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useSocialSettings } from "@/contexts/SocialSettingsContext";
import { SocialIcon } from "@/components/SocialIcons";
import { useVip } from "@/contexts/VipContext";
import { useCart } from "@/contexts/CartContext";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";
import DesktopNavigation from "./DesktopNavigation";
import MobileMenu from "./MobileMenu";
import SearchModal from "./SearchModal";
import VaultLoginModal from "./VaultLoginModal";

interface HeaderSettings {
  header_bg_color: string;
  header_bg_opacity: number;
  mobile_menu_bg_color: string;
  mobile_menu_bg_opacity: number;
}

const DEFAULT_SETTINGS: HeaderSettings = {
  header_bg_color: "#ffffff",
  header_bg_opacity: 0.95,
  mobile_menu_bg_color: "#ffffff",
  mobile_menu_bg_opacity: 0.98
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { getEnabledPlatforms } = useSocialSettings();
  const { member, isVip } = useVip();
  const { totalItems, openDrawer } = useCart();
  const brand = useBrandSettings();

  const headerSocialPlatforms = getEnabledPlatforms('header');

  // SEO: Navigation Schema — dynamic from brand settings
  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": "Main Navigation",
    "url": brand.site_url,
    "hasPart": [
      { "@type": "WebPage", "name": "טבעות", "url": `${brand.site_url}/catalog/rings` },
      { "@type": "WebPage", "name": "עגילים", "url": `${brand.site_url}/catalog/earrings` },
      { "@type": "WebPage", "name": "תליונים", "url": `${brand.site_url}/catalog/pendants` },
      { "@type": "WebPage", "name": "צמידים", "url": `${brand.site_url}/catalog/bracelets` },
      { "@type": "WebPage", "name": "צור קשר", "url": `${brand.site_url}/contact` },
    ]
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const { data: headerSettings } = useQuery({
    queryKey: ["header-design-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("metadata")
        .eq("key", "header_design")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (data?.metadata) return data.metadata as unknown as HeaderSettings;
      return DEFAULT_SETTINGS;
    }
  });

  const navItems = [
    { label: "עיצוב אישי", href: "/#custom", isExternal: false },
    { label: "אודות", href: "/#about", isExternal: false },
    { label: "בלוג", href: "/blog", isExternal: false },
    { label: "צור קשר", href: "/contact", isExternal: false }
  ];

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    if (href.startsWith("/#") && location.pathname === "/") {
      const element = document.querySelector(href.substring(1));
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const headerClassName = `sticky top-0 z-50 transition-all duration-300 w-full ${
    isScrolled
      ? "bg-card/98 backdrop-blur-md border-b border-border shadow-soft"
      : "bg-background border-b border-border"
  }`;

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(navigationSchema)}</script>
      </Helmet>

      <header className={headerClassName}>
        <div className="w-full max-w-[100vw] mx-auto">
          <div className="h-16 px-4 md:px-6 lg:px-[50px] grid grid-cols-[auto,1fr,auto] items-center gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 justify-self-start">
              <img
                alt="DiamoNY - לוגו מותג תכשיטי יוקרה"
                loading="eager"
                width={160}
                height={48}
                src={brand.logo_url}
                className="h-10 md:h-12 w-auto transition-all duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex justify-center">
              <DesktopNavigation navItems={navItems} isScrolled={isScrolled} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3 transition-colors duration-300 justify-self-end text-foreground">
              {/* Social Icons - Desktop */}
              {headerSocialPlatforms.length > 0 && (
                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border">
                  {headerSocialPlatforms.slice(0, 3).map((platform) => (
                    <a
                      key={platform.platform}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 transition-all duration-300 text-gold hover:text-gold-dark"
                      aria-label={platform.platform}
                    >
                      <SocialIcon platform={platform.platform} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}

              {/* Phone */}
              <a
                href={`tel:+${brand.whatsapp_number}`}
                className="hidden sm:flex p-2 transition-colors duration-300 text-foreground hover:text-gold"
                aria-label="התקשר אלינו"
              >
                <Phone className="w-5 h-5" />
              </a>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 transition-colors duration-300 text-gold hover:text-gold-dark"
                onClick={() => setIsMenuOpen(true)}
                aria-label="פתח תפריט ניווט"
              >
                <Menu className="w-6 h-6" strokeWidth={1.5} />
              </button>

              {/* Mobile VIP Badge */}
              {isVip ? (
                <Link
                  to="/the-lounge"
                  className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-gold-warm text-[10px] font-semibold tracking-[0.15em] uppercase hover:bg-primary/90 transition-all duration-300"
                >
                  <Lock className="w-3 h-3" />
                  <span>VIP</span>
                </Link>
              ) : (
                <button
                  onClick={() => setIsVaultOpen(true)}
                  className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-gold-warm text-[10px] font-semibold tracking-[0.15em] uppercase hover:bg-primary/90 transition-all duration-300"
                  aria-label="VIP Access"
                >
                  <Lock className="w-3 h-3" />
                  <span>VIP</span>
                </button>
              )}

              {/* Desktop VIP Button */}
              {isVip ? (
                <Link
                  to="/the-lounge"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-gold-warm to-gold text-primary-foreground text-xs font-semibold tracking-wide hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                >
                  <span>VIP</span>
                  <span className="opacity-70">•</span>
                  <span>{member?.full_name}</span>
                </Link>
              ) : (
                <button
                  onClick={() => setIsVaultOpen(true)}
                  className="hidden sm:flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-gold-warm to-gold text-primary-foreground text-xs font-semibold tracking-wider hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                  aria-label="VIP"
                >
                  VIP
                </button>
              )}

              {/* Search */}
              <button
                className="p-2 transition-colors duration-300 text-foreground hover:text-gold"
                onClick={() => setIsSearchOpen(true)}
                aria-label="חיפוש"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* User */}
              <button
                className="hidden sm:block p-2 transition-colors duration-300 text-foreground hover:text-gold"
                aria-label="חשבון משתמש"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Cart */}
              <button
                className="p-2 transition-colors duration-300 relative text-foreground hover:text-gold"
                onClick={openDrawer}
                aria-label="סל קניות"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <VaultLoginModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
    </>
  );
};

export default Header;
