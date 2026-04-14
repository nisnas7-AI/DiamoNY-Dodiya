import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmailFormsEnabled } from "@/hooks/useEmailFormsEnabled";

interface ComingSoonLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
}

const ComingSoonLeadModal = ({ isOpen, onClose, categoryName }: ComingSoonLeadModalProps) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isEmailFormsEnabled } = useEmailFormsEnabled();

  const phoneNumber = "972546290534";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(`היי, אשמח לשמוע על קולקציית ${categoryName}`)}`;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      await supabase.from("leads").insert({
        name: "Coming Soon – " + categoryName,
        email: trimmed,
        message: `מעוניין/ת בעדכון על קולקציית ${categoryName}`,
        source: "coming_soon_modal",
      });
      setSubmitted(true);
    } catch {
      toast.error("שגיאה, נסו שוב מאוחר יותר");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setEmail("");
      setSubmitted(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[200]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            dir="rtl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-[340px] rounded-3xl p-6 relative"
              style={{
                backgroundColor: "#FDFBF7",
                boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(212, 175, 55, 0.15)",
              }}
            >
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 left-4 p-1 text-gray-400 hover:text-[#1A1A1A] transition-colors"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                <div className="text-center py-6">
                  <p className="text-xl font-bold text-[#1A1A1A] mb-2">💎</p>
                  <p className="text-lg font-bold text-[#1A1A1A]">תודה! נעדכן אותך בקרוב.</p>
                </div>
              ) : (
                <>
                  {/* Title */}
                  <h2 className="text-xl font-bold text-[#1A1A1A] text-center mt-2 mb-3">
                    יצירת מופת דורשת זמן.
                  </h2>

                  {isEmailFormsEnabled ? (
                    <>
                      <p className="text-sm text-[#1A1A1A] text-center tracking-wide mb-5 leading-relaxed">
                        אנו מרעננים כעת את קולקציית {categoryName} עם עיצובים חדשים.
                        השאירו פרטים וקבלו עדכון ברגע שהקולקציה באוויר.
                      </p>
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="האימייל שלך..."
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-right text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 transition"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-300 disabled:opacity-60"
                          style={{ backgroundColor: "#1A1A1A" }}
                        >
                          {loading ? "שולח..." : "עדכנו אותי"}
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#1A1A1A] text-center tracking-wide mb-5 leading-relaxed">
                        אנו מרעננים כעת את קולקציית {categoryName}. למידע נוסף והזמנות מיוחדות, נשמח לעמוד לשירותכם.
                      </p>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-300 hover:opacity-90"
                        style={{ backgroundColor: "#25D366" }}
                      >
                        <MessageCircle className="w-5 h-5" fill="white" />
                        צור איתנו קשר כאן בווצאפ
                      </a>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ComingSoonLeadModal;
