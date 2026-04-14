import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Lock, Loader2 } from "lucide-react";

const AdminPinSettings = () => {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const queryClient = useQueryClient();

  const { data: dbPin } = useQuery({
    queryKey: ["admin-pin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("id, pin_code")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updatePin = useMutation({
    mutationFn: async (pin: string) => {
      const { error } = await supabase
        .from("admin_settings")
        .update({ pin_code: pin })
        .eq("id", dbPin!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pin"] });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      // Clear session so new PIN takes effect
      sessionStorage.removeItem("admin_pin_verified");
      toast({ title: "PIN עודכן בהצלחה" });
    },
    onError: (e: Error) => {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPin !== dbPin?.pin_code) {
      toast({ title: "שגיאה", description: "PIN נוכחי שגוי", variant: "destructive" });
      return;
    }
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      toast({ title: "שגיאה", description: "PIN חדש חייב להיות 6 ספרות", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "שגיאה", description: "האימות לא תואם", variant: "destructive" });
      return;
    }
    updatePin.mutate(newPin);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          שינוי קוד PIN
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium mb-1 block">PIN נוכחי</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">PIN חדש</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">אימות PIN חדש</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
          </div>
          <Button type="submit" disabled={updatePin.isPending}>
            {updatePin.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            עדכן PIN
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminPinSettings;
