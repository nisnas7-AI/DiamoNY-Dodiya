// @stable — do not modify without architectural review
import { lazy, Suspense, useState, useEffect } from "react";
import { useLocation, BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { featureFlags } from "@/lib/featureFlags";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { SocialSettingsProvider } from "@/contexts/SocialSettingsContext";
import { VipProvider } from "@/contexts/VipContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { BrandSettingsProvider } from "@/contexts/BrandSettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import LuxuryPreloader from "@/components/LuxuryPreloader";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";

// ─── Cart Drawer (lazy — only needed on interaction) ──────────────────────────
const CartDrawer = lazy(() => import("./components/CartDrawer"));

// ─── Eager: critical path only ───────────────────────────────────────────────
import Index from "./pages/Index";

// ─── Customer-facing pages ────────────────────────────────────────────────────
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Catalog = lazy(() => import("./pages/Catalog"));
const EngagementRings = lazy(() => import("./pages/EngagementRings"));
const GemstoneRings = lazy(() => import("./pages/GemstoneRings"));
const PearlNecklaces = lazy(() => import("./pages/PearlNecklaces"));
const MensJewelry = lazy(() => import("./pages/MensJewelry"));
const MensPendants = lazy(() => import("./pages/MensPendants"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ReturnsPolicy = lazy(() => import("./pages/ReturnsPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Promo = lazy(() => import("./pages/Promo"));
const GoldBuying = lazy(() => import("./pages/GoldBuying"));
const GemologicalCertificates = lazy(() => import("./pages/GemologicalCertificates"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const TheLounge = lazy(() => import("./pages/TheLounge"));
const NfcCatalog = lazy(() => import("./pages/NfcCatalog"));
const NfcCategoryDetail = lazy(() => import("./pages/NfcCategoryDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const DigitalAtelier = lazy(() => import("./pages/DigitalAtelier"));
const WhoItFits = lazy(() => import("./pages/WhoItFits"));
const DigitalCard = lazy(() => import("./pages/DigitalCard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ─── Admin chunk (isolated — never downloaded by public visitors) ─────────────
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAuth = lazy(() => import("./pages/admin/AdminAuth"));
const AdminCatalog = lazy(() => import("./pages/admin/AdminCatalog"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminMerchandising = lazy(() => import("./pages/admin/AdminMerchandising"));
const ResetPassword = lazy(() => import("./pages/admin/ResetPassword"));
const RequireAuth = lazy(() => import("./components/RequireAuth"));

// ─── Deferred UI ──────────────────────────────────────────────────────────────
const ExitIntentPopup = lazy(() => import("./components/ExitIntentPopup"));
const StickySocialBar = lazy(() => import("./components/StickySocialBar"));
const VipMagicLinkHandler = lazy(() => import("./components/VipMagicLinkHandler"));
const MobileBottomBar = lazy(() => import("./components/MobileBottomBar"));

// ─────────────────────────────────────────────────────────────────────────────
// @stable — do not modify without architectural review
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (
            msg.includes("403") ||
            msg.includes("401") ||
            msg.includes("permission") ||
            msg.includes("policy")
          ) {
            return false;
          }
          // Don't retry 429 — let backoff handle it
          if (msg.includes("429") || msg.includes("too many") || msg.includes("rate limit")) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});

// ─── Customer-only overlays (not rendered on /admin/* routes) ────────────────
const CustomerOverlays = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/diamony-secure-admin");

  useDynamicFavicon();

  if (isAdmin) return null;

  return (
    <Suspense fallback={null}>
      <StickySocialBar />
      <VipMagicLinkHandler />
      <ExitIntentPopup />
      <MobileBottomBar />
    </Suspense>
  );
};

const App = () => {
  const [preloaderDone, setPreloaderDone] = useState(false);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrandSettingsProvider>
        <SocialSettingsProvider>
          <CookieConsentProvider>
          <VipProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />

              {/* Luxury preloader overlay — content renders hidden beneath so
                  queries and asset loads run in parallel with the animation */}
              {!preloaderDone && (
                <LuxuryPreloader onComplete={() => setPreloaderDone(true)} />
              )}

              <BrowserRouter>
                {preloaderDone && <CustomerOverlays />}
                {preloaderDone && (
                  <Suspense fallback={null}>
                    <CartDrawer />
                  </Suspense>
                )}
                {/* Content tree always mounts so React Query queries fire immediately,
                    but stays invisible until the preloader animation finishes */}
                <div
                  aria-hidden={!preloaderDone}
                  style={{
                    visibility: preloaderDone ? 'visible' : 'hidden',
                    opacity: preloaderDone ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    /* allow layout to compute so assets load, but user sees nothing */
                    position: preloaderDone ? 'relative' : 'fixed',
                    width: '100%',
                    ...(preloaderDone ? {} : { top: 0, left: 0, pointerEvents: 'none' as const }),
                  }}
                >
                  <RouteErrorBoundary>
                  <Suspense fallback={null}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/catalog/:categorySlug?" element={<Catalog />} />
                      <Route path="/category/engagement-rings" element={<EngagementRings />} />
                      <Route path="/category/gemstone-rings" element={<GemstoneRings />} />
                      <Route path="/category/pearl-necklaces" element={<PearlNecklaces />} />
                      <Route path="/category/mens-jewelry" element={<MensJewelry />} />
                      <Route path="/category/mens-pendants" element={<MensPendants />} />
                      <Route path="/product/:productSlug" element={<ProductDetail />} />
                      <Route path="/collections/pearl-jewelry" element={<Catalog />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="/the-lounge" element={<TheLounge />} />
                      <Route path="/diamony-secure-admin" element={<AdminAuth />} />
                      <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
                      <Route path="/admin/catalog" element={<RequireAuth><AdminCatalog /></RequireAuth>} />
                      <Route path="/admin/inventory" element={<RequireAuth><AdminInventory /></RequireAuth>} />
                      <Route path="/admin/merchandising" element={<RequireAuth><AdminMerchandising /></RequireAuth>} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/returns-policy" element={<ReturnsPolicy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/promo/:slug" element={<Promo />} />
                      <Route path="/gold-buying" element={<GoldBuying />} />
                      <Route path="/knowledge/gemological-certificates" element={<GemologicalCertificates />} />
                      <Route path="/accessibility" element={<Accessibility />} />
                      <Route path="/page/:slug" element={<DynamicPage />} />
                      {featureFlags.nfcCatalog && (
                        <>
                          <Route path="/nfc-catalog" element={<NfcCatalog />} />
                          <Route path="/nfc-catalog/:slug" element={<NfcCategoryDetail />} />
                        </>
                      )}
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/digital-atelier" element={<DigitalAtelier />} />
                      <Route path="/who-it-fits" element={<WhoItFits />} />
                      {featureFlags.digitalCard && (
                        <>
                          <Route path="/digital-card" element={<DigitalCard />} />
                          <Route path="/q/r" element={<Navigate to="/digital-card?ref=qr" replace />} />
                        </>
                      )}
                      
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  </RouteErrorBoundary>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
          </VipProvider>
          </CookieConsentProvider>
        </SocialSettingsProvider>
        </BrandSettingsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
