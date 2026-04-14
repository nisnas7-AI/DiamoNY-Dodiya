import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Detect device type from user agent — always returns a clean string.
 */
function getDeviceType(): string {
  try {
    const ua = navigator.userAgent || "";
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "Tablet";
    if (/Mobi|Android|iPhone|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua)) return "Mobile";
    return "Desktop";
  } catch {
    return "Desktop";
  }
}

/**
 * Infer country/region from timezone as lightweight proxy
 */
function inferCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzMap: Record<string, string> = {
      "Asia/Jerusalem": "IL",
      "Asia/Tel_Aviv": "IL",
      "America/New_York": "US",
      "America/Chicago": "US",
      "America/Denver": "US",
      "America/Los_Angeles": "US",
      "Europe/London": "GB",
      "Europe/Paris": "FR",
      "Europe/Berlin": "DE",
      "Europe/Moscow": "RU",
      "Asia/Tokyo": "JP",
      "Asia/Shanghai": "CN",
      "Australia/Sydney": "AU",
      "America/Toronto": "CA",
      "America/Sao_Paulo": "BR",
      "Asia/Dubai": "AE",
      "Asia/Kolkata": "IN",
      "Asia/Calcutta": "IN",
    };
    return tzMap[tz] || tz.split("/")[0] || "Unknown";
  } catch {
    return "Unknown";
  }
}

/**
 * Detect traffic source from URL ?ref= parameter.
 */
function getTrafficSource(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get("ref") || "").toLowerCase();
    if (ref === "nfc") return "nfc";
    if (ref === "qr") return "qr";
    return "direct";
  } catch {
    return "direct";
  }
}

/**
 * Build a common payload for every event.
 */
function buildPayload(
  eventType: string,
  eventValue?: string,
  extra?: { duration_seconds?: number },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    event_type: eventType,
    event_value: eventValue || null,
    device_type: getDeviceType(),
    country: inferCountry(),
  };
  if (extra?.duration_seconds != null) {
    payload.duration_seconds = extra.duration_seconds;
  }
  return payload;
}

/**
 * Track a page visit with traffic source detection.
 * Stores the ref source as the event_value for 'traffic_source' events.
 */
export function trackPageSource(): void {
  const source = getTrafficSource();
  const payload = buildPayload("traffic_source", source);
  supabase
    .from("analytics_events" as any)
    .insert(payload)
    .then(({ error }) => {
      if (error) console.warn("[analytics]", error.message);
    });
}

/**
 * Send an event using navigator.sendBeacon (survives page unloads).
 * Falls back to normal supabase insert when sendBeacon is unavailable.
 */
function sendViaBeacon(payload: Record<string, unknown>): void {
  if (typeof navigator.sendBeacon === "function" && SUPABASE_URL && SUPABASE_KEY) {
    const url = `${SUPABASE_URL}/rest/v1/analytics_events`;
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    // sendBeacon doesn't support custom headers, so we use fetch with keepalive
    try {
      fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // last resort
      navigator.sendBeacon(url, blob);
    }
    return;
  }
  // Fallback: normal insert
  supabase
    .from("analytics_events" as any)
    .insert(payload)
    .then(({ error }) => {
      if (error) console.warn("[analytics]", error.message);
    });
}

/**
 * Fire-and-forget analytics event insert.
 * Errors are silently swallowed so tracking never blocks UX.
 */
export const trackEvent = (eventType: string, eventValue?: string, extra?: { duration_seconds?: number }) => {
  const payload = buildPayload(eventType, eventValue, extra);
  supabase
    .from("analytics_events" as any)
    .insert(payload)
    .then(({ error }) => {
      if (error) console.warn("[analytics]", error.message);
    });
};

/**
 * Tracks dwell time on a page.
 * Uses visibilitychange + keepalive fetch to survive tab close / navigation.
 * Also handles React unmount cleanup.
 */
export function trackDwellTime(pageName: string, pageValue?: string): () => void {
  const startTime = Date.now();
  let fired = false;

  const fire = () => {
    if (fired) return;
    fired = true;
    const seconds = Math.round((Date.now() - startTime) / 1000);
    if (seconds < 2) return; // skip trivial visits
    const payload = buildPayload(pageName, pageValue, { duration_seconds: seconds });
    sendViaBeacon(payload);
  };

  const handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      fire();
    }
  };

  const handleBeforeUnload = () => {
    fire();
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("beforeunload", handleBeforeUnload);

  // Cleanup: called on React unmount or route change
  return () => {
    fire();
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}
