import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVip } from "@/contexts/VipContext";

interface VipRule {
  product_id: string;
  discount_percentage: number;
  is_vip_exclusive: boolean;
}

interface VipRulesContextType {
  getRule: (productId: string) => VipRule | undefined;
}

const VipRulesContext = createContext<VipRulesContextType>({ getRule: () => undefined });

export const useVipRules = () => useContext(VipRulesContext);

export const VipRulesProvider = ({ children }: { children: ReactNode }) => {
  const { isVip } = useVip();

  const { data: rulesMap } = useQuery({
    queryKey: ["vip-product-rules-batch"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vip_product_rules")
        .select("product_id, discount_percentage, is_vip_exclusive");
      const map = new Map<string, VipRule>();
      for (const rule of data || []) {
        map.set(rule.product_id, rule as VipRule);
      }
      return map;
    },
    enabled: isVip,
    staleTime: 1000 * 60 * 10,
  });

  const getRule = (productId: string) => rulesMap?.get(productId);

  return (
    <VipRulesContext.Provider value={{ getRule }}>
      {children}
    </VipRulesContext.Provider>
  );
};
