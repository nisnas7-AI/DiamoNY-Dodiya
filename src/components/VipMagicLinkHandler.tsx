import { useEffect, useRef, useState } from "react";
import { useVip } from "@/contexts/VipContext";

const VipMagicLinkHandler = () => {
  const { isLoading } = useVip();
  const processed = useRef(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (processed.current || isLoading) return;

    const params = new URLSearchParams(window.location.search);
    const shouldOpen = params.has("vip_login") || params.has("vip_key");
    if (!shouldOpen) return;

    processed.current = true;

    // Clean URL immediately
    params.delete("vip_login");
    params.delete("vip_key");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);

    // Open the login modal — never auto-login
    setShowLogin(true);
  }, [isLoading]);

  // Lazy-load the login modal only when needed
  const [LoginModal, setLoginModal] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (showLogin) {
      import("@/components/VaultLoginModal").then(({ default: Modal }) => {
        setLoginModal(() => Modal);
      });
    }
  }, [showLogin]);

  return (
    <>
      {showLogin && LoginModal && (
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      )}
    </>
  );
};

export default VipMagicLinkHandler;
