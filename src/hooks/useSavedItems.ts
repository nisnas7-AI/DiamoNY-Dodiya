import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVip } from "@/contexts/VipContext";

export const useSavedItems = () => {
  const { member, isVip } = useVip();
  const queryClient = useQueryClient();

  const { data: savedItemIds = [], isLoading } = useQuery({
    queryKey: ["vip-saved-items", member?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_saved_items")
        .select("product_id")
        .eq("member_id", member!.id);
      if (error) throw error;
      return (data || []).map((d: any) => d.product_id as string);
    },
    enabled: isVip && !!member?.id,
    staleTime: 1000 * 60 * 5,
  });

  const toggleSave = useMutation({
    mutationFn: async (productId: string) => {
      if (!member) throw new Error("Not VIP");
      const isSaved = savedItemIds.includes(productId);
      if (isSaved) {
        const { error } = await supabase
          .from("vip_saved_items")
          .delete()
          .eq("member_id", member.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vip_saved_items")
          .insert({ member_id: member.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vip-saved-items", member?.id] });
    },
  });

  const isSaved = (productId: string) => savedItemIds.includes(productId);

  return { savedItemIds, isSaved, toggleSave, isLoading };
};
