import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Save, MessageCircle, ExternalLink, Clock, Package, Copy, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { motion } from "framer-motion";

import { STAGES, stageIndex, stageBadgeColor, CUSTOMER_GRADES, type Order } from "./pipeline/types";
import CostPlanningSection from "./pipeline/CostPlanningSection";
import ActualCostsSection from "./pipeline/ActualCostsSection";
import ProfitabilitySummary from "./pipeline/ProfitabilitySummary";

/* ─── WhatsApp message templates ─── */
const waTemplates: Record<string, (name: string) => string> = {
  consultation: (n) => `שלום ${n}, תודה שפנית אלינו! נשמח לקבוע פגישת אפיון לעיצוב התכשיט שלך. מתי נוח לך?`,
  "3d_approval": (n) => `היי ${n}, המודל התלת-ממדי של התכשיט שלך מוכן לצפייה ואישור! נשמח לשמוע את דעתך.`,
  production: (n) => `שלום ${n}, רצינו לעדכן שהתכשיט שלך נמצא כעת בשלב היציקה והשיבוץ. הכל מתקדם יפה!`,
  qa: (n) => `היי ${n}, התכשיט שלך עבר לשלב בקרת האיכות הסופית. כמעט שם!`,
  ready: (n) => `שלום ${n}, שמחים לבשר – התכשיט שלך מוכן למסירה! 🎉 נשמח לתאם איתך.`,
  delivered: (n) => `שלום ${n}, תודה שבחרת ב-DiamoNY! 💎 נשמח לקבל ממך פידבק על התכשיט.`,
};

