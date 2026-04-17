import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react";
// MFA disabled for now — restore when re-enabling 2FA:
// import MfaChallenge from "@/components/admin/MfaChallenge";
// import { hasMfaEnrolled } from "@/components/admin/MfaChallenge";
import diamonyLogo from "@/assets/diamony-logo.jpg";
import { isPasswordPwned } from "@/lib/pwnedPasswordCheck";

type ResetStep = "loading" | /* "mfa_required" | */ "new_password" | "success" | "error";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if this is a recovery flow by looking at the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "recovery") {
      setStep("new_password");
    } else {
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setStep("new_password");
        }
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStep("new_password");
        } else {
          setStep("error");
        }
      });
    }
  }, []);

  // const checkMfaAndProceed = async () => {
  //   const { enrolled } = await hasMfaEnrolled();
  //   if (enrolled) {
  //     setStep("mfa_required");
  //   } else {
  //     setStep("new_password");
  //   }
  // };
  // const handleMfaVerified = () => {
  //   setStep("new_password");
  // };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 8 תווים",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const pwned = await isPasswordPwned(newPassword);
      if (pwned) {
        toast({
          title: "סיסמה לא בטוחה",
          description: "הסיסמה שבחרת נמצאה בדליפות מידע מוכרות. אנא בחר סיסמה ייחודית ובטוחה יותר.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStep("success");
      toast({ title: "הסיסמה עודכנה בהצלחה ✓" });
      setTimeout(() => navigate("/diamony-secure-admin"), 3000);
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message || "לא ניתן לעדכן את הסיסמה",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // MFA challenge screen (disabled)
  // if (step === "mfa_required") {
  //   return (
  //     <>
  //       <Helmet>
  //         <title>אימות דו-שלבי | DiamoNY</title>
  //         <meta name="robots" content="noindex, nofollow" />
  //       </Helmet>
  //       <MfaChallenge
  //         onVerified={handleMfaVerified}
  //         onCancel={() => navigate("/diamony-secure-admin")}
  //       />
  //     </>
  //   );
  // }

  return (
    <>
      <Helmet>
        <title>איפוס סיסמה | DiamoNY</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        {step === "loading" && (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        )}

        {step === "error" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="font-heading text-2xl">קישור לא תקין</CardTitle>
              <CardDescription>
                הקישור לאיפוס הסיסמה אינו תקין או שפג תוקפו.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => navigate("/diamony-secure-admin")}
              >
                חזרה להתחברות
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "new_password" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full overflow-hidden border mb-4">
                <img src={diamonyLogo} alt="DiamoNY" className="w-full h-full object-cover" />
              </div>
              <CardTitle className="font-heading text-2xl">הגדרת סיסמה חדשה</CardTitle>
              <CardDescription>הזן סיסמה חדשה לחשבון הניהול שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">סיסמה חדשה</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="לפחות 8 תווים"
                      className="pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">אימות סיסמה חדשה</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="הזן שוב את הסיסמה"
                      className="pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  עדכן סיסמה
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="font-heading text-2xl">הסיסמה עודכנה!</CardTitle>
              <CardDescription>
                מעביר אותך לעמוד ההתחברות...
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
};

export default ResetPassword;
