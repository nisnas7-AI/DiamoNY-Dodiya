import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, LayoutGrid, Megaphone, Star, Settings, MessageSquare, Users, PanelTop, FileText, Eye, Link2 } from "lucide-react";
import HeroManager from "./homepage/HeroManager";
import HomepageCategoriesManager from "./homepage/HomepageCategoriesManager";
import PromotionsManager from "./homepage/PromotionsManager";
import PromoBannerManager from "./homepage/PromoBannerManager";
import SectionDesignManager from "./homepage/SectionDesignManager";
import SectionContentManager from "./homepage/SectionContentManager";
import VisualSectionManager from "./homepage/VisualSectionManager";
import CustomProcessManager from "./homepage/CustomProcessManager";
import TestimonialsManager from "./homepage/TestimonialsManager";
import HeaderDesignManager from "./homepage/HeaderDesignManager";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import FourCsLinksManager from "./FourCsLinksManager";

const HomepageManager = () => {
  const [activeTab, setActiveTab] = useState("visual");
  const { isSuperAdmin } = useSuperAdminAuth();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6 flex-wrap h-auto gap-1">
        <TabsTrigger value="visual" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          מראה ויזואלית
        </TabsTrigger>
        <TabsTrigger value="header" className="flex items-center gap-2">
          <PanelTop className="h-4 w-4" />
          כותרת ותפריט
        </TabsTrigger>
        <TabsTrigger value="design" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          עיצוב כללי
        </TabsTrigger>
        <TabsTrigger value="content" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          תוכן סקציות
        </TabsTrigger>
        <TabsTrigger value="hero" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          באנר ראשי
        </TabsTrigger>
        <TabsTrigger value="categories" className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          קטגוריות
        </TabsTrigger>
        <TabsTrigger value="process" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          תהליך עיצוב
        </TabsTrigger>
        <TabsTrigger value="testimonials" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          המלצות
        </TabsTrigger>
        <TabsTrigger value="promotions" className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          מבצעים
        </TabsTrigger>
        <TabsTrigger value="links" className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          ניהול קישורים
        </TabsTrigger>
        {isSuperAdmin && (
          <TabsTrigger value="promo-banner" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            באנר פרסומי
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="visual">
        <VisualSectionManager />
      </TabsContent>

      <TabsContent value="header">
        <HeaderDesignManager />
      </TabsContent>

      <TabsContent value="design">
        <SectionDesignManager />
      </TabsContent>

      <TabsContent value="content">
        <SectionContentManager />
      </TabsContent>

      <TabsContent value="hero">
        <HeroManager />
      </TabsContent>

      <TabsContent value="categories">
        <HomepageCategoriesManager />
      </TabsContent>

      <TabsContent value="process">
        <CustomProcessManager />
      </TabsContent>

      <TabsContent value="testimonials">
        <TestimonialsManager />
      </TabsContent>

      <TabsContent value="promotions">
        <PromotionsManager />
      </TabsContent>

      <TabsContent value="links">
        <FourCsLinksManager />
      </TabsContent>

      {isSuperAdmin && (
        <TabsContent value="promo-banner">
          <PromoBannerManager />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default HomepageManager;
