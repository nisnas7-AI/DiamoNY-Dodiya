import { useCallback } from 'react';

const RECAPTCHA_SITE_KEY = '6Ld2QlYsAAAAAO1sygaBLwkGh0Tj6nuf_Av-tiYN';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export const useRecaptcha = () => {
  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    try {
      if (typeof window === 'undefined' || !window.grecaptcha) {
        console.warn('reCAPTCHA not loaded');
        return null;
      }

      return new Promise((resolve) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
            resolve(token);
          } catch (error) {
            console.error('reCAPTCHA execution failed:', error);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      return null;
    }
  }, []);

  return { executeRecaptcha };
};
