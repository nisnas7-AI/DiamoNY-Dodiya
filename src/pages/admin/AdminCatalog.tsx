import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, ArrowRight, Upload, FolderOpen, Package, Zap } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import MediaManager from "@/components/admin/MediaManager";
import CategoryManager from "@/components/admin/CategoryManager";
import ProductManager from "@/components/admin/ProductManager";
import QuickUploadForm from "@/components/admin/QuickUploadForm";

const AdminCatalog = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("bulk");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/diamony-secure-admin");
    }
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

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>ניהול קטלוג | DiamoNY Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <ArrowRight className="h-4 w-4 ml-2" />
                חזרה ללוח בקרה
              </Button>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground">
                  ניהול קטלוג
                </h1>
                <p className="text-muted-foreground text-sm">העלאת מדיה, קטגוריות ומוצרים</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                העלאה מהירה
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                מדיה
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                קטגוריות
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                מוצרים
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bulk">
              <QuickUploadForm />
            </TabsContent>

            <TabsContent value="media">
              <MediaManager />
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>

            <TabsContent value="products">
              <ProductManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminCatalog;
