import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SETTING_KEYS = {
  enabled: "interstitial_enabled",
  heading: "interstitial_heading",
  body: "interstitial_body",
  button_text: "interstitial_button_text",
};

const WelcomeInterstitialConfig = () => {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    enabled: false,
    heading: "ברוך הבא לכספת",
    body: "הגישה הבלעדית שלך לעולם התכשיטנות המובחרת. גלה קולקציות פרימיום, הטבות ייחודיות, וחוויה מותאמת אישית.",
    button_text: "כניסה לכספת",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["vault-interstitial-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_settings")
        .select("*")
        .in("key", Object.values(SETTING_KEYS));
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      return map;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings[SETTING_KEYS.enabled] === "true",
        heading: settings[SETTING_KEYS.heading] || form.heading,
        body: settings[SETTING_KEYS.body] || form.body,
        button_text: settings[SETTING_KEYS.button_text] || form.button_text,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = [
        { key: SETTING_KEYS.enabled, value: String(form.enabled) },
        { key: SETTING_KEYS.heading, value: form.heading },
        { key: SETTING_KEYS.body, value: form.body },
        { key: SETTING_KEYS.button_text, value: form.button_text },
      ];

      for (const entry of entries) {
        const { data: existing } = await supabase
          .from("vip_settings")
          .select("key")
          .eq("key", entry.key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("vip_settings")
            .update({ value: entry.value })
            .eq("key", entry.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("vip_settings")
            .insert(entry);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-interstitial-settings"] });
      toast.success("הגדרות Interstitial נשמרו");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">Welcome Interstitial</h4>
          <p className="text-xs text-muted-foreground">מסך ברכה אלגנטי שמופיע בכניסה ראשונה של חבר VIP</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{form.enabled ? "פעיל" : "כבוי"}</span>
          <Switch
            checked={form.enabled}
            onCheckedChange={(checked) => setForm(f => ({ ...f, enabled: checked }))}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">כותרת (Serif Font)</label>
          <Input
            value={form.heading}
            onChange={(e) => setForm(f => ({ ...f, heading: e.target.value }))}
            className="font-heading text-lg"
            dir="rtl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">טקסט גוף</label>
          <Textarea
            value={form.body}
            onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
            rows={4}
            dir="rtl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">טקסט כפתור</label>
          <Input
            value={form.button_text}
            onChange={(e) => setForm(f => ({ ...f, button_text: e.target.value }))}
            dir="rtl"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {saveMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Save className="w-4 h-4 ml-1" /> שמור הגדרות</>
          }
        </Button>
        <Button variant="outline" onClick={() => setShowPreview(true)}>
          <Eye className="w-4 h-4 ml-1" /> תצוגה מקדימה
        </Button>
      </div>

      {/* Full-screen Preview Overlay */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backgroundColor: "hsl(0 0% 4% / 0.95)" }}
            dir="rtl"
          >
            {/* Subtle gold radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, hsl(38 35% 55% / 0.08) 0%, transparent 60%)",
              }}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
              className="relative max-w-lg w-full mx-6 text-center space-y-8"
            >
              {/* Decorative sparkle */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Sparkles className="w-10 h-10 mx-auto text-[hsl(38,35%,55%)]" />
              </motion.div>

              {/* Heading — Serif Font */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl md:text-4xl font-heading font-extrabold text-white leading-tight"
              >
                {form.heading || "ברוך הבא לכספת"}
              </motion.h1>

              {/* Body */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="text-base md:text-lg text-white/70 leading-relaxed max-w-md mx-auto"
              >
                {form.body}
              </motion.p>

              {/* Gold line separator */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.55, duration: 0.6 }}
                className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[hsl(38,35%,55%)] to-transparent"
              />

              {/* CTA — the ONLY dismiss mechanism */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
              >
                <Button
                  onClick={() => setShowPreview(false)}
                  className="bg-gradient-to-r from-[hsl(38,35%,55%)] to-[hsl(38,35%,40%)] text-[hsl(0,0%,7%)] font-bold text-base px-10 py-6 rounded-xl hover:brightness-110 hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_hsl(38,35%,55%,0.2)]"
                >
                  {form.button_text || "כניסה לכספת"}
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-xs text-white/20"
              >
                תצוגה מקדימה — לחץ על הכפתור לסגירה
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeInterstitialConfig;
