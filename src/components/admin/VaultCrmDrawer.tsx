import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QRCodeSVG } from "qrcode.react";
import {
  Save, Loader2, QrCode, UserCheck, Copy, ExternalLink,
  X, Crown, Calendar, Heart, ShieldCheck, CreditCard, LogIn, Send
} from "lucide-react";
import { toast } from "sonner";
import ConciergeOfferModal from "./ConciergeOfferModal";

interface VaultCrmDrawerProps {
  member: any;
  isOpen: boolean;
  onClose: () => void;
  onImpersonate: (member: any) => void;
}

const VaultCrmDrawer = ({ member, isOpen, onClose, onImpersonate }: VaultCrmDrawerProps) => {
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [prefs, setPrefs] = useState({
    pref_jewelry_type: member?.pref_jewelry_type || "",
    pref_gold_color: member?.pref_gold_color || "",
    pref_stone: member?.pref_stone || "",
  });

  const directUrl = `https://diamony.me/?vip_login=true`;

  const { data: specialDates } = useQuery({
    queryKey: ["vault-360-dates", member?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vip_special_dates")
        .select("*")
        .eq("member_id", member.id)
        .order("event_date", { ascending: true });
      return data || [];
    },
    enabled: !!member?.id,
  });

  // Private Collection
  const { data: savedItems } = useQuery({
    queryKey: ["vault-360-saved", member?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vip_saved_items")
        .select("*, products!inner(id, name, slug, main_image_url, price)")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!member?.id,
  });

  const savePrefsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("vip_members")
        .update({
          pref_jewelry_type: prefs.pref_jewelry_type || null,
          pref_gold_color: prefs.pref_gold_color || null,
          pref_stone: prefs.pref_stone || null,
        })
        .eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      toast.success("העדפות נשמרו");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (is_active: boolean) => {
      const { error } = await supabase
        .from("vip_members")
        .update({ is_active })
        .eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      toast.success("סטטוס גישה עודכן");
    },
  });

  if (!member) return null;

  const lastVisit = member.updated_at
    ? new Date(member.updated_at).toLocaleDateString("he-IL", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg z-50 flex flex-col"
            style={{ backgroundColor: "hsl(0 0% 7%)" }}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[hsl(38,35%,50%)]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(38,35%,55%)] to-[hsl(38,35%,40%)] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[hsl(0,0%,7%)]" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-white">{member.full_name}</h2>
                  <p className="text-xs text-[hsl(38,35%,55%)]">Customer 360°</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <ScrollArea className="flex-1 px-6 py-5">
              <div className="space-y-6">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-[hsl(38,35%,55%)]" />
                    <div className="text-lg font-bold text-white">₪{Number(member.credit_balance).toLocaleString("he-IL")}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">קרדיט</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <LogIn className="w-4 h-4 mx-auto mb-1 text-[hsl(38,35%,55%)]" />
                    <div className="text-lg font-bold text-white">{member.login_count || 0}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">כניסות</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <Calendar className="w-4 h-4 mx-auto mb-1 text-[hsl(38,35%,55%)]" />
                    <div className="text-xs font-medium text-white mt-1">{lastVisit}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">ביקור אחרון</div>
                  </div>
                </div>

                {/* Vault Access Control */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[hsl(38,35%,55%)]" />
                      <span className="text-sm font-medium text-white">גישה לכספת</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">
                        {member.is_active ? "מאושר" : "חסום"}
                      </span>
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate(checked)}
                        className="data-[state=checked]:bg-[hsl(38,35%,55%)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[hsl(38,35%,55%)] uppercase tracking-wider">פרטי קשר</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">טלפון</span>
                      <span className="text-white font-mono text-xs" dir="ltr">{member.phone_key || "***"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">אימייל</span>
                      <span className="text-white text-xs">{member.email || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">הסכמה שיווקית</span>
                      <Badge
                        variant="outline"
                        className={member.marketing_consent
                          ? "border-green-500/30 text-green-400 bg-green-500/10"
                          : "border-red-500/30 text-red-400 bg-red-500/10"
                        }
                      >
                        {member.marketing_consent ? "כן" : "לא"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">הצטרף</span>
                      <span className="text-white text-xs">{new Date(member.created_at).toLocaleDateString("he-IL")}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Wishlist / Preferences */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[hsl(38,35%,55%)]" />
                    <h4 className="text-xs font-semibold text-[hsl(38,35%,55%)] uppercase tracking-wider">העדפות ו-Wishlist</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-white/40">סוג תכשיט</label>
                      <Select value={prefs.pref_jewelry_type} onValueChange={(v) => setPrefs(p => ({ ...p, pref_jewelry_type: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="בחר..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rings">טבעות</SelectItem>
                          <SelectItem value="necklaces">שרשראות</SelectItem>
                          <SelectItem value="earrings">עגילים</SelectItem>
                          <SelectItem value="bracelets">צמידים</SelectItem>
                          <SelectItem value="pendants">תליונים</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/40">צבע זהב</label>
                      <Select value={prefs.pref_gold_color} onValueChange={(v) => setPrefs(p => ({ ...p, pref_gold_color: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="בחר..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yellow">צהוב</SelectItem>
                          <SelectItem value="white">לבן</SelectItem>
                          <SelectItem value="rose">רוזה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/40">אבן מועדפת</label>
                      <Select value={prefs.pref_stone} onValueChange={(v) => setPrefs(p => ({ ...p, pref_stone: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="בחר..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diamonds">יהלומים</SelectItem>
                          <SelectItem value="pearls">פנינים</SelectItem>
                          <SelectItem value="gemstones">אבני חן</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => savePrefsMutation.mutate()}
                    disabled={savePrefsMutation.isPending}
                    className="bg-[hsl(38,35%,55%)] hover:bg-[hsl(38,35%,45%)] text-[hsl(0,0%,7%)] font-semibold"
                  >
                    {savePrefsMutation.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Save className="w-3.5 h-3.5 ml-1" /> שמור העדפות</>
                    }
                  </Button>
                </div>

                <Separator className="bg-white/10" />

                {/* Special Dates */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[hsl(38,35%,55%)]" />
                    <h4 className="text-xs font-semibold text-[hsl(38,35%,55%)] uppercase tracking-wider">
                      תאריכים מיוחדים ({specialDates?.length || 0})
                    </h4>
                  </div>
                  {specialDates && specialDates.length > 0 ? (
                    <div className="space-y-1.5">
                      {specialDates.map((d: any) => (
                        <div key={d.id} className="flex justify-between text-sm p-2.5 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-white">{d.event_name}</span>
                          <span className="text-white/40 text-xs">{new Date(d.event_date).toLocaleDateString("he-IL")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/30">אין תאריכים</p>
                  )}
                </div>

                <Separator className="bg-white/10" />

                {/* Private Collection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[hsl(38,35%,55%)]" />
                    <h4 className="text-xs font-semibold text-[hsl(38,35%,55%)] uppercase tracking-wider">
                      קולקציה פרטית ({savedItems?.length || 0})
                    </h4>
                  </div>
                  {savedItems && savedItems.length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {savedItems.map((item: any) => (
                          <div key={item.id} className="relative group rounded-lg overflow-hidden border border-white/10">
                            <img
                              src={item.products.main_image_url || "/placeholder.svg"}
                              alt={item.products.name}
                              className="w-full aspect-square object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                              <span className="text-[9px] text-white text-center leading-tight font-medium">{item.products.name}</span>
                              <span className="text-[8px] text-white/50 mt-0.5">
                                {new Date(item.created_at).toLocaleDateString("he-IL")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-[hsl(38,35%,55%)]/30 text-[hsl(38,35%,55%)] hover:bg-[hsl(38,35%,55%)]/10"
                        onClick={() => setShowOfferModal(true)}
                      >
                        <Send className="w-3.5 h-3.5 ml-1" />
                        שלח הצעת Concierge
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-white/30">אין פריטים שמורים</p>
                  )}
                </div>

                <Separator className="bg-white/10" />

                {/* QR / NFC */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[hsl(38,35%,55%)] uppercase tracking-wider">NFC / QR</h4>
                  <div className="flex items-center gap-2">
                    <Input value={directUrl} readOnly dir="ltr" className="text-xs font-mono bg-white/5 border-white/10 text-white" />
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 hover:bg-white/10"
                      onClick={() => { navigator.clipboard.writeText(directUrl); toast.success("הקישור הועתק"); }}
                    >
                      <Copy className="w-4 h-4 text-white/70" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQR(!showQR)}
                    className="border-white/10 text-white/70 hover:bg-white/10"
                  >
                    <QrCode className="w-4 h-4 ml-1" /> {showQR ? "הסתר QR" : "הצג QR"}
                  </Button>
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="flex justify-center p-4 bg-white rounded-xl">
                          <QRCodeSVG id="vault-qr-code-drawer" value={directUrl} size={160} />
                        </div>
                        <div className="flex justify-center gap-2 mt-3">
                          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/10" onClick={() => {
                            navigator.clipboard.writeText(directUrl); toast.success("הקישור הועתק");
                          }}>
                            <Copy className="w-4 h-4 ml-1" /> העתק
                          </Button>
                          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/10" onClick={() => {
                            const svg = document.getElementById("vault-qr-code-drawer");
                            if (!svg) return;
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = img.width * 2;
                              canvas.height = img.height * 2;
                              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                              const a = document.createElement("a");
                              a.download = `vip-qr-${member.id.slice(0, 8)}.png`;
                              a.href = canvas.toDataURL("image/png");
                              a.click();
                            };
                            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                          }}>
                            <ExternalLink className="w-4 h-4 ml-1" /> הורד
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>

            {/* Footer CTA */}
            <div className="px-6 py-4 border-t border-[hsl(38,35%,50%)]/20">
              <Button
                onClick={() => onImpersonate(member)}
                className="w-full bg-gradient-to-r from-[hsl(38,35%,55%)] to-[hsl(38,35%,40%)] text-[hsl(0,0%,7%)] font-bold rounded-xl h-12 text-base hover:brightness-110 transition-all duration-300"
              >
                <UserCheck className="w-5 h-5 ml-2" />
                כניסה כלקוח (Impersonation)
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Concierge Offer Modal */}
    {member && (
      <ConciergeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        member={{ id: member.id, full_name: member.full_name }}
      />
    )}
  </>
  );
};

export default VaultCrmDrawer;
