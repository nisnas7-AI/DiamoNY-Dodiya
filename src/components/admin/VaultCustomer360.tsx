import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { QRCodeSVG } from "qrcode.react";
import { Save, Loader2, QrCode, UserCheck, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Customer360Props {
  member: any;
  isOpen: boolean;
  onClose: () => void;
  onImpersonate: (member: any) => void;
}

const VaultCustomer360 = ({ member, isOpen, onClose, onImpersonate }: Customer360Props) => {
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(false);
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

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-modal max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">
            פרופיל לקוח — {member.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground">קרדיט</div>
              <div className="font-bold text-lg">₪{Number(member.credit_balance).toLocaleString("he-IL")}</div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground">כניסות</div>
              <div className="font-bold text-lg">{member.login_count || 0}</div>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground">סטטוס</div>
              <Badge variant={member.is_active ? "default" : "secondary"} className="mt-1">
                {member.is_active ? "פעיל" : "מושבת"}
              </Badge>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground">הסכמה</div>
              <Badge variant={member.marketing_consent ? "default" : "secondary"} className="mt-1">
                {member.marketing_consent ? "כן" : "לא"}
              </Badge>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">טלפון:</span><span dir="ltr">{(member as any).phone_key || "***"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">אימייל:</span><span>{member.email || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">תאריך הסכמה:</span><span>{member.consent_date ? new Date(member.consent_date).toLocaleString("he-IL") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">הצטרף:</span><span>{new Date(member.created_at).toLocaleDateString("he-IL")}</span></div>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">העדפות לקוח</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">סוג תכשיט</label>
                <Select value={prefs.pref_jewelry_type} onValueChange={(v) => setPrefs(p => ({ ...p, pref_jewelry_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
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
                <label className="text-xs text-muted-foreground">צבע זהב</label>
                <Select value={prefs.pref_gold_color} onValueChange={(v) => setPrefs(p => ({ ...p, pref_gold_color: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yellow">צהוב</SelectItem>
                    <SelectItem value="white">לבן</SelectItem>
                    <SelectItem value="rose">רוזה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">אבן מועדפת</label>
                <Select value={prefs.pref_stone} onValueChange={(v) => setPrefs(p => ({ ...p, pref_stone: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diamonds">יהלומים</SelectItem>
                    <SelectItem value="pearls">פנינים</SelectItem>
                    <SelectItem value="gemstones">אבני חן</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button size="sm" onClick={() => savePrefsMutation.mutate()} disabled={savePrefsMutation.isPending} className="bg-[#A68966] hover:bg-[#8a7354]">
              {savePrefsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5 ml-1" /> שמור העדפות</>}
            </Button>
          </div>

          <Separator />

          {/* Special Dates */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">תאריכים מיוחדים ({specialDates?.length || 0})</h4>
            {specialDates && specialDates.length > 0 ? (
              <div className="space-y-1">
                {specialDates.map((d: any) => (
                  <div key={d.id} className="flex justify-between text-sm p-2 bg-muted rounded-lg">
                    <span>{d.event_name}</span>
                    <span className="text-muted-foreground">{new Date(d.event_date).toLocaleDateString("he-IL")}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">אין תאריכים</p>}
          </div>

          <Separator />

          {/* Phygital / NFC */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">אינטגרציית NFC / QR</h4>
            <div className="flex items-center gap-2">
              <Input value={directUrl} readOnly dir="ltr" className="text-xs font-mono" />
              <Button size="icon" onClick={() => { navigator.clipboard.writeText(directUrl); toast.success("הקישור הועתק"); }} className="!bg-[#D4AF37] !text-black hover:!bg-[#b8942b] !border-[#d4af37] rounded-xl shadow-sm hover:shadow-md transition-all">
                <Copy className="w-4 h-4 !text-black" />
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={() => setShowQR(!showQR)} className="!bg-[#D4AF37] !text-black hover:!bg-[#b8942b] !border-[#d4af37] rounded-xl font-semibold shadow-sm hover:shadow-md transition-all">
                <QrCode className="w-4 h-4 ml-1 !text-black" /> {showQR ? "הסתר QR" : "הצג QR"}
              </Button>
            </div>
            {showQR && (
              <div className="space-y-3">
                <div className="flex justify-center p-4 bg-white rounded-xl border">
                  <QRCodeSVG id="vault-qr-code" value={directUrl} size={180} />
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(directUrl); toast.success("הקישור הועתק"); }} className="!text-[#1a1a1a] border-[#d4af37] bg-white hover:bg-[#f8f5f0] hover:!text-[#1a1a1a] rounded-xl font-semibold shadow-sm hover:shadow-md transition-all">
                    <Copy className="w-4 h-4 ml-1 text-[#1a1a1a]" /> העתק קישור
                  </Button>
                  <Button variant="outline" size="sm" className="!text-[#1a1a1a] border-[#d4af37] bg-white hover:bg-[#f8f5f0] hover:!text-[#1a1a1a] rounded-xl font-semibold shadow-sm hover:shadow-md transition-all" onClick={() => {
                    const svg = document.getElementById("vault-qr-code");
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
                    <ExternalLink className="w-4 h-4 ml-1 text-[#1a1a1a]" /> הורד QR
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Impersonation */}
          <Button
            onClick={() => onImpersonate(member)}
            className="w-full bg-gradient-to-r from-[#C9A96E] to-[#A68966] text-[#0a0a0a] font-bold rounded-xl h-12 text-base"
          >
            <UserCheck className="w-5 h-5 ml-2" />
            כניסה כלקוח (Impersonation)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VaultCustomer360;
