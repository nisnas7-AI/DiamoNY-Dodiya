import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ConciergeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: { id: string; full_name: string };
  productId?: string;
}

const ConciergeOfferModal = ({ isOpen, onClose, member, productId }: ConciergeOfferModalProps) => {
  const queryClient = useQueryClient();
  const [heading, setHeading] = useState("");
  const [message, setMessage] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!heading.trim() || !message.trim()) throw new Error("נא למלא את כל השדות");
      const { error } = await supabase.from("vip_personalized_offers").insert({
        member_id: member.id,
        product_id: productId || null,
        heading: heading.trim(),
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      toast.success(`ההצעה נשלחה ל-${member.full_name}`);
      setHeading("");
      setMessage("");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-lg border border-[hsl(38,35%,50%)]/20 shadow-2xl rounded-2xl p-0 overflow-hidden"
        style={{ backgroundColor: "hsl(0 0% 7%)" }}
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center">
            <Sparkles className="w-8 h-8 mx-auto text-[hsl(38,35%,55%)] mb-3" />
            <DialogTitle className="text-xl font-heading font-bold text-white">
              הצעת Concierge ל-{member.full_name}
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">ההצעה תופיע כמסך פתיחה אישי בכניסה הבאה שלהם</p>
          </div>

          {/* Form */}
          <div className="px-6 pb-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium">כותרת ההצעה (Serif)</label>
              <Input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="הצעה בלעדית רק עבורך..."
                className="bg-white/5 border-white/10 text-white font-heading text-lg h-12 rounded-xl focus:border-[hsl(38,35%,55%)] focus:ring-[hsl(38,35%,55%)]/30"
                dir="rtl"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium">גוף ההודעה</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="שמנו לב שאהבת את... נרצה להציע לך..."
                className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] resize-none focus:border-[hsl(38,35%,55%)] focus:ring-[hsl(38,35%,55%)]/30"
                dir="rtl"
                maxLength={500}
              />
              <p className="text-[10px] text-white/30 text-left" dir="ltr">{message.length}/500</p>
            </div>

            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!heading.trim() || !message.trim() || sendMutation.isPending}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[hsl(38,35%,55%)] to-[hsl(38,35%,40%)] text-[hsl(0,0%,7%)] font-bold text-base hover:brightness-110 transition-all duration-300 disabled:opacity-40"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  שלח הצעה אישית
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ConciergeOfferModal;
