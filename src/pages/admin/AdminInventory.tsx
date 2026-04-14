import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, ArrowRight, Package } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import InventoryManager from "@/components/admin/InventoryManager";

const AdminInventory = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAdminAuth();

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
        <title>ניהול מלאי | DiamoNY Admin</title>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-bold text-foreground">
                    ניהול מלאי
                  </h1>
                  <p className="text-muted-foreground text-sm">מעקב סטטוס מוצרים ומק"ט</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <InventoryManager />
        </div>
      </div>
    </>
  );
};

export default AdminInventory;
