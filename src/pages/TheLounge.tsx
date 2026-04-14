import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVip } from "@/contexts/VipContext";
import { Helmet } from "react-helmet-async";
import VipOnboardingModal from "@/components/VipOnboardingModal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Trash2, Calendar, Gift, LogOut, Store, LayoutGrid, GalleryHorizontalEnd, Heart, Send, Lock, Sparkles } from "lucide-react";
import VaultLoginModal from "@/components/VaultLoginModal";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import WishlistHeart from "@/components/catalog/WishlistHeart";
import ConciergeOfferInterstitial from "@/components/ConciergeOfferInterstitial";
import VIPReviewWidget from "@/components/VIPReviewWidget";


const TheLounge = () => {
  const { member, isVip, isLoading, needsOnboarding, isImpersonating, logout, stopImpersonation } = useVip();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<string>("grid");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConciergeOffer, setShowConciergeOffer] = useState(true);

  // Check for unread concierge offers
  const { data: conciergeOffer } = useQuery({
    queryKey: ["vip-concierge-offer", member?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vip_personalized_offers")
        .select("id, heading, message")
        .eq("member_id", member!.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || null;
    },
    enabled: !!member?.id && !isImpersonating,
  });

  useEffect(() => {
    if (!isLoading && isVip && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [isLoading, isVip, needsOnboarding]);

  const [showVaultLogin, setShowVaultLogin] = useState(false);

  const { data: vipProducts } = useQuery({
    queryKey: ["vip-lounge-products", member?.gender_preference],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_product_rules")
        .select("*, products!inner(*)");
      if (error) throw error;
      return (data || [])
        .filter((rule: any) => rule.products?.is_active)
        .map((rule: any) => ({
          ...rule.products,
          discount_percentage: Number(rule.discount_percentage),
          is_vip_exclusive: rule.is_vip_exclusive,
        }));
    },
    enabled: !!member,
  });

  const { data: specialDates } = useQuery({
    queryKey: ["vip-special-dates", member?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_special_dates")
        .select("*")
        .eq("member_id", member!.id)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!member,
  });

  // Private Collection - saved items
  const { data: savedProducts } = useQuery({
    queryKey: ["vip-private-collection", member?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_saved_items")
        .select("*, products!inner(id, name, slug, main_image_url, price)")
        .eq("member_id", member!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!member,
  });

  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  const addDateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vip_special_dates").insert({
        member_id: member!.id,
        event_name: newEventName,
        event_date: newEventDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vip-special-dates"] });
      setNewEventName("");
      setNewEventDate("");
      toast.success("תאריך נשמר בהצלחה");
    },
  });

  const deleteDateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vip_special_dates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vip-special-dates"] });
      toast.success("תאריך נמחק");
    },
  });

  // Compute next upcoming event countdown
  const nextEventCountdown = useMemo(() => {
    if (!specialDates || specialDates.length === 0) return null;
    const now = new Date();
    const upcoming = specialDates
      .map((d: any) => ({ ...d, diff: new Date(d.event_date).getTime() - now.getTime() }))
      .filter((d: any) => d.diff > 0)
      .sort((a: any, b: any) => a.diff - b.diff);
    if (upcoming.length === 0) return null;
    const days = Math.ceil(upcoming[0].diff / (1000 * 60 * 60 * 24));
    return { days, name: upcoming[0].event_name };
  }, [specialDates]);

  if (isLoading) return null;

  // Gateway view for non-VIP users — modal triggers only on explicit action
  if (!isVip) {
    return (
      <>
        <Helmet>
          <title>הטרקלין | DiamoNY VIP</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-primary to-foreground flex items-center justify-center px-4" dir="rtl">
          <div className="max-w-md w-full text-center space-y-8 py-20">
            <div className="w-20 h-px mx-auto bg-gradient-to-r from-transparent via-gold-warm to-transparent" />

            <Lock className="w-10 h-10 text-gold-warm mx-auto" />

            <h1 className="text-3xl md:text-4xl font-heading text-gold-warm tracking-wide leading-relaxed">
              הטרקלין של DiamoNY
            </h1>

            <p className="text-primary-foreground/70 text-base font-body leading-loose max-w-sm mx-auto">
              אזור בלעדי ללקוחות המותג — הטבות VIP, מחירים מיוחדים ושירות אישי.
              <br />
              הזינו את מפתח הגישה שלכם כדי להיכנס.
            </p>

            <div className="w-12 h-px mx-auto bg-gradient-to-r from-transparent via-gold-warm/40 to-transparent" />

            <Button
              onClick={() => setShowVaultLogin(true)}
              className="rounded-xl bg-gold-warm hover:bg-gold-warm-hover text-primary font-semibold text-base tracking-wide h-13 px-10 transition-all duration-300 hover:scale-[1.03] gap-2"
            >
              <Sparkles className="w-5 h-5" />
              כניסה לטרקלין
            </Button>

            <button
              onClick={() => navigate("/")}
              className="block mx-auto text-sm text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors duration-300 font-body tracking-wide"
            >
              חזרה לאתר הראשי
            </button>
          </div>
        </main>
        <Footer />
        <VaultLoginModal isOpen={showVaultLogin} onClose={() => setShowVaultLogin(false)} />
      </>
    );
  }

  if (!member) return null;

  if (showOnboarding) {
    return (
      <>
        <Helmet>
          <title>הטרקלין | DiamoNY VIP</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-primary" />
        <VipOnboardingModal
          isOpen={true}
          onComplete={() => setShowOnboarding(false)}
        />
      </>
    );
  }

  const getWhatsAppLink = (productName: string) => {
    const message = encodeURIComponent(
      `היי, אני מעוניין/ת ב: ${productName}. סטטוס VIP שלי פעיל.`
    );
    return `https://wa.me/972546290534?text=${message}`;
  };

  const calculateVipPrice = (price: number, discount: number) => {
    return Math.round(price * (1 - discount / 100));
  };

  const ProductCard = ({ product }: { product: any }) => {
    const originalPrice = Number(product.price) || 0;
    const vipPrice = calculateVipPrice(originalPrice, product.discount_percentage);

    return (
      <Card className="overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] min-w-[280px] flex-shrink-0 snap-start">
        <div className="relative aspect-square max-h-[400px] bg-background flex items-center justify-center rounded-t-2xl overflow-hidden">
          <img
            src={product.main_image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-contain p-2 rounded-xl"
          />
          {product.is_vip_exclusive && (
            <Badge className="absolute top-3 right-3 bg-gold-warm text-primary border-0 rounded-full font-semibold">
              בלעדי VIP
            </Badge>
          )}
          {product.discount_percentage > 0 && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 rounded-full">
              {product.discount_percentage}% הנחה
            </Badge>
          )}
        </div>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-heading text-lg font-semibold">{product.name}</h3>
          {originalPrice > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground line-through text-sm">
                ₪{originalPrice.toLocaleString("he-IL")}
              </span>
              <span className="text-gold-warm font-bold text-xl">
                ₪{vipPrice.toLocaleString("he-IL")}
              </span>
            </div>
          )}
          <a
            href={getWhatsAppLink(product.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            שלח פנייה בוואטסאפ
          </a>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Concierge Offer Interstitial — overrides default welcome */}
      {showConciergeOffer && conciergeOffer && (
        <ConciergeOfferInterstitial
          offer={conciergeOffer}
          onDismiss={() => setShowConciergeOffer(false)}
        />
      )}

      <Helmet>
        <title>הטרקלין | DiamoNY VIP</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background" dir="rtl">
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-black text-center py-2 px-4 font-semibold text-sm flex items-center justify-center gap-3">
            <span>🔍 מצב צפייה כלקוח: {member.full_name}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { stopImpersonation(); navigate("/admin?tab=vault"); }}
              className="bg-white/90 hover:bg-white border-0 rounded-full text-xs h-7"
            >
              יציאה מצפייה
            </Button>
          </div>
        )}

        {/* Two-Box Header */}
        <div className="bg-gradient-to-b from-primary to-foreground py-10 px-4">
          <div className="container mx-auto max-w-5xl flex flex-col md:flex-row gap-4">
            {/* Box 1 - Personalization */}
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[1.5rem] p-8 text-center md:text-right">
              <h1 className="text-2xl md:text-3xl font-heading text-gold-warm mb-3">
                ברוך/ה הבא/ה {member.full_name}
              </h1>
              <p className="text-white text-lg font-body mb-2">
                יתרת הקרדיט שלך{" "}
                <span className="font-bold text-gold-warm">
                  ₪{member.credit_balance.toLocaleString("he-IL")}
                </span>{" "}
                ש"ח
              </p>
              {nextEventCountdown && (
                <p className="text-white/60 text-sm font-body mt-3">
                  עוד <span className="text-gold-warm font-semibold">{nextEventCountdown.days}</span> ימים ל{nextEventCountdown.name}
                </p>
              )}
              <div className="mt-5">
                <Button
                  variant="ghost"
                  onClick={() => { logout(); navigate("/"); }}
                  className="rounded-full text-white/50 hover:text-white hover:bg-white/10 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 ml-1" />
                  יציאה
                </Button>
              </div>
            </div>

            {/* Box 2 - Navigation */}
            <div className="md:w-64 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[1.5rem] p-8 flex items-center justify-center">
              <Button
                onClick={() => navigate("/")}
                className="w-full rounded-xl bg-gold-warm hover:bg-gold-warm-hover text-primary font-semibold text-sm tracking-wide h-12 transition-all duration-300 hover:scale-[1.02]"
              >
                <Store className="w-4 h-4 ml-2" />
                חזרה לאתר הראשי
              </Button>
            </div>
          </div>

          {/* VIP Review Widget — above the fold */}
          <div className="container mx-auto max-w-5xl mt-4 space-y-4">
            <VIPReviewWidget creditAmount={member.credit_balance} />
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-10 space-y-10">
          {/* VIP Products */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading flex items-center gap-2">
                <Gift className="w-6 h-6 text-gold-warm" />
                הפריטים הבלעדיים שלך
              </h2>

              {/* View Toggle */}
              {vipProducts && vipProducts.length > 1 && (
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(v) => v && setViewMode(v)}
                  className="bg-white rounded-xl p-1 shadow-sm border border-border"
                >
                  <ToggleGroupItem
                    value="grid"
                    aria-label="תצוגת רשת"
                    className="rounded-lg px-3 py-1.5 data-[state=on]:bg-gold-warm/15 data-[state=on]:text-gold-warm"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="carousel"
                    aria-label="תצוגת סליידר"
                    className="rounded-lg px-3 py-1.5 data-[state=on]:bg-gold-warm/15 data-[state=on]:text-gold-warm"
                  >
                    <GalleryHorizontalEnd className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </div>

            {vipProducts && vipProducts.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vipProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                  {vipProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )
            ) : (
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>פריטים בלעדיים יתווספו בקרוב</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Private Collection */}
          <section>
            <h2 className="text-2xl font-heading mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-gold-warm" />
              הקולקציה הפרטית שלי
            </h2>

            {savedProducts && savedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedProducts.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden rounded-2xl border-0 shadow-sm hover:shadow-md transition-all group">
                    <Link to={`/product/${item.products.slug}`} className="block">
                      <div className="relative aspect-square max-h-[400px] bg-background flex items-center justify-center rounded-t-2xl overflow-hidden">
                        <img
                          src={item.products.main_image_url || "/placeholder.svg"}
                          alt={item.products.name}
                          className="w-full h-full object-contain p-2 rounded-xl"
                        />
                        <div className="absolute top-2 left-2 z-10">
                          <WishlistHeart
                            productId={item.products.id}
                            className="bg-black/30 backdrop-blur-sm hover:bg-black/50"
                          />
                        </div>
                      </div>
                      <CardContent className="p-3 space-y-1">
                        <h4 className="text-sm font-semibold line-clamp-1">{item.products.name}</h4>
                        {item.products.price && (
                          <p className="text-xs text-gold-warm font-bold">₪{Number(item.products.price).toLocaleString("he-IL")}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          נשמר {new Date(item.created_at).toLocaleDateString("he-IL")}
                        </p>
                      </CardContent>
                    </Link>
                    <div className="px-3 pb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs rounded-lg border-gold-warm/30 text-gold-warm hover:bg-gold-warm/10"
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info("פיצ'ר 'Drop a Hint' יהיה זמין בקרוב!");
                        }}
                      >
                        <Send className="w-3 h-3 ml-1" />
                        Drop a Hint
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>לחצו על ❤️ ליד פריטים שאתם אוהבים כדי לשמור אותם כאן</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Special Dates */}
          <section>
            <h2 className="text-2xl font-heading mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-gold-warm" />
              תאריכים מיוחדים
            </h2>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                {specialDates && specialDates.length > 0 && (
                  <div className="space-y-2">
                    {specialDates.map((date: any) => (
                      <div key={date.id} className="flex items-center justify-between p-3 rounded-xl bg-background">
                        <div>
                          <span className="font-medium">{date.event_name}</span>
                          <span className="text-muted-foreground text-sm mr-3">
                            {new Date(date.event_date).toLocaleDateString("he-IL")}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDateMutation.mutate(date.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Input
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="שם האירוע (למשל: יום נישואין)"
                    className="rounded-xl"
                  />
                  <Input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="rounded-xl"
                    dir="ltr"
                  />
                  <Button
                    onClick={() => addDateMutation.mutate()}
                    disabled={!newEventName || !newEventDate || addDateMutation.isPending}
                    className="rounded-xl bg-gold-warm hover:bg-gold-warm-hover shrink-0"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default TheLounge;
