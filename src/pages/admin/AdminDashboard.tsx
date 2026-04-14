import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Loader2, Lock, Scale, ShieldCheck, Settings, Home, DollarSign, Share2, BookOpen, FormInput, BarChart3, Layers, Bot, ArrowLeft, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import LeadsManager from "@/components/admin/LeadsManager";
import BlogManager from "@/components/admin/BlogManager";
import SiteContentManager from "@/components/admin/SiteContentManager";
import HomepageManager from "@/components/admin/HomepageManager";
import SocialIntegrationsManager from "@/components/admin/SocialIntegrationsManager";
import { GlobalPricingDashboard } from "@/components/admin/GlobalPricingDashboard";
import { ProductStoryManager } from "@/components/admin/ProductStoryManager";
import CertificateManager from "@/components/admin/CertificateManager";
import EmailFormsToggle from "@/components/admin/EmailFormsToggle";
import PagesManager from "@/components/admin/PagesManager";
import RobotsTxtManager from "@/components/admin/RobotsTxtManager";
import LegalPagesEditor from "@/components/admin/LegalPagesEditor";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";
import AdminPinGate from "@/components/admin/AdminPinGate";
import AdminPinSettings from "@/components/admin/AdminPinSettings";
import MfaEnrollment from "@/components/admin/MfaEnrollment";
import VaultManager from "@/components/admin/VaultManager";
import ProductionPipelineComponent from "@/components/admin/ProductionPipeline";
import NfcCatalogManager from "@/components/admin/NfcCatalogManager";
import BrandSettingsManager from "@/components/admin/BrandSettingsManager";
import AtelierEditor from "@/components/admin/AtelierEditor";
import WebPresenceCard from "@/components/admin/dashboard/WebPresenceCard";
import { Helmet } from "react-helmet-async";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";

import AdminSidebar, { SIDEBAR_CATEGORIES } from "@/components/admin/dashboard/AdminSidebar";
import CategoryWidgetCanvas from "@/components/admin/dashboard/CategoryWidgetCanvas";
import AdminSearchBar from "@/components/admin/dashboard/AdminSearchBar";

