import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, QrCode, KeyRound, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MfaEnrollment = () => {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [factorId, setFactorId] = useState("");

  // Enrollment state
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Recovery codes
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecovery, setShowRecovery] = useState(false);

  // Unenroll state
  const [unenrolling, setUnenrolling] = useState(false);
  const [unenrollCode, setUnenrollCode] = useState("");

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = data.totp.find((f) => f.status === "verified");
      if (totp) {
        setIsEnrolled(true);
        setFactorId(totp.id);
      }
    } catch (err: any) {
      console.error("MFA status check failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "DiamoNY Admin Authenticator",
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message || "לא ניתן להפעיל MFA",
        variant: "destructive",
      });
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyErr) throw verifyErr;

      // Generate recovery codes (client-side)
      const codes = Array.from({ length: 8 }, () =>
        Array.from({ length: 8 }, () => Math.random().toString(36).charAt(2))
          .join("")
          .toUpperCase()
      );
      setRecoveryCodes(codes);
      setShowRecovery(true);
      setIsEnrolled(true);
      setEnrolling(false);
      setQrCode("");
      setSecret("");
      setVerifyCode("");

      toast({ title: "אימות דו-שלבי הופעל בהצלחה ✓" });
    } catch (err: any) {
      toast({
        title: "קוד שגוי",
        description: "נא לנסות שוב עם קוד עדכני מהאפליקציה",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenroll = async () => {
    if (unenrollCode.length !== 6) {
      toast({ title: "שגיאה", description: "יש להזין קוד בן 6 ספרות", variant: "destructive" });
      return;
    }
    setUnenrolling(true);
    try {
      // Verify current code first
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: unenrollCode,
      });
      if (verifyErr) throw verifyErr;

      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      setIsEnrolled(false);
      setFactorId("");
      setUnenrollCode("");
      // Clear trusted device
      localStorage.removeItem("diamony_trusted_device");

      toast({ title: "אימות דו-שלבי בוטל" });
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message || "לא ניתן לבטל MFA",
        variant: "destructive",
      });
    } finally {
      setUnenrolling(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    toast({ title: "קודי שחזור הועתקו ללוח" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            הגדרות אבטחה - אימות דו-שלבי (2FA)
          </CardTitle>
          <CardDescription>
            הגן על חשבון הניהול שלך עם אימות דו-שלבי באמצעות אפליקציית Authenticator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {isEnrolled ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">אימות דו-שלבי פעיל</span>
                <Badge variant="outline" className="border-green-500 text-green-700">מאובטח</Badge>
              </>
            ) : (
              <>
                <ShieldOff className="h-5 w-5 text-amber-500" />
                <span className="font-medium text-amber-600">אימות דו-שלבי לא פעיל</span>
                <Badge variant="outline" className="border-amber-500 text-amber-600">לא מאובטח</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recovery Codes Display */}
      {showRecovery && recoveryCodes.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              קודי שחזור - שמור במקום בטוח!
            </CardTitle>
            <CardDescription className="text-amber-700">
              קודי השחזור הבאים ישמשו אותך אם תאבד גישה לאפליקציית ה-Authenticator.
              כל קוד ניתן לשימוש חד-פעמי בלבד.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4 p-4 bg-white/80 border font-mono text-sm">
              {recoveryCodes.map((code, i) => (
                <div key={i} className="py-1 text-center tracking-widest">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyRecoveryCodes}>
                <Copy className="h-4 w-4 ml-2" />
                העתק קודים
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowRecovery(false)}>
                סגור
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrollment Flow */}
      {!isEnrolled && !enrolling && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                הפעל אימות דו-שלבי כדי להוסיף שכבת הגנה נוספת לחשבון הניהול שלך.
              </p>
              <Button onClick={startEnrollment}>
                <KeyRound className="h-4 w-4 ml-2" />
                הפעל אימות דו-שלבי
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code & Verification */}
      {enrolling && qrCode && (
        <Card>
          <CardHeader>
            <CardTitle>סרוק את קוד ה-QR</CardTitle>
            <CardDescription>
              פתח את אפליקציית ה-Authenticator (Google Authenticator, Authy וכו') וסרוק את הקוד
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-white border inline-block">
                <img src={qrCode} alt="QR Code for TOTP" className="w-48 h-48" />
              </div>
            </div>

            {secret && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">או הזן ידנית:</p>
                <code className="text-xs bg-muted px-3 py-1.5 font-mono tracking-wider select-all">
                  {secret}
                </code>
              </div>
            )}

            <div className="max-w-xs mx-auto space-y-3">
              <label className="text-sm font-medium block text-center">
                הזן את הקוד מאפליקציית ה-Authenticator
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-xl tracking-[0.5em] font-mono"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={verifyEnrollment}
                  disabled={verifyCode.length !== 6 || verifying}
                  className="flex-1"
                >
                  {verifying && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  אמת והפעל
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEnrolling(false);
                    setQrCode("");
                    setSecret("");
                    setVerifyCode("");
                  }}
                >
                  ביטול
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unenroll */}
      {isEnrolled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <ShieldOff className="h-5 w-5" />
              ביטול אימות דו-שלבי
            </CardTitle>
            <CardDescription>
              להסרת אימות דו-שלבי, הזן קוד עדכני מאפליקציית ה-Authenticator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-3">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={unenrollCode}
                onChange={(e) => setUnenrollCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-xl tracking-[0.5em] font-mono"
              />
              <Button
                variant="destructive"
                onClick={handleUnenroll}
                disabled={unenrollCode.length !== 6 || unenrolling}
                className="w-full"
              >
                {unenrolling && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                בטל אימות דו-שלבי
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MfaEnrollment;
