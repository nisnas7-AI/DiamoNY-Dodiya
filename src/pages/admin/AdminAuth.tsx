import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from "react-helmet-async";
import { Mail, Lock, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
// MFA / 2FA temporarily disabled — restore when re-enabling:
// import MfaChallenge, { hasMfaEnrolled, isDeviceTrusted } from "@/components/admin/MfaChallenge";

const loginSchema = z.object({
  email: z.string().email("כתובת מייל לא תקינה"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// type AuthStep = "login" | "mfa_challenge" | "checking";

const AdminAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading, signIn } = useAdminAuth();

  // const [authStep, setAuthStep] = useState<AuthStep>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Redirect if already authenticated as admin (MFA gate commented out for now)
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, isLoading, navigate]);

  // const checkMfaAndRedirect = async () => {
  //   const { enrolled } = await hasMfaEnrolled();
  //   if (!enrolled) {
  //     navigate("/admin");
  //     return;
  //   }
  //   const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  //   if (data?.currentLevel === "aal2") {
  //     navigate("/admin");
  //     return;
  //   }
  //   if (isDeviceTrusted()) {
  //     navigate("/admin");
  //     return;
  //   }
  //   setAuthStep("mfa_challenge");
  // };

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(values.email, values.password);
      
      if (error) {
        toast({
          title: "שגיאה בהתחברות",
          description: error.message === "Invalid login credentials" 
            ? "פרטי ההתחברות שגויים" 
            : error.message,
          variant: "destructive",
        });
        return;
      }

      // After successful login, useEffect redirects to /admin (MFA was checkMfaAndRedirect)
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת מייל",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "שגיאה",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "נשלח בהצלחה",
        description: "קישור לאיפוס סיסמה נשלח לכתובת המייל שלך",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // const handleMfaVerified = () => {
  //   navigate("/admin");
  // };
  // const handleMfaCancel = async () => {
  //   await supabase.auth.signOut();
  //   setAuthStep("login");
  // };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // MFA Challenge screen (disabled)
  // if (authStep === "mfa_challenge") {
  //   return (
  //     <>
  //       <Helmet>
  //         <title>אימות דו-שלבי | DiamoNY</title>
  //         <meta name="robots" content="noindex, nofollow" />
  //       </Helmet>
  //       <MfaChallenge onVerified={handleMfaVerified} onCancel={handleMfaCancel} />
  //     </>
  //   );
  // }

  // Show access denied if logged in but not admin
  if (user && !isAdmin && !isLoading) {
    return (
      <>
        <Helmet>
          <title>גישה נדחתה | DiamoNY</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="font-heading text-2xl">גישה נדחתה</CardTitle>
              <CardDescription>
                אין לך הרשאות לגשת לעמוד זה
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>כניסה למערכת | DiamoNY</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl">כניסה למערכת הניהול</CardTitle>
            <CardDescription>
              גישה מורשית בלבד
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showForgotPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">כתובת מייל</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      className="pr-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleForgotPassword} 
                  className="w-full" 
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : null}
                  שלח קישור לאיפוס
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                  }}
                  className="w-full"
                >
                  חזרה להתחברות
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מייל</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              className="pr-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>סיסמה</FormLabel>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-primary hover:underline"
                          >
                            שכחתי סיסמה
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pr-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : null}
                    התחבר
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminAuth;
