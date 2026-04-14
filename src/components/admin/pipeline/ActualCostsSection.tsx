import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { ActualCost } from "./types";
import { STAGES } from "./types";

interface Props {
  orderId: string;
}

const ActualCostsSection = ({ orderId }: Props) => {
  const qc = useQueryClient();
  const [stage, setStage] = useState("general");
  const [gold, setGold] = useState(0);
  const [labor, setLabor] = useState(0);
  const [setting, setSetting] = useState(0);
  const [extras, setExtras] = useState(0);
  const [desc, setDesc] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["actual-costs", orderId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("order_actual_costs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ActualCost[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("order_actual_costs").insert({
        order_id: orderId,
        stage,
        gold_cost: gold,
        labor_cost: labor,
        setting_cost: setting,
        extras,
        description: desc || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actual-costs", orderId] });
      setGold(0); setLabor(0); setSetting(0); setExtras(0); setDesc("");
      toast.success("עלות בפועל נוספה");
    },
    onError: () => toast.error("שגיאה בהוספת עלות"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("order_actual_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actual-costs", orderId] });
      toast.success("נמחק");
    },
  });

  const totalActual = entries.reduce((sum, e) => sum + e.gold_cost + e.labor_cost + e.setting_cost + e.extras, 0);
  const stageLabel = (key: string) => STAGES.find(s => s.key === key)?.label || key;

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37] mx-auto" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-1.5">
        <Receipt className="w-4 h-4" />
        עלויות בפועל
      </h4>

      {/* Existing entries */}
      {entries.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs">
              <div className="space-y-0.5">
                <p className="font-medium text-gray-900">{stageLabel(e.stage)}</p>
                <p className="text-gray-500">
                  זהב: ₪{e.gold_cost} | עבודה: ₪{e.labor_cost} | שיבוץ: ₪{e.setting_cost} | תוספות: ₪{e.extras}
                </p>
                {e.description && <p className="text-gray-400">{e.description}</p>}
                <p className="text-[10px] text-gray-400">{format(new Date(e.created_at), "dd/MM/yy", { locale: he })}</p>
              </div>
              <button onClick={() => deleteMutation.mutate(e.id)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="text-xs font-semibold text-gray-700 pt-1 border-t border-gray-200 flex justify-between">
            <span>סה"כ בפועל</span>
            <span>₪{totalActual.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Add new entry */}
      <div className="border-t border-gray-200 pt-3 space-y-2">
        <p className="text-[11px] text-gray-500 font-medium">הוסף רשומת עלות</p>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">כללי</SelectItem>
            {STAGES.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400">זהב</label>
            <Input type="number" min={0} value={gold || ""} onChange={e => setGold(parseFloat(e.target.value) || 0)} className="bg-gray-50 border-gray-200 text-gray-900 text-xs h-8" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400">עבודה</label>
            <Input type="number" min={0} value={labor || ""} onChange={e => setLabor(parseFloat(e.target.value) || 0)} className="bg-gray-50 border-gray-200 text-gray-900 text-xs h-8" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400">שיבוץ</label>
            <Input type="number" min={0} value={setting || ""} onChange={e => setSetting(parseFloat(e.target.value) || 0)} className="bg-gray-50 border-gray-200 text-gray-900 text-xs h-8" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400">תוספות</label>
            <Input type="number" min={0} value={extras || ""} onChange={e => setExtras(parseFloat(e.target.value) || 0)} className="bg-gray-50 border-gray-200 text-gray-900 text-xs h-8" />
          </div>
        </div>
        <Input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="תיאור (אופציונלי)"
          className="bg-gray-50 border-gray-200 text-gray-900 text-xs h-8"
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || (gold + labor + setting + extras === 0)}
        >
          {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <Plus className="w-3.5 h-3.5 ml-1" />}
          הוסף עלות
        </Button>
      </div>
    </div>
  );
};

export default ActualCostsSection;
