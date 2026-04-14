import { useState } from "react";
import { Send, MessageCircle, Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MESSAGE_TEMPLATE =
  "שלום, כאן ניצן מ-DiamoNY. היה לי העונג לעצב ולייצר עבורכם. הדעה שלכם היא היהלום שבכתר עבורנו, נשמח אם תשתפו את החוויה שלכם כאן ותעזרו לאחרים למצוא את התכשיט המושלם שלהם. לחצו על הקישור המצורף בכדי להמליץ עלינו ולהעניק לנו 5 כוכבים.\nDiamoNY https://g.page/r/CTvuyPZ1WHkZEBM/review\nתודה רבה והמשך יום מקסים!";

const EMAIL_SUBJECT = "בקשה קטנה מ-DiamoNY";

function formatPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("05") && digits.length === 10) return "972" + digits.slice(1);
  if (digits.startsWith("972") && digits.length === 12) return digits;
  if (digits.startsWith("+972")) return digits.slice(1);
  return null;
}

const VIPReviewRequestSender = () => {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleWhatsApp = () => {
    const formatted = formatPhone(phone.trim());
    if (!formatted) {
      toast.error("מספר נייד לא תקין");
      return;
    }
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(MESSAGE_TEMPLATE)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("כתובת אימייל לא תקינה");
      return;
    }
    const url = `mailto:${trimmed}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(MESSAGE_TEMPLATE)}`;
    window.open(url);
  };

  return (
    <div className="relative rounded-3xl bg-white p-6 md:p-8 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 justify-center md:justify-start mb-5">
        <Send className="w-5 h-5 text-[#C9A96E]" />
        <h3 className="text-base font-heading font-semibold text-slate-900">
          שלחו בקשת המלצה ללקוח
        </h3>
      </div>

      <div className="space-y-4" dir="rtl">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-body">מספר נייד</label>
          <Input
            type="tel"
            placeholder="050-000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 text-sm font-body focus-visible:ring-[#C9A96E]/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-body">אימייל</label>
          <Input
            type="email"
            placeholder="client@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 text-sm font-body focus-visible:ring-[#C9A96E]/40"
            dir="ltr"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="flex-1 flex gap-1.5">
            <Button
              onClick={handleWhatsApp}
              className="flex-1 rounded-full bg-gradient-to-r from-[#C9A96E] to-[#b8944f] hover:brightness-110 text-[#0a0a0a] font-semibold text-sm tracking-wide h-11 shadow-[0_4px_20px_rgba(201,169,110,0.35)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(201,169,110,0.45)]"
            >
              <MessageCircle className="w-4 h-4 ml-1.5" />
              שלח בווטסאפ
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="העתק קישור"
              className="h-11 w-11 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
              onClick={() => {
                const formatted = formatPhone(phone.trim());
                if (!formatted) { toast.error("מספר נייד לא תקין"); return; }
                const url = `https://wa.me/${formatted}?text=${encodeURIComponent(MESSAGE_TEMPLATE)}`;
                navigator.clipboard.writeText(url);
                toast.success("הקישור הועתק");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleEmail}
            variant="outline"
            className="flex-1 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-sm tracking-wide h-11 transition-all duration-300 hover:scale-[1.03]"
          >
            <Mail className="w-4 h-4 ml-1.5" />
            שלח במייל
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VIPReviewRequestSender;