/* ─── Component ─── */
const ProductionPipeline = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [waModal, setWaModal] = useState<{ open: boolean; order: Order | null; customerName: string }>({
    open: false,
    order: null,
    customerName: "",
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["production-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("custom_orders")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Order[];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["pipeline-vip-members"],
    queryFn: async () => {
      const { data } = await supabase.from("vip_members").select("id, full_name, phone_key, email");
      return data || [];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["pipeline-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, name, phone, email").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["pipeline-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, main_image_url, slug").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const memberMap = useMemo(() => new Map((members || []).map((m) => [m.id, m])), [members]);
  const productMap = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);

  const updateOrder = useMutation({
    mutationFn: async (payload: { id: string; updates: Record<string, any> }) => {
      const { error } = await (supabase as any)
        .from("custom_orders")
        .update({ ...payload.updates, updated_at: new Date().toISOString() })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["production-orders"] });
      const previous = qc.getQueryData<Order[]>(["production-orders"]);
      qc.setQueryData<Order[]>(["production-orders"], (old) =>
        (old || []).map((o) =>
          o.id === payload.id ? { ...o, ...payload.updates, updated_at: new Date().toISOString() } : o
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["production-orders"], context.previous);
      toast.error("שגיאה בעדכון הפרויקט");
    },
    onSuccess: () => toast.success("הפרויקט עודכן בהצלחה"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["production-orders"] }),
  });

  const createOrder = useMutation({
    mutationFn: async (payload: { customer_id?: string; order_name: string; product_id?: string; customer_name?: string; customer_phone?: string; customer_email?: string }) => {
      const { error } = await (supabase as any)
        .from("custom_orders")
        .insert({
          customer_id: payload.customer_id || null,
          order_name: payload.order_name,
          product_id: payload.product_id || null,
          customer_name: payload.customer_name || null,
          customer_phone: payload.customer_phone || null,
          customer_email: payload.customer_email || null,
          status: "consultation",
          consultation_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      setShowCreate(false);
      toast.success("פרויקט חדש נוצר");
    },
    onError: () => toast.error("שגיאה ביצירת פרויקט"),
  });

  const advanceStage = (order: Order) => {
    const current = stageIndex(order.status);
    if (current >= STAGES.length - 1) return;
    const next = STAGES[current + 1];
    updateOrder.mutate({
      id: order.id,
      updates: { status: next.key, [next.tsField]: new Date().toISOString() },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground">פרויקטים פעילים</h2>
          <p className="text-sm text-muted-foreground mt-1">{orders?.length || 0} פרויקטים בתהליך</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#D4AF37] text-gray-900 hover:bg-[#D4AF37]/90 font-semibold"
        >
          <Plus className="w-4 h-4 ml-1.5" />
          פרויקט חדש
        </Button>
      </div>

      {(!orders || orders.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>אין פרויקטים פעילים</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {orders.map((order) => {
            const member = order.customer_id ? memberMap.get(order.customer_id) : null;
            const displayName = member?.full_name || order.customer_name || "לקוח לא ידוע";
            const product = order.product_id ? productMap.get(order.product_id) : null;
            const current = stageIndex(order.status);
            const isDelivered = order.status === "delivered";
            const gradeInfo = CUSTOMER_GRADES.find(g => g.key === order.customer_grade);

            return (
              <AccordionItem
                key={order.id}
                value={order.id}
                className="border border-border rounded-2xl bg-card overflow-hidden"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 w-full text-right">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{order.order_name}</p>
                    </div>
                    {gradeInfo && (
                      <Badge className={`shrink-0 border text-[10px] ${gradeInfo.color}`}>
                        {gradeInfo.label}
                      </Badge>
                    )}
                    {product && (
                      <span className="text-xs text-[#D4AF37]/70 hidden sm:block truncate max-w-[120px]">
                        {product.name}
                      </span>
                    )}
                    <Badge className={`shrink-0 border text-[11px] ${stageBadgeColor(current, current)}`}>
                      {STAGES[current].label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                      {format(new Date(order.updated_at), "dd/MM/yy", { locale: he })}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-5 pb-6 bg-[#F5F5F5] rounded-b-2xl">
                  {/* Stage Tracker */}
                  <div className="flex items-center gap-1 mb-6 overflow-x-auto py-2">
                    {STAGES.map((stage, idx) => (
                      <div key={stage.key} className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateOrder.mutate({
                              id: order.id,
                              updates: { status: stage.key, [stage.tsField]: new Date().toISOString() },
                            })
                          }
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-300 cursor-pointer ${stageBadgeColor(current, idx)}`}
                          aria-label={`שנה שלב ל${stage.label}`}
                        >
                          {stage.label}
                        </button>
                        {idx < STAGES.length - 1 && (
                          <div className={`w-4 h-[2px] ${idx < current ? "bg-[#D4AF37]/50" : "bg-gray-300"}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Main Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-gray-900">
                    {/* Specs + Notes */}
                    <SpecsSection
                      order={order}
                      product={product}
                      onSave={(updates) => updateOrder.mutate({ id: order.id, updates })}
                      isSaving={updateOrder.isPending}
                    />

                    {/* Communication */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-[#D4AF37]">תקשורת</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        onClick={() =>
                          setWaModal({ open: true, order, customerName: displayName })
                        }
                      >
                        <MessageCircle className="w-4 h-4 ml-1.5" />
                        עדכן לקוח
                      </Button>
                      {(member?.phone_key || order.customer_phone) && (
                        <p className="text-[11px] text-gray-500">טלפון: {member?.phone_key || order.customer_phone}</p>
                      )}

                      {/* Customer Grade */}
                      <div className="border-t border-gray-200 pt-3">
                        <label className="text-[11px] text-gray-500 block mb-1 flex items-center gap-1">
                          <Star className="w-3 h-3" /> דירוג לקוח
                        </label>
                        <Select
                          value={order.customer_grade || ""}
                          onValueChange={(v) =>
                            updateOrder.mutate({ id: order.id, updates: { customer_grade: v } })
                          }
                        >
                          <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 text-sm h-9">
                            <SelectValue placeholder="בחר דירוג" />
                          </SelectTrigger>
                          <SelectContent>
                            {CUSTOMER_GRADES.map(g => (
                              <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-[#D4AF37]">יומן פעולות</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {STAGES.map((stage) => {
                          const ts = (order as any)[stage.tsField];
                          if (!ts) return null;
                          return (
                            <div key={stage.key} className="flex items-start gap-2">
                              <Clock className={`w-3 h-3 mt-1 shrink-0 ${stage.key === "delivered" ? "text-green-600" : "text-[#D4AF37]/60"}`} />
                              <div>
                                <p className={`text-xs ${stage.key === "delivered" ? "text-green-700" : "text-gray-900"}`}>{stage.label}</p>
                                <p className="text-[10px] text-gray-500">
                                  {format(new Date(ts), "dd/MM/yyyy HH:mm", { locale: he })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 text-gray-900">
                    <CostPlanningSection orderId={order.id} />
                    <ActualCostsSection orderId={order.id} />
                    {isDelivered && (
                      <ProfitabilitySummary orderId={order.id} customerPayment={order.final_price} />
                    )}
                  </div>

                  {/* Customer Notes */}
                  <CustomerNotesSection
                    notes={order.customer_notes || ""}
                    onSave={(notes) => updateOrder.mutate({ id: order.id, updates: { customer_notes: notes } })}
                    isSaving={updateOrder.isPending}
                  />

                  {current < STAGES.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 flex justify-end"
                    >
                      <Button
                        size="sm"
                        onClick={() => advanceStage(order)}
                        disabled={updateOrder.isPending}
                        className="bg-[#D4AF37] text-gray-900 hover:bg-[#D4AF37]/90 font-semibold"
                      >
                        {updateOrder.isPending && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                        קדם ל{STAGES[current + 1].label}
                      </Button>
                    </motion.div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <CreateOrderModal
        open={showCreate}
        onOpenChange={setShowCreate}
        members={members || []}
        leads={leads || []}
        products={products || []}
        onCreate={(data) => createOrder.mutate(data)}
        isCreating={createOrder.isPending}
      />

      <WhatsAppModal
        open={waModal.open}
        onOpenChange={(o) => setWaModal((p) => ({ ...p, open: o }))}
        order={waModal.order}
        customerName={waModal.customerName}
        phone={waModal.order ? (waModal.order.customer_id ? memberMap.get(waModal.order.customer_id)?.phone_key : waModal.order.customer_phone) || undefined : undefined}
      />
    </div>
  );
};

/* ─── Customer Notes Section ─── */
const CustomerNotesSection = ({
  notes,
  onSave,
  isSaving,
}: {
  notes: string;
  onSave: (n: string) => void;
  isSaving: boolean;
}) => {
  const [value, setValue] = useState(notes);

  return (
    <div className="mt-5 bg-white rounded-xl border border-gray-200 p-4 space-y-3 text-gray-900">
      <h4 className="text-sm font-semibold text-[#D4AF37]">הערות ללקוח</h4>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="bg-gray-50 border-gray-200 text-gray-900 text-sm resize-none"
        placeholder="הוסף הערות פנימיות על הלקוח..."
      />
      <Button
        size="sm"
        variant="outline"
        className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
        onClick={() => onSave(value)}
        disabled={isSaving || value === notes}
      >
        <Save className="w-3.5 h-3.5 ml-1" />
        שמור הערות
      </Button>
    </div>
  );
};

/* ─── Specs Section ─── */
const SpecsSection = ({
  order,
  product,
  onSave,
  isSaving,
}: {
  order: Order;
  product: any;
  onSave: (u: Record<string, any>) => void;
  isSaving: boolean;
}) => {
  const [ringSize, setRingSize] = useState(order.ring_size || "");
  const [goldColor, setGoldColor] = useState(order.gold_color_override || "");
  const [notes, setNotes] = useState(order.designer_notes || "");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-[#D4AF37]">מפרט מותאם</h4>

      {product && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
          {product.main_image_url && (
            <img src={product.main_image_url} alt={product.name} className="w-10 h-10 rounded object-cover" />
          )}
          <span className="text-xs text-gray-900 truncate">{product.name}</span>
        </div>
      )}

      <div>
        <label className="text-[11px] text-gray-500 block mb-1">מידת טבעת</label>
        <Input
          value={ringSize}
          onChange={(e) => setRingSize(e.target.value)}
          placeholder="לדוגמה: 14"
          className="bg-gray-50 border-gray-200 text-gray-900 text-sm h-9"
        />
      </div>

      <div>
        <label className="text-[11px] text-gray-500 block mb-1">צבע זהב</label>
        <Select value={goldColor} onValueChange={setGoldColor}>
          <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 text-sm h-9">
            <SelectValue placeholder="בחר צבע" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yellow">זהב צהוב</SelectItem>
            <SelectItem value="white">זהב לבן</SelectItem>
            <SelectItem value="rose">זהב רוזה</SelectItem>
            <SelectItem value="two-tone">דו-גוני</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-[11px] text-gray-500 block mb-1">הערות מעצב / קישור STL</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="bg-gray-50 border-gray-200 text-gray-900 text-sm resize-none"
          placeholder="הערות, קישור לקובץ 3D..."
        />
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
        onClick={() =>
          onSave({ ring_size: ringSize, gold_color_override: goldColor, designer_notes: notes })
        }
        disabled={isSaving}
      >
        <Save className="w-3.5 h-3.5 ml-1" />
        שמור מפרט
      </Button>
    </div>
  );
};

/* ─── Create Order Modal ─── */
const CreateOrderModal = ({
  open,
  onOpenChange,
  members,
  leads,
  products,
  onCreate,
  isCreating,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  members: any[];
  leads: any[];
  products: any[];
  onCreate: (d: { customer_id?: string; order_name: string; product_id?: string; customer_name?: string; customer_phone?: string; customer_email?: string }) => void;
  isCreating: boolean;
}) => {
  const [clientMode, setClientMode] = useState<"manual" | "vip" | "lead">("manual");
  const [customerId, setCustomerId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [orderName, setOrderName] = useState("");
  const [productId, setProductId] = useState("");

  useEffect(() => {
    if (clientMode === "vip" && customerId) {
      const m = members.find((m) => m.id === customerId);
      if (m) {
        setManualName(m.full_name || "");
        setManualPhone(m.phone_key || "");
        setManualEmail(m.email || "");
      }
    }
  }, [customerId, clientMode, members]);

  useEffect(() => {
    if (clientMode === "lead" && leadId) {
      const l = leads.find((l) => l.id === leadId);
      if (l) {
        setManualName(l.name || "");
        setManualPhone(l.phone || "");
        setManualEmail(l.email || "");
      }
    }
  }, [leadId, clientMode, leads]);

  const handleSubmit = () => {
    if (!orderName) { toast.error("נא למלא שם פרויקט"); return; }
    if (clientMode === "manual" && !manualName) { toast.error("נא למלא שם לקוח"); return; }
    if (clientMode === "vip" && !customerId) { toast.error("נא לבחור לקוח VIP"); return; }
    if (clientMode === "lead" && !leadId) { toast.error("נא לבחור ליד"); return; }

    onCreate({
      customer_id: clientMode === "vip" ? customerId : undefined,
      order_name: orderName,
      product_id: productId || undefined,
      customer_name: manualName || undefined,
      customer_phone: manualPhone || undefined,
      customer_email: manualEmail || undefined,
    });
    setCustomerId(""); setLeadId(""); setManualName(""); setManualPhone(""); setManualEmail(""); setOrderName(""); setProductId("");
  };

  const modeButtons: { key: typeof clientMode; label: string }[] = [
    { key: "manual", label: "לקוח חדש" },
    { key: "vip", label: "לקוח VIP" },
    { key: "lead", label: "משוך מלידים" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#D4AF37]">פרויקט חדש</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            {modeButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => { setClientMode(btn.key); setCustomerId(""); setLeadId(""); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  clientMode === btn.key
                    ? "bg-[#D4AF37] text-gray-900 border-[#D4AF37]"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {clientMode === "vip" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">לקוח VIP</label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="בחר לקוח VIP" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} {m.phone_key ? `(${m.phone_key})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {clientMode === "lead" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">בחר ליד</label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="בחר ליד מהרשימה" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} {l.phone ? `(${l.phone})` : ""} — {l.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/50">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">פרטי לקוח</p>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">שם מלא *</label>
              <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="שם מלא" className="bg-background border-border text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">טלפון</label>
              <Input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} placeholder="050-0000000" className="bg-background border-border text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">אימייל</label>
              <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="email@example.com" className="bg-background border-border text-foreground" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">שם הפרויקט *</label>
            <Input value={orderName} onChange={(e) => setOrderName(e.target.value)} placeholder="לדוגמה: טבעת אירוסין מותאמת" className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">מוצר מקושר (אופציונלי)</label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="בחר מוצר מהקטלוג" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={isCreating} className="w-full bg-[#D4AF37] text-gray-900 hover:bg-[#D4AF37]/90 font-semibold">
            {isCreating && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
            צור פרויקט
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── WhatsApp Modal ─── */
const WhatsAppModal = ({
  open,
  onOpenChange,
  order,
  customerName,
  phone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: Order | null;
  customerName: string;
  phone?: string;
}) => {
  const status = order?.status || "consultation";
  const template = waTemplates[status]?.(customerName) || "";
  const [msg, setMsg] = useState(template);

  const actualMsg = open ? (msg || template) : template;

  const waUrl = phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(actualMsg)}`
    : "#";

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setMsg(""); }}>
      <DialogContent className="bg-card border-border text-foreground max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#D4AF37]">עדכן לקוח</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">הודעה</label>
            <Textarea
              value={actualMsg}
              onChange={(e) => setMsg(e.target.value)}
              rows={5}
              className="bg-muted border-border text-foreground text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold">
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 ml-1.5" />
                פתח WhatsApp
              </a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="העתק קישור"
              className="shrink-0"
              onClick={() => {
                if (waUrl === "#") return;
                navigator.clipboard.writeText(waUrl);
                toast.success("הקישור הועתק");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionPipeline;
