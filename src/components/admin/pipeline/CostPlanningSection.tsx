import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Calculator } from "lucide-react";
import { toast } from "sonner";
import type { ExpectedCosts } from "./types";
import { MIN_MARGIN } from "./types";

interface Props {
  orderId: string;
}

const CostPlanningSection = ({ orderId }: Props) => {
  const qc = useQueryClient();

  const { data: costs, isLoading } = useQuery({
    queryKey: ["expected-costs", orderId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("order_expected_costs")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data as ExpectedCosts | null;
    },
  });

  const [gold, setGold] = useState(0);
  const [labor, setLabor] = useState(0);
  const [stone, setStone] = useState(0);
  const [contingencies, setContingencies] = useState(0);
  const [overridePrice, setOverridePrice] = useState<string>("");

  useEffect(() => {
    if (costs) {
      setGold(costs.gold_cost);
      setLabor(costs.labor_cost);
      setStone(costs.stone_setting_cost);
      setContingencies(costs.contingencies);
      setOverridePrice(costs.final_quoted_price?.toString() || "");
    }
  }, [costs]);

  const subtotal = gold + labor + stone + contingencies;
  const suggestedQuote = subtotal + MIN_MARGIN;
  const finalQuote = overridePrice ? parseFloat(overridePrice) : suggestedQuote;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        order_id: orderId,
        gold_cost: gold,
        labor_cost: labor,
        stone_setting_cost: stone,
        contingencies,
        final_quoted_price: overridePrice ? parseFloat(overridePrice) : null,
        updated_at: new Date().toISOString(),
      };
      if (costs) {
        const { error } = await (supabase as any)
          .from("order_expected_costs")
          .update(payload)
          .eq("id", costs.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("order_expected_costs")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expected-costs", orderId] });
      toast.success("תכנון עלויות נשמר");
    },
    onError: () => toast.error("שגיאה בשמירת עלויות"),
  });

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37] mx-auto" />;

  const numField = (label: string, value: number, setter: (v: number) => void) => (
    <div>
      <label className="text-[11px] text-gray-500 block mb-1">{label}</label>
      <Input
        type="number"
        min={0}
        value={value || ""}
        onChange={(e) => setter(parseFloat(e.target.value) || 0)}
        className="bg-gray-50 border-gray-200 text-gray-900 text-sm h-9"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-1.5">
        <Calculator className="w-4 h-4" />
        תכנון עלויות צפויות
      </h4>

      {numField("עלות זהב (₪)", gold, setGold)}
      {numField("עבודה (₪)", labor, setLabor)}
      {numField("שיבוץ אבנים (₪)", stone, setStone)}
      {numField("חירום/תוספות (₪)", contingencies, setContingencies)}

      <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs text-gray-700">
        <div className="flex justify-between">
          <span>סה"כ עלויות</span>
          <span className="font-medium">₪{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>+ מרווח מינימום (₪{MIN_MARGIN.toLocaleString()})</span>
          <span className="font-bold text-[#D4AF37]">₪{suggestedQuote.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <div>
        <label className="text-[11px] text-gray-500 block mb-1">מחיר סופי ללקוח (עקיפת הצעה)</label>
        <Input
          type="number"
          min={0}
          value={overridePrice}
          onChange={(e) => setOverridePrice(e.target.value)}
          placeholder={`הצעה: ₪${suggestedQuote.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          className="bg-gray-50 border-gray-200 text-gray-900 text-sm h-9"
        />
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <Save className="w-3.5 h-3.5 ml-1" />}
        שמור תכנון
      </Button>
    </div>
  );
};

export default CostPlanningSection;
