import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, AlertCircle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EmailFormsToggle = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current setting
  const { data: setting, isLoading } = useQuery({
    queryKey: ["email-forms-enabled-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "email_forms_enabled")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Parse the JSON value safely
  const settingValue = setting?.value as { enabled?: boolean } | null;
  const isEnabled = settingValue?.enabled ?? true;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "email_forms_enabled")
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ 
            value: { enabled }, 
            updated_at: new Date().toISOString() 
          })
          .eq("key", "email_forms_enabled");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ 
            key: "email_forms_enabled", 
            value: { enabled } 
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["email-forms-enabled"] });
      queryClient.invalidateQueries({ queryKey: ["email-forms-enabled-admin"] });
      toast({
        title: enabled ? "טפסי לידים הופעלו" : "טפסי לידים כובו",
        description: enabled 
          ? "טפסי יצירת קשר יוצגו באתר" 
          : "כפתורי יצירת קשר מהירים יוצגו במקום הטפסים",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את ההגדרה",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    saveMutation.mutate(checked);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-accent" />
          סטטוס טופסי יצירת קשר במייל
        </CardTitle>
        <CardDescription>
          שליטה בהצגת טפסי השארת פרטים באתר
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
            <Label htmlFor="email-forms-toggle" className="text-base font-medium cursor-pointer">
              {isEnabled ? "טפסים מוצגים" : "טפסים מוסתרים"}
            </Label>
          </div>
          <Switch
            id="email-forms-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={saveMutation.isPending}
          />
        </div>

        <div className={`p-4 rounded-lg border ${isEnabled ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          {isEnabled ? (
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-700">טפסי לידים פעילים</p>
                <p className="text-sm text-green-600/80">
                  מבקרים יכולים להשאיר פרטים דרך הטפסים בדף צור קשר, פופ-אפ Exit Intent ופוטר.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">טפסים מושבתים</p>
                <p className="text-sm text-amber-600/80">
                  במקום הטפסים יוצגו כפתורי יצירת קשר מהירים: WhatsApp, חיוג טלפוני ומייל.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailFormsToggle;