const MarketingDashboard = lazy(() => import("@/components/admin/MarketingDashboard"));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin, isLoading, signOut } = useAdminAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = searchParams.get("cat") || "dashboard";
  const activeTab = searchParams.get("tab") || null;

  // Check if this category has a directTab (flattened navigation)
  const activeCategoryCfg = SIDEBAR_CATEGORIES.find((c) => c.id === activeCategory);
  const effectiveTab = activeTab || activeCategoryCfg?.directTab || null;

  const setActiveCategory = useCallback((cat: string) => {
    const cfg = SIDEBAR_CATEGORIES.find((c) => c.id === cat);
    // Handle external page navigations
    if (cfg?.directTab === "catalog-link") {
      navigate("/admin/catalog");
      return;
    }
    if (cfg?.directTab === "inventory-link") {
      navigate("/admin/inventory");
      return;
    }
    if (cfg?.directTab === "merchandising-link") {
      navigate("/admin/merchandising");
      return;
    }
    if (cfg?.directTab) {
      setSearchParams({ cat, tab: cfg.directTab }, { replace: true });
    } else {
      setSearchParams({ cat }, { replace: true });
    }
  }, [setSearchParams, navigate]);

  const drillDown = useCallback((tab: string) => {
    setSearchParams({ cat: activeCategory, tab }, { replace: true });
  }, [setSearchParams, activeCategory]);

  const backToCanvas = useCallback(() => {
    setSearchParams({ cat: activeCategory }, { replace: true });
  }, [setSearchParams, activeCategory]);

  // Stabilized redirect: wait 600ms after isLoading=false before redirecting
  // to avoid false redirects during auth state transitions
  useEffect(() => {
    if (isLoading) return;
    if (user && isAdmin) return;

    const timer = setTimeout(() => {
      navigate("/diamony-secure-admin");
    }, 600);

    return () => clearTimeout(timer);
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/diamony-secure-admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const sidebarWidth = sidebarCollapsed ? 64 : 220;
  const showBackButton = activeTab && !activeCategoryCfg?.directTab;

  return (
    <AdminPinGate>
      <>
        <Helmet>
          <title>ניהול אתר | DiamoNY Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <div className="min-h-screen bg-background" dir="rtl">
          {/* Sidebar (forced LTR / left-aligned) */}
          <AdminSidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
          />

          {/* Main Content - margin on LEFT to clear the sidebar */}
          <motion.div
            initial={false}
            animate={{ marginLeft: sidebarWidth }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="min-h-screen"
            style={{ marginRight: 0 }}
          >
            {/* Top Bar */}
            <div className="border-b bg-card sticky top-0 z-30">
              <div className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  {showBackButton && (
                    <button
                      onClick={backToCanvas}
                      className="flex items-center gap-1.5 text-sm text-[#c9a96e] hover:text-[#c9a96e]/80 transition-colors font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      חזרה
                    </button>
                  )}
                  <h1 className="text-lg font-serif font-bold text-foreground truncate">
                    {activeCategoryCfg?.label || "DiamoNY Admin"}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <AdminSearchBar value={searchQuery} onChange={setSearchQuery} />
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0 min-h-[40px]">
                    <LogOut className="h-4 w-4 ml-1" />
                    <span className="hidden sm:inline">התנתק</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {!effectiveTab ? (
                  <motion.div
                    key={`canvas-${activeCategory}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                     <CategoryWidgetCanvas
                       categoryId={activeCategory}
                       onDrillDown={drillDown}
                       searchFilter={searchQuery}
                     />
                    {activeCategory === "dashboard" && (
                      <div className="mt-6">
                        <WebPresenceCard />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`tab-${effectiveTab}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderTabContent(effectiveTab)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </>
    </AdminPinGate>
  );
};

function renderTabContent(tab: string) {
  switch (tab) {
    case "marketing":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />סטטיסטיקת חנות</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>}>
              <div className="p-6"><MarketingDashboard /></div>
            </Suspense>
          </CardContent>
        </Card>
      );
    case "pricing":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />תמחור גלובלי</CardTitle></CardHeader>
          <CardContent><GlobalPricingDashboard /></CardContent>
        </Card>
      );
    case "leads":
      return (
        <Card>
          <CardHeader><CardTitle>ניהול לידים</CardTitle></CardHeader>
          <CardContent><AdminErrorBoundary fallbackMessage="שגיאה בטעינת לידים"><LeadsManager /></AdminErrorBoundary></CardContent>
        </Card>
      );
    case "blog":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />בלוגים ומאמרים</CardTitle></CardHeader>
          <CardContent><BlogManager showAI /></CardContent>
        </Card>
      );
    case "homepage":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" />ניהול עמוד הבית</CardTitle></CardHeader>
          <CardContent><HomepageManager /></CardContent>
        </Card>
      );
    case "social":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />רשתות חברתיות</CardTitle></CardHeader>
          <CardContent><SocialIntegrationsManager /></CardContent>
        </Card>
      );
    case "stories":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />סיפורי מוצרים</CardTitle></CardHeader>
          <CardContent><ProductStoryManager /></CardContent>
        </Card>
      );
    case "certificates":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />תעודות גמולוגיות</CardTitle></CardHeader>
          <CardContent><CertificateManager /></CardContent>
        </Card>
      );
    case "content":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />ניהול תוכן</CardTitle></CardHeader>
          <CardContent><SiteContentManager /></CardContent>
        </Card>
      );
    case "forms":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FormInput className="h-5 w-5" />טפסי לידים</CardTitle></CardHeader>
          <CardContent><EmailFormsToggle /></CardContent>
        </Card>
      );
    case "pages":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" />עמודים דינמיים ומאמרים</CardTitle></CardHeader>
          <CardContent><PagesManager /></CardContent>
        </Card>
      );
    case "robots":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Robots.txt</CardTitle></CardHeader>
          <CardContent><RobotsTxtManager /></CardContent>
        </Card>
      );
    case "vault":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />ניהול הכספת</CardTitle></CardHeader>
          <CardContent><VaultManager /></CardContent>
        </Card>
      );
    case "legal":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" />עמודים משפטיים</CardTitle></CardHeader>
          <CardContent><LegalPagesEditor /></CardContent>
        </Card>
      );
    case "legal-forms":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" />טפסים משפטיים</CardTitle></CardHeader>
          <CardContent><LegalPagesEditor /></CardContent>
        </Card>
      );
    case "security":
      return <div className="space-y-6"><MfaEnrollment /></div>;
    case "settings":
      return <AdminPinSettings />;
    case "production-pipeline":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />ניהול תהליכי ייצור</CardTitle></CardHeader>
          <CardContent><ProductionPipelineComponent /></CardContent>
        </Card>
      );
    case "catalog-link":
      return null;
    case "inventory-link":
      return null;
    case "nfc-manager":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />ניהול קטלוג NFC</CardTitle></CardHeader>
          <CardContent><NfcCatalogManager /></CardContent>
        </Card>
      );
    case "brand-settings":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />הגדרות מערכת ומותג</CardTitle></CardHeader>
          <CardContent><BrandSettingsManager /></CardContent>
        </Card>
      );
    case "atelier":
      return (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />ניהול סטודיו דיגיטלי</CardTitle></CardHeader>
          <CardContent><AtelierEditor /></CardContent>
        </Card>
      );
    default:
      return <p className="text-muted-foreground">בחר ווידג'ט מהתפריט</p>;
  }
}

export default AdminDashboard;
