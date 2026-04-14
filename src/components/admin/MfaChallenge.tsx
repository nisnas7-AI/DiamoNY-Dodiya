import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import diamonyLogo from "@/assets/diamony-logo.jpg";

const DIGIT_COUNT = 6;
const TRUSTED_DEVICE_KEY = "diamony_trusted_device";
const TRUSTED_DEVICE_DAYS = 30;

interface MfaChallengeProps {
  onVerified: () => void;
  onCancel: () => void;
}

/** Check if device is trusted (has valid non-expired token). */
export function isDeviceTrusted(): boolean {
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICE_KEY);
    if (!raw) return false;
    const { expiry } = JSON.parse(raw);
    return typeof expiry === "number" && Date.now() < expiry;
  } catch {
    return false;
  }
}

/** Store trusted device flag with 30-day expiry. */
function trustDevice() {
  localStorage.setItem(
    TRUSTED_DEVICE_KEY,
    JSON.stringify({ expiry: Date.now() + TRUSTED_DEVICE_DAYS * 86400000 })
  );
}

/** Check if user has MFA enrolled (any verified TOTP factor). */
export async function hasMfaEnrolled(): Promise<{ enrolled: boolean; factorId?: string }> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { enrolled: false };
  const totp = data.totp.find((f) => f.status === "verified");
  return totp ? { enrolled: true, factorId: totp.id } : { enrolled: false };
}

/** Verify MFA silently (for trusted devices). Returns true on success. */
export async function verifyMfaSilently(factorId: string): Promise<boolean> {
  try {
    // We can't auto-verify without a code, but we can check AAL level
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.currentLevel === "aal2";
  } catch {
    return false;
  }
}

const MfaChallenge = ({ onVerified, onCancel }: MfaChallengeProps) => {
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(""));
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleVerify = async (code: string) => {
    setVerifying(true);
    setError(false);
    try {
      const { enrolled, factorId } = await hasMfaEnrolled();
      if (!enrolled || !factorId) {
        onVerified();
        return;
      }

      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyErr) {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setDigits(Array(DIGIT_COUNT).fill(""));
          inputRefs.current[0]?.focus();
        }, 600);
        toast({
          title: "קוד שגוי",
          description: "נא לנסות שוב עם קוד עדכני",
          variant: "destructive",
        });
        return;
      }

      if (rememberDevice) {
        trustDevice();
      }

      toast({ title: "אימות הצליח ✓" });
      onVerified();
    } catch (err: any) {
      toast({
        title: "שגיאת אימות",
        description: err.message || "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setError(false);
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === DIGIT_COUNT - 1) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
    if (pasted.length === DIGIT_COUNT) {
      const next = pasted.split("");
      setDigits(next);
      handleVerify(pasted);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(0_0%_4%)] flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-[hsl(38_42%_60%/0.25)] mx-auto mb-5">
            <img src={diamonyLogo} alt="DiamoNY" className="w-full h-full object-cover" />
          </div>
          <div className="w-14 h-14 border border-[hsl(38_42%_60%/0.25)] bg-[hsl(38_42%_60%/0.06)] flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-[hsl(38_42%_60%)]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-heading text-[hsl(37_33%_94%)] tracking-wide">
            אימות דו-שלבי
          </h1>
          <p className="text-[hsl(37_33%_94%/0.4)] text-sm mt-2 font-body">
            הזן את הקוד מאפליקציית ה-Authenticator
          </p>
        </div>

        <div
          className={`flex gap-3 justify-center ${shake ? "animate-shake" : ""}`}
          style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
          role="group"
          aria-label="MFA code entry"
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
              onPaste={i === 0 ? handlePaste : undefined}
              aria-label={`MFA digit ${i + 1}`}
              disabled={verifying}
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

        {verifying && (
          <div className="flex justify-center mt-4">
            <Loader2 className="h-5 w-5 animate-spin text-[hsl(38_42%_60%)]" />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mt-4 flex items-center justify-center gap-1" role="alert">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            קוד שגוי, נסה שוב
          </p>
        )}

        {/* Remember device */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <Checkbox
            id="remember-device"
            checked={rememberDevice}
            onCheckedChange={(checked) => setRememberDevice(checked === true)}
            className="border-[hsl(38_42%_60%/0.4)] data-[state=checked]:bg-[hsl(38_42%_60%)] data-[state=checked]:border-[hsl(38_42%_60%)]"
          />
          <label
            htmlFor="remember-device"
            className="text-[hsl(37_33%_94%/0.5)] text-sm cursor-pointer select-none"
          >
            זכור מכשיר זה ל-30 יום
          </label>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={onCancel}
            className="text-[hsl(38_42%_60%/0.4)] hover:text-[hsl(38_42%_60%)] text-xs transition-colors font-body"
          >
            חזרה להתחברות
          </button>
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

export default MfaChallenge;
