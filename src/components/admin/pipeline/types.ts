export interface Order {
  id: string;
  customer_id: string | null;
  order_name: string;
  description: string | null;
  status: string | null;
  estimated_price: number | null;
  final_price: number | null;
  product_id: string | null;
  ring_size: string | null;
  gold_color_override: string | null;
  designer_notes: string | null;
  consultation_at: string | null;
  sketch_approved_at: string | null;
  casting_started_at: string | null;
  polishing_started_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  sketch_notes: string | null;
  production_notes: string | null;
  customer_notes: string | null;
  customer_grade: string | null;
  updated_at: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
}

export interface ExpectedCosts {
  id: string;
  order_id: string;
  gold_cost: number;
  labor_cost: number;
  stone_setting_cost: number;
  contingencies: number;
  final_quoted_price: number | null;
}

export interface ActualCost {
  id: string;
  order_id: string;
  stage: string;
  gold_cost: number;
  labor_cost: number;
  setting_cost: number;
  extras: number;
  description: string | null;
  created_at: string;
}

export const STAGES = [
  { key: "consultation", label: "פגישת אפיון", tsField: "consultation_at" },
  { key: "3d_approval", label: "אישור מודל 3D", tsField: "sketch_approved_at" },
  { key: "production", label: "יציקה ושיבוץ", tsField: "casting_started_at" },
  { key: "qa", label: "בקרת איכות", tsField: "polishing_started_at" },
  { key: "ready", label: "מוכן למסירה", tsField: "ready_at" },
  { key: "delivered", label: "נמסר/הושלם", tsField: "delivered_at" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export const stageIndex = (status: string | null): number => {
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

export const stageBadgeColor = (current: number, idx: number) => {
  if (idx < current) return "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30";
  if (idx === current) return "bg-[#D4AF37] text-gray-900 border-[#D4AF37]";
  return "bg-gray-200 text-gray-500 border-gray-300";
};

export const CUSTOMER_GRADES = [
  { key: "vip_gold", label: "VIP זהב", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { key: "vip_silver", label: "VIP כסף", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { key: "standard", label: "סטנדרטי", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "new", label: "לקוח חדש", color: "bg-green-50 text-green-700 border-green-200" },
  { key: "risk", label: "סיכון", color: "bg-red-50 text-red-700 border-red-200" },
] as const;

export const TAX_RATE = 0.18;
export const MIN_MARGIN = 2000;
