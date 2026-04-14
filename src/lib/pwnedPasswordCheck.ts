/**
 * Check if a password has been found in known data breaches
 * using the HaveIBeenPwned Passwords API (k-anonymity model).
 * Only the first 5 chars of the SHA-1 hash are sent — the full
 * password never leaves the browser.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return false; // fail-open so the user isn't blocked by API issues
    const text = await res.text();
    return text.split("\n").some((line) => {
      const [hash, count] = line.split(":");
      return hash.trim() === suffix && parseInt(count, 10) > 0;
    });
  } catch {
    return false; // fail-open
  }
}
