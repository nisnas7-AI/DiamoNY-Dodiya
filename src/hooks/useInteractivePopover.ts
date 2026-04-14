import { useCallback, useEffect, useRef, useState } from "react";

type InteractionAction = "enter" | "leave" | "click" | "focus" | "blur";

export const useInteractivePopover = (isMobile: boolean, closeDelay = 300) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (isMobile) return;

    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenKey(null);
      closeTimerRef.current = null;
    }, closeDelay);
  }, [clearCloseTimer, closeDelay, isMobile]);

  const handleInteraction = useCallback(
    (key: string, action: InteractionAction) => {
      if (isMobile) {
        if (action === "click") {
          clearCloseTimer();
          setOpenKey((prev) => (prev === key ? null : key));
        }
        return;
      }

      if (action === "enter" || action === "focus") {
        clearCloseTimer();
        setOpenKey(key);
        return;
      }

      if (action === "leave" || action === "blur") {
        scheduleClose();
      }
    },
    [clearCloseTimer, isMobile, scheduleClose]
  );

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return {
    openKey,
    setOpenKey,
    clearCloseTimer,
    scheduleClose,
    handleInteraction,
  };
};