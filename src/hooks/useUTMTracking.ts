import { useEffect, useState } from "react";

export interface UTMParams {
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  referral_source: string | null;
  landing_page: string | null;
}

const UTM_STORAGE_KEY = "diamony_utm_params";

export const getUTMParams = (): UTMParams => {
  // First check localStorage for stored UTM params
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage errors
  }

  // Extract from current URL
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get("utm_source"),
    utm_campaign: urlParams.get("utm_campaign"),
    utm_medium: urlParams.get("utm_medium"),
    referral_source: document.referrer || null,
    landing_page: window.location.pathname,
  };
};

export const useUTMTracking = () => {
  const [utmParams, setUtmParams] = useState<UTMParams>({
    utm_source: null,
    utm_campaign: null,
    utm_medium: null,
    referral_source: null,
    landing_page: null,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const currentParams: UTMParams = {
      utm_source: urlParams.get("utm_source"),
      utm_campaign: urlParams.get("utm_campaign"),
      utm_medium: urlParams.get("utm_medium"),
      referral_source: document.referrer || null,
      landing_page: window.location.pathname,
    };

    // Only store if we have new UTM params
    if (currentParams.utm_source || currentParams.utm_campaign || currentParams.utm_medium) {
      try {
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(currentParams));
      } catch {
        // Ignore storage errors
      }
    }

    // Get stored or current params
    const params = getUTMParams();
    setUtmParams(params);
  }, []);

  return utmParams;
};
