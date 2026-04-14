import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import type { ExpectedCosts, ActualCost } from "./types";

interface Props {
  orderId: string;
  customerPayment: number | null;
}

const ProfitabilitySummary = ({ orderId, customerPayment }: Props) => {
  const [vatPercent, setVatPercent] = useState(0);

  const { data: expected, isLoading: loadingExp } = useQuery({
    queryKey: ["expected-costs", orderId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("order_expected_costs")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      return data as ExpectedCosts | null;
    },
  });

  const { data: actuals = [], isLoading: loadingAct } = useQuery({
    queryKey: ["actual-costs", orderId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("order_actual_costs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      return (data || []) as ActualCost[];
    },
  });

  if (loadingExp || loadingAct) return <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37] mx-auto" />;

  const vatRate = vatPercent / 100;

  // Expected totals
  const expGold = expected?.gold_cost || 0;
  const expLabor = expected?.labor_cost || 0;
  const expStone = expected?.stone_setting_cost || 0;
  const expCont = expected?.contingencies || 0;
  const expectedTotal = expGold + expLabor + expStone + expCont;
  const expectedWithVat = expectedTotal * (1 + vatRate);

  // Actual totals (aggregated from all stages)
  const actGold = actuals.reduce((s, e) => s + e.gold_cost, 0);
  const actLabor = actuals.reduce((s, e) => s + e.labor_cost, 0);
  const actSetting = actuals.reduce((s, e) => s + e.setting_cost, 0);
  const actExtras = actuals.reduce((s, e) => s + e.extras, 0);
  const actualTotal = actGold + actLabor + actSetting + actExtras;
  const actualWithVat = actualTotal * (1 + vatRate);

  const payment = customerPayment || expected?.final_quoted_price || 0;
  const netProfit = payment - actualWithVat;
  const profitPercent = payment > 0 ? ((netProfit / payment) * 100) : 0;
  const isPositive = netProfit >= 0;

  const row = (label: string, exp: number, act: number) => {
    const delta = act - exp;
    return (
      <tr className="border-b border-gray-100 last:border-0">
        <td className="py-1.5 text-gray-700">{label}</td>
        <td className="py-1.5 text-left font-medium">₪{exp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
        <td className="py-1.5 text-left font-medium">₪{act.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
        <td className={`py-1.5 text-left font-medium ${delta > 0 ? "text-red-600" : delta < 0 ? "text-green-600" : "text-gray-500"}`}>
          {delta > 0 ? "+" : ""}₪{delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-1.5">
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        סיכום רווחיות
      </h4>

      {/* Editable VAT */}
      <div className="flex items-center gap-2 text-xs">
        <label className="text-gray-500 whitespace-nowrap">מע"מ (%):</label>
        <Input
          type="number"
          min={0}
          max={100}
          value={vatPercent || ""}
          onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
          className="bg-gray-50 border-gray-200 text-gray-900 text-xs h-7 w-20"
          placeholder="0"
        />
        <button
          type="button"
          onClick={() => setVatPercent(vatPercent === 18 ? 0 : 18)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${vatPercent === 18 ? "bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]" : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"}`}
        >
          18%
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right" dir="rtl">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="pb-2 font-medium">סעיף</th>
              <th className="pb-2 text-left font-medium">צפוי</th>
              <th className="pb-2 text-left font-medium">בפועל</th>
              <th className="pb-2 text-left font-medium">הפרש (Δ)</th>
            </tr>
          </thead>
          <tbody>
            {row("זהב", expGold, actGold)}
            {row("עבודה", expLabor, actLabor)}
            {row("שיבוץ", expStone, actSetting)}
            {row("תוספות/חירום", expCont, actExtras)}
            <tr className="border-t-2 border-gray-300 font-bold">
              <td className="py-2 text-gray-900">סה"כ (לפני מע"מ)</td>
              <td className="py-2 text-left">₪{expectedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td className="py-2 text-left">₪{actualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td className={`py-2 text-left ${actualTotal > expectedTotal ? "text-red-600" : "text-green-600"}`}>
                ₪{(actualTotal - expectedTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
            </tr>
            {vatPercent > 0 && (
              <tr className="font-bold">
                <td className="py-1.5 text-gray-900">+ מע"מ {vatPercent}%</td>
                <td className="py-1.5 text-left">₪{expectedWithVat.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="py-1.5 text-left">₪{actualWithVat.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 pt-3 space-y-2 text-xs">
        <div className="flex justify-between text-gray-700">
          <span>תשלום לקוח</span>
          <span className="font-bold">₪{payment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>עלות בפועל{vatPercent > 0 ? ` (כולל מע"מ ${vatPercent}%)` : ""}</span>
          <span className="font-bold">₪{actualWithVat.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className={`flex justify-between font-bold text-sm ${isPositive ? "text-green-700" : "text-red-700"}`}>
          <span>רווח נקי</span>
          <span>
            ₪{netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            {" "}({profitPercent.toFixed(1)}%)
          </span>
        </div>

        {/* Profit variance vs expected */}
        {expected && (
          <div className="flex justify-between text-[11px] text-gray-500 border-t border-dashed border-gray-200 pt-1.5">
            <span>הפרש רווח מצפוי</span>
            <span className={actualWithVat > expectedWithVat ? "text-red-500" : "text-green-500"}>
              ₪{(expectedWithVat - actualWithVat).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitabilitySummary;
