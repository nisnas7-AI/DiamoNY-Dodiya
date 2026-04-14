import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, Loader2 } from "lucide-react";
import diamonyLogo from "@/assets/diamony-logo.jpg";

const PIN_LENGTH = 6;
const PIN_SESSION_KEY = "admin_pin_verified";

interface AdminPinGateProps {
  children: React.ReactNode;
}

const AdminPinGate = ({ children }: AdminPinGateProps) => {
  const [verified, setVerified] = useState(() => {
    return sessionStorage.getItem(PIN_SESSION_KEY) === "true";
  });
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!verified && !isLoading) inputRefs.current[0]?.focus();
  }, [verified, isLoading]);

  const handleChange = async (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setError(false);
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === PIN_LENGTH - 1) {
      const pin = next.join("");
      setIsLoading(true);
      try {
        const { data } = await supabase.rpc("verify_admin_pin", { pin_attempt: pin });
        setIsLoading(false);
        if (data === true) {
          sessionStorage.setItem(PIN_SESSION_KEY, "true");
          setVerified(true);
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setDigits(Array(PIN_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
          }, 600);
        }
      } catch {
        setIsLoading(false);
        setError(true);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleForgotPin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/diamony-secure-admin`,
        });
        setShowForgot(true);
      }
    } catch {
      setShowForgot(true);
    }
  };

  if (verified) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(0_0%_4%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(38_42%_60%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(0_0%_4%)] flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-10">
          {/* Brand Logo */}
          <div className="w-14 h-14 rounded-full overflow-hidden border border-[hsl(38_42%_60%/0.25)] mx-auto mb-5">
            <img src={diamonyLogo} alt="DiamoNY" className="w-full h-full object-cover" />
          </div>
          <div className="w-14 h-14 border border-[hsl(38_42%_60%/0.25)] bg-[hsl(38_42%_60%/0.06)] flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-[hsl(38_42%_60%)]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-heading text-[hsl(37_33%_94%)] tracking-wide">Security Check</h1>
          <p className="text-[hsl(37_33%_94%/0.4)] text-sm mt-2 font-body">הזן קוד גישה בן 6 ספרות</p>
        </div>

        <div
          className={`flex gap-3 justify-center ${shake ? "animate-shake" : ""}`}
          style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
          role="group"
          aria-label="PIN code entry"
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`PIN digit ${i + 1}`}
              className={`w-12 h-14 text-center text-xl font-mono border-2 bg-[hsl(0_0%_6%)] text-[hsl(37_33%_94%)] outline-none transition-all duration-200 ${
                error
                  ? "border-red-500/80"
                  : d
                  ? "border-[hsl(38_42%_60%)]"
                  : "border-[hsl(0_0%_20%)] focus:border-[hsl(38_42%_60%/0.6)]"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mt-4 flex items-center justify-center gap-1" role="alert">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            קוד שגוי, נסה שוב
          </p>
        )}

        <div className="text-center mt-8">
          {showForgot ? (
            <p className="text-[hsl(38_42%_60%/0.5)] text-xs font-body">
              נשלח מייל לאיפוס. צור קשר עם מנהל המערכת לאיפוס ה-PIN.
            </p>
          ) : (
            <button
              onClick={handleForgotPin}
              className="text-[hsl(38_42%_60%/0.4)] hover:text-[hsl(38_42%_60%)] text-xs transition-colors font-body"
            >
              שכחתי PIN?
            </button>
          )}
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminPinGate;
