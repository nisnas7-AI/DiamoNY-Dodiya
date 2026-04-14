import { useState, useEffect, useCallback } from "react";
import { X, Share, Download } from "lucide-react";

const getOS = (): "ios" | "android" | "other" => {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;

const A2HS_KEY = "pwa_interacted";

const A2HSPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const os = getOS();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(A2HS_KEY)) return;
    if (os === "other") return;

    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [os]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(A2HS_KEY, "true");
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }, [deferredPrompt, dismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[60] animate-in slide-in-from-bottom duration-400"
      dir="rtl"
    >
      <div
        className="mx-3 mb-3 rounded-2xl px-5 py-4 shadow-2xl border border-[#D4AF37]/30 relative"
        style={{
          background: "linear-gradient(135deg, #0A3B2C 0%, #0d4a38 100%)",
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 left-3 p-1.5 rounded-full bg-white/10 active:bg-white/20 transition-colors"
          aria-label="סגור"
        >
          <X size={14} className="text-[#D4AF37]" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center mt-0.5">
            <span className="text-[#D4AF37] text-lg">💎</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[#D4AF37] font-bold text-sm leading-tight mb-1">
              הפוך את DiamoNY לאפליקציה
            </p>
            <p className="text-white/60 text-xs mb-2">
              לגישה מהירה מכל מקום
            </p>

            {os === "ios" ? (
              <div className="space-y-2">
                <p className="text-white/70 text-xs leading-relaxed">
                  לחץ על{" "}
                  <Share size={12} className="inline text-[#D4AF37] -mt-0.5" />{" "}
                  (שיתוף) ואז על{" "}
                  <span className="text-white font-semibold">
                    ״הוסף למסך הבית״
                  </span>
                </p>
                <div className="flex justify-center pt-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-[#D4AF37] animate-bounce"
                  >
                    <path
                      d="M10 4v12m0 0l-4-4m4 4l4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 bg-[#D4AF37] text-[#0A3B2C] font-bold text-xs px-4 py-2 rounded-xl active:scale-[0.97] transition-transform"
              >
                <Download size={14} />
                התקן עכשיו
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default A2HSPrompt;
