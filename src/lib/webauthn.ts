// WebAuthn utilities for passkey authentication

const RP_NAME = "DiamoNY Admin";

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Convert base64url string to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random challenge
function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === "function"
  );
}

// Check if platform authenticator is available (Face ID, Touch ID, Windows Hello)
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Register a new passkey
export async function registerPasskey(
  userId: string,
  userEmail: string
): Promise<{ credentialId: string; publicKey: string } | null> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser");
  }

  const challenge = generateChallenge();
  const rpId = window.location.hostname;

const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rp: {
      name: RP_NAME,
      id: rpId,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userEmail,
      displayName: userEmail.split("@")[0],
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },   // ES256
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    timeout: 60000,
    attestation: "none",
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) return null;

    const response = credential.response as AuthenticatorAttestationResponse;
    
    return {
      credentialId: bufferToBase64url(credential.rawId),
      publicKey: bufferToBase64url(response.getPublicKey()!),
    };
  } catch (error) {
    console.error("Error registering passkey:", error);
    throw error;
  }
}

// Authenticate with passkey
export async function authenticateWithPasskey(
  credentialIds: string[]
): Promise<{ credentialId: string; signature: string } | null> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser");
  }

  const challenge = generateChallenge();
  const rpId = window.location.hostname;

const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rpId,
    allowCredentials: credentialIds.map((id) => ({
      id: base64urlToBuffer(id),
      type: "public-key",
      transports: ["internal"],
    })),
    userVerification: "required",
    timeout: 60000,
  };

  try {
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!credential) return null;

    const response = credential.response as AuthenticatorAssertionResponse;

    return {
      credentialId: bufferToBase64url(credential.rawId),
      signature: bufferToBase64url(response.signature),
    };
  } catch (error) {
    console.error("Error authenticating with passkey:", error);
    throw error;
  }
}
