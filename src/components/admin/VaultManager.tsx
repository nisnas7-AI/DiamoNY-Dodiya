import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVip } from "@/contexts/VipContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Save, Users, ShoppingBag, Settings, Calendar, Loader2, CreditCard, Activity, Sparkles, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import VaultCrmDrawer from "./VaultCrmDrawer";
import WelcomeInterstitialConfig from "./WelcomeInterstitialConfig";
import VIPReviewRequestSender from "@/components/VIPReviewRequestSender";
import HotLeadsPanel from "./HotLeadsPanel";

// ─── Members Tab ───
const MembersTab = ({ onImpersonate }: { onImpersonate: (m: any) => void }) => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone_key: "", gender_preference: "all" as string });
  const [selected360, setSelected360] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["vault-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_members")
        .select("*, vip_special_dates(count), vip_saved_items(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('vault-members-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_members' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["vault-members"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vip_members").insert({
        full_name: form.full_name,
        phone_key: form.phone_key,
        gender_preference: form.gender_preference as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      setShowAdd(false);
      setForm({ full_name: "", phone_key: "", gender_preference: "all" });
      toast.success("חבר חדש נוסף");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("vip_members").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vault-members"] }),
  });

  const creditMutation = useMutation({
    mutationFn: async ({ id, credit }: { id: string; credit: number }) => {
      const { error } = await supabase.from("vip_members").update({ credit_balance: credit }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      toast.success("קרדיט עודכן");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vip_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      setDeleteTarget(null);
      toast.success("הלקוח הוסר בהצלחה");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Summary calculations
  const totalMembers = members?.length || 0;
  const totalCredit = members?.reduce((sum: number, m: any) => sum + Number(m.credit_balance), 0) || 0;
  const confirmedCount = members?.filter((m: any) => m.is_confirmed).length || 0;
  const recentlyActive = members?.filter((m: any) => {
    if (!m.updated_at) return false;
    const diff = Date.now() - new Date(m.updated_at).getTime();
    return diff < 30 * 24 * 60 * 60 * 1000; // 30 days
  }).length || 0;
  const syncStatus = !isLoading && members ? (confirmedCount === totalMembers ? "synced" : "partial") : "loading";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#C9A96E]/20">
          <CardContent className="pt-5 pb-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-1 text-[#C9A96E]" />
            <div className="text-2xl font-bold">{totalMembers}</div>
            <div className="text-xs text-muted-foreground">סה״כ חברים</div>
          </CardContent>
        </Card>
        <Card className="border-[#C9A96E]/20">
          <CardContent className="pt-5 pb-4 text-center">
            <CreditCard className="w-6 h-6 mx-auto mb-1 text-[#C9A96E]" />
            <div className="text-2xl font-bold">₪{totalCredit.toLocaleString("he-IL")}</div>
            <div className="text-xs text-muted-foreground">קרדיט כולל</div>
          </CardContent>
        </Card>
        <Card className="border-[#C9A96E]/20">
          <CardContent className="pt-5 pb-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-1 text-[#C9A96E]" />
            <div className="text-2xl font-bold">{recentlyActive}</div>
            <div className="text-xs text-muted-foreground">פעילים לאחרונה</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">חברי הכספת</h3>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${syncStatus === "synced" ? "bg-emerald-500" : syncStatus === "partial" ? "bg-amber-500" : "bg-muted-foreground animate-pulse"}`} />
            <span className="text-muted-foreground">
              {syncStatus === "synced" ? "מסונכרן" : syncStatus === "partial" ? `${confirmedCount}/${totalMembers} מאומתים` : "טוען..."}
            </span>
          </div>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#A68966] hover:bg-[#8a7354]">
              <Plus className="w-4 h-4 ml-1" /> חבר חדש
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת חבר חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="שם מלא" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              <Input placeholder="מספר טלפון (מפתח גישה)" value={form.phone_key} onChange={(e) => setForm((f) => ({ ...f, phone_key: e.target.value }))} dir="ltr" />
              <Select value={form.gender_preference} onValueChange={(v) => setForm((f) => ({ ...f, gender_preference: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="female">נשים</SelectItem>
                  <SelectItem value="male">גברים</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => createMutation.mutate()} disabled={!form.full_name || !form.phone_key || createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "הוסף"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-muted-foreground">לחיצה כפולה על שורה תפתח פרופיל לקוח מלא (Customer 360)</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <ScrollArea className="h-[420px] rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>קרדיט</TableHead>
                <TableHead>💛</TableHead>
                <TableHead>אימות</TableHead>
                <TableHead>הסכמה</TableHead>
                <TableHead>תאריך הסכמה</TableHead>
                <TableHead>כניסות</TableHead>
                <TableHead>תאריכים</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m: any) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onDoubleClick={() => setSelected360(m)}
                >
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell dir="ltr" className="text-left">{m.phone_key}</TableCell>
                  <TableCell>
                    <Switch checked={m.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: m.id, is_active: checked })} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue={m.credit_balance} className="w-24" onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== m.credit_balance) creditMutation.mutate({ id: m.id, credit: val });
                    }} />
                    </TableCell>
                    <TableCell>
                      {(m as any).vip_saved_items?.[0]?.count > 0 ? (
                        <span className="text-[#D4AF37] font-semibold text-sm">💛 {(m as any).vip_saved_items[0].count}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.is_confirmed ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">מאומת</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-amber-700 bg-amber-100">ממתין</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.marketing_consent ? "default" : "secondary"}>{m.marketing_consent ? "כן" : "לא"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.consent_date ? new Date(m.consent_date).toLocaleDateString("he-IL") : "—"}
                  </TableCell>
                  <TableCell className="text-center">{m.login_count || 0}</TableCell>
                  <TableCell><Badge variant="outline">{m.vip_special_dates?.[0]?.count || 0}</Badge></TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: m.id, name: m.full_name });
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                      title="מחק לקוח"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      <VaultCrmDrawer
        member={selected360}
        isOpen={!!selected360}
        onClose={() => setSelected360(null)}
        onImpersonate={(m) => { setSelected360(null); onImpersonate(m); }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl" className="bg-[#FDFBF7]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1A1A1A]">מחיקת לקוח VIP</AlertDialogTitle>
            <AlertDialogDescription className="text-[#1A1A1A]/70">
              האם אתה בטוח שברצונך למחוק את הלקוח <strong>{deleteTarget?.name}</strong>? פעולה זו היא סופית ולא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="ml-0">ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "מחק לקוח"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Products Tab ───
const ProductsTab = () => {
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState("");

  const { data: rules } = useQuery({
    queryKey: ["vault-product-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vip_product_rules").select("*, products(name, main_image_url, price)");
      if (error) throw error;
      return data;
    },
  });

  const { data: allProducts } = useQuery({
    queryKey: ["all-products-for-vault"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, price").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const addRuleMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("vip_product_rules").insert({ product_id: productId, discount_percentage: 10 });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vault-product-rules"] }); toast.success("מוצר נוסף"); },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, discount_percentage, is_vip_exclusive }: any) => {
      const { error } = await supabase.from("vip_product_rules").update({ discount_percentage, is_vip_exclusive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vault-product-rules"] }); toast.success("עודכן"); },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vip_product_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vault-product-rules"] }); toast.success("מוצר הוסר"); },
  });

  const existingProductIds = new Set(rules?.map((r: any) => r.product_id));
  const availableProducts = allProducts?.filter((p: any) => !existingProductIds.has(p.id) && p.name.includes(productSearch));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">הוסף מוצר VIP</h4>
        <Input placeholder="חפש מוצר..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
        {productSearch && availableProducts && availableProducts.length > 0 && (
          <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
            {availableProducts.slice(0, 5).map((p: any) => (
              <button key={p.id} className="w-full text-right px-3 py-2 hover:bg-muted transition-colors text-sm" onClick={() => { addRuleMutation.mutate(p.id); setProductSearch(""); }}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>מוצר</TableHead>
            <TableHead>הנחה %</TableHead>
            <TableHead>בלעדי</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules?.map((r: any) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.products?.name}</TableCell>
              <TableCell>
                <Input type="number" defaultValue={r.discount_percentage} className="w-20" onBlur={(e) => updateRuleMutation.mutate({ id: r.id, discount_percentage: Number(e.target.value), is_vip_exclusive: r.is_vip_exclusive })} />
              </TableCell>
              <TableCell>
                <Switch checked={r.is_vip_exclusive} onCheckedChange={(checked) => updateRuleMutation.mutate({ id: r.id, discount_percentage: r.discount_percentage, is_vip_exclusive: checked })} />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => deleteRuleMutation.mutate(r.id)}>הסר</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ─── Settings Tab (with state retention) ───
const SettingsTab = () => {
  const queryClient = useQueryClient();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ["vault-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vip_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      return map;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from("vip_settings").update({ value }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-settings"] });
      toast.success("הגדרה עודכנה");
    },
  });

  if (!settings) return null;

  const getValue = (key: string) => {
    if (key in localValues) return localValues[key];
    return settings[key] || "";
  };

  const handleChange = (key: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = getValue(key);
    updateMutation.mutate({ key, value });
  };

  const fields = [
    { key: "teaser_message", label: "הודעת טיזר (כשהמפתח שגוי)", multiline: true },
    { key: "welcome_message", label: "הודעת ברוכים הבאים", multiline: false },
    { key: "lounge_title", label: "כותרת הטרקלין", multiline: false },
    { key: "consent_text", label: "טקסט צ'קבוקס הסכמה (טופס כניסה ראשונה)", multiline: false },
  ];

  return (
    <div className="space-y-6">
      {fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <label className="text-sm font-medium">{f.label}</label>
          {f.multiline ? (
            <Textarea
              value={getValue(f.key)}
              onChange={(e) => handleChange(f.key, e.target.value)}
              onBlur={() => handleSave(f.key)}
              rows={3}
            />
          ) : (
            <Input
              value={getValue(f.key)}
              onChange={(e) => handleChange(f.key, e.target.value)}
              onBlur={() => handleSave(f.key)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───
const VaultManager = () => {
  const navigate = useNavigate();
  const { startImpersonation } = useVip();

  const handleImpersonate = useCallback((member: any) => {
    startImpersonation({
      id: member.id,
      full_name: member.full_name,
      credit_balance: Number(member.credit_balance),
      gender_preference: member.gender_preference,
      is_active: member.is_active,
      marketing_consent: member.marketing_consent,
      consent_date: member.consent_date,
      email: member.email ?? null,
      is_confirmed: member.is_confirmed ?? false,
      confirmed_at: member.confirmed_at ?? null,
    });
    navigate("/the-lounge");
  }, [navigate, startImpersonation]);

  return (
    <Tabs defaultValue="members" dir="rtl">
      <TabsList className="mb-4">
        <TabsTrigger value="members"><Users className="w-4 h-4 ml-1" />חברים</TabsTrigger>
        <TabsTrigger value="products"><ShoppingBag className="w-4 h-4 ml-1" />מוצרים</TabsTrigger>
        <TabsTrigger value="interstitial"><Sparkles className="w-4 h-4 ml-1" />מסך ברכה</TabsTrigger>
        <TabsTrigger value="settings"><Settings className="w-4 h-4 ml-1" />הגדרות</TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        <div className="space-y-6">
          <HotLeadsPanel />
          <MembersTab onImpersonate={handleImpersonate} />
          <VIPReviewRequestSender />
        </div>
      </TabsContent>
      <TabsContent value="products"><ProductsTab /></TabsContent>
      <TabsContent value="interstitial"><WelcomeInterstitialConfig /></TabsContent>
      <TabsContent value="settings"><SettingsTab /></TabsContent>
    </Tabs>
  );
};

export default VaultManager;
