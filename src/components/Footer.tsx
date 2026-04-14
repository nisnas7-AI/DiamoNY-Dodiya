import { Link } from "react-router-dom";
import { useSocialSettings } from "@/contexts/SocialSettingsContext";
import { SocialIcon } from "@/components/SocialIcons";
import { useEmailFormsEnabled } from "@/hooks/useEmailFormsEnabled";
import ContactFallbackButtons from "@/components/ContactFallbackButtons";
import { useBrandSettings } from "@/contexts/BrandSettingsContext";
import brandIcon from "@/assets/diamony-brand-icon.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Payment & Certification Icons (inline SVGs for grayscale styling)
const VisaIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto grayscale opacity-50 hover:opacity-70 transition-opacity">
    <rect fill="#1A1F71" width="48" height="32" rx="4"/>
    <text x="24" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">VISA</text>
  </svg>
);

const MastercardIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto grayscale opacity-50 hover:opacity-70 transition-opacity">
    <rect fill="#EB001B" width="48" height="32" rx="4"/>
    <circle cx="18" cy="16" r="10" fill="#EB001B"/>
    <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
    <path d="M24 8.5a10 10 0 0 0 0 15" fill="#FF5F00"/>
  </svg>
);

const PayPalIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto grayscale opacity-50 hover:opacity-70 transition-opacity">
    <rect fill="#003087" width="48" height="32" rx="4"/>
    <text x="24" y="20" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">PayPal</text>
  </svg>
);

const GIAIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto grayscale opacity-50 hover:opacity-70 transition-opacity">
    <rect fill="#0033A0" width="48" height="32" rx="4"/>
    <text x="24" y="20" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">GIA</text>
  </svg>
);

const Footer = () => {
  const { getEnabledPlatforms } = useSocialSettings();
  const { isEmailFormsEnabled } = useEmailFormsEnabled();
  const brand = useBrandSettings();
  const footerSocialPlatforms = getEnabledPlatforms('footer');

  const shopLinks = [
    { label: "טבעות אירוסין", href: "/catalog?category=rings" },
    { label: "טבעות נישואין", href: "/catalog?category=rings" },
    { label: "יהלומים", href: "/catalog" },
    { label: "קטלוג מלא", href: "/catalog" },
  ];

  const educationLinks = [
    { label: "מדריך יהלומים", href: "/blog" },
    { label: "יהלומים אתיים", href: "/blog" },
    { label: "מדריך מידות טבעות", href: "/contact" },
    { label: "תעודות ואישורים", href: "/blog" },
  ];

  const supportLinks = [
    { label: "צור קשר", href: "/contact" },
    { label: "משלוחים והחזרות", href: "/returns-policy" },
    { label: "שאלות נפוצות", href: "/contact" },
    { label: "למי זה מתאים", href: "/who-it-fits" },
    { label: "סטודיו דיגיטלי", href: "/digital-atelier" },
  ];

  const legalLinks = [
    { label: "הצהרת נגישות", href: "/accessibility" },
    { label: "מדיניות פרטיות", href: "/privacy" },
    { label: "תקנון האתר", href: "/terms" },
  ];

  const FooterColumn = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => (
    <div>
      <h4 className="font-heading text-accent text-sm uppercase tracking-[0.15em] mb-6">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.href}
              className="text-foreground text-sm font-body hover:text-accent transition-colors underline-offset-2 hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const AccordionColumn = ({ value, title, links }: { value: string; title: string; links: { label: string; href: string }[] }) => (
    <AccordionItem value={value} className="border-b border-footer-border">
      <AccordionTrigger className="font-heading text-accent text-sm uppercase tracking-[0.15em] py-4 hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent forceMount className="data-[state=closed]:hidden">
        <ul className="space-y-3 pb-4">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                to={link.href}
                className="text-foreground text-sm font-body hover:text-accent transition-colors underline-offset-2 hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <footer className="bg-footer">
      {/* Newsletter Section */}
      <div className="border-b border-footer-border">
        <div className="container-luxury py-16 text-center">
          <h3 className="font-heading text-2xl tracking-[0.15em] uppercase mb-3 text-foreground">
            JOIN THE {brand.brand_name.toUpperCase()} CIRCLE
          </h3>
          <p className="text-muted-foreground mb-8 font-body max-w-md mx-auto">
            Be the first to know about new collections and exclusive offers.
          </p>

          {isEmailFormsEnabled ? (
            <form className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-footer-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent font-body text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground uppercase tracking-[0.1em] text-sm font-body hover:bg-primary/90 transition-all"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <ContactFallbackButtons variant="light" />
          )}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-luxury py-16">
        {/* Desktop: 5 Column Grid */}
        <div className="hidden lg:grid grid-cols-5 gap-10">
          {/* Brand */}
          <div>
            <img
              src={brandIcon}
              alt={brand.brand_name}
              className="h-14 w-14 mb-6 object-contain"
              loading="lazy"
            />
            <p className="text-muted-foreground text-sm leading-relaxed font-body mb-6">
              {brand.footer_about_text}
            </p>
            <div className="flex gap-4">
              {footerSocialPlatforms.map((platform) => (
                <a
                  key={platform.platform}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-gold-dark transition-colors"
                  aria-label={platform.platform}
                >
                  <SocialIcon platform={platform.platform} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="חנות" links={shopLinks} />
          <FooterColumn title="חינוך ואמון" links={educationLinks} />
          <FooterColumn title="תמיכה" links={supportLinks} />
          <FooterColumn title="משפטים ורגולציה" links={legalLinks} />
        </div>

        {/* Mobile/Tablet: Accordion Layout */}
        <div className="lg:hidden">
          <div className="text-center mb-10 pb-8 border-b border-footer-border">
            <img
              src={brandIcon}
              alt={brand.brand_name}
              className="h-14 w-14 mx-auto mb-4 object-contain"
              loading="lazy"
            />
            <p className="text-muted-foreground text-sm leading-relaxed font-body mb-6 max-w-xs mx-auto">
              {brand.footer_about_text}
            </p>
            <div className="flex justify-center gap-4">
              {footerSocialPlatforms.map((platform) => (
                <a
                  key={platform.platform}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-gold-dark transition-colors"
                  aria-label={platform.platform}
                >
                  <SocialIcon platform={platform.platform} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <Accordion type="multiple" className="w-full">
            <AccordionColumn value="shop" title="חנות" links={shopLinks} />
            <AccordionColumn value="education" title="חינוך ואמון" links={educationLinks} />
            <AccordionColumn value="support" title="תמיכה" links={supportLinks} />
            <AccordionColumn value="legal" title="משפטים ורגולציה" links={legalLinks} />
          </Accordion>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="border-t border-footer-border">
        <div className="container-luxury py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-xs text-muted-foreground font-body">
            <span>© {new Date().getFullYear()} {brand.brand_name}. All rights reserved.</span>
            <span className="hidden md:inline">|</span>
            <Link to="/terms" className="hover:text-accent transition-colors underline-offset-2 hover:underline">
              Terms of Use
            </Link>
            <span className="hidden md:inline">|</span>
            <Link to="/privacy" className="hover:text-accent transition-colors underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <VisaIcon />
            <MastercardIcon />
            <PayPalIcon />
            <span className="w-px h-5 bg-footer-border mx-1" />
            <GIAIcon />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
