import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Loader2, Star, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AdminPinGate from "@/components/admin/AdminPinGate";
import HomepageFeaturedManager from "@/components/admin/merchandising/HomepageFeaturedManager";
import CategorySortManager from "@/components/admin/merchandising/CategorySortManager";

const AdminMerchandising = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAdminAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-[#c9a96e]" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/diamony-secure-admin");
    return null;
  }

  return (
    <AdminPinGate>
      <Helmet>
        <title>ויזואל מרצ'נדייזינג | DiamoNY Admin</title>
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
        {/* Top Bar */}
        <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-[#1f1f1f]">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-[#888] hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 ml-1" />
                חזרה
              </Button>
              <div className="h-5 w-px bg-[#1f1f1f]" />
              <h1 className="text-sm font-serif font-bold tracking-wider text-[#c9a96e]">
                Visual Merchandising
              </h1>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="homepage" className="w-full">
          <div className="border-b border-[#1f1f1f] px-4 md:px-6">
            <TabsList className="bg-transparent h-11 gap-1 p-0">
              <TabsTrigger
                value="homepage"
                className="data-[state=active]:bg-[#c9a96e]/10 data-[state=active]:text-[#c9a96e] data-[state=active]:shadow-none text-[#888] rounded-lg px-4 py-2 text-xs gap-1.5"
              >
                <Star className="w-3.5 h-3.5" />
                ניהול דף הבית
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-[#c9a96e]/10 data-[state=active]:text-[#c9a96e] data-[state=active]:shadow-none text-[#888] rounded-lg px-4 py-2 text-xs gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                סידור קטגוריות
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="homepage" className="p-4 md:p-6 mt-0">
            <HomepageFeaturedManager />
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <CategorySortManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPinGate>
  );
};

export default AdminMerchandising;
