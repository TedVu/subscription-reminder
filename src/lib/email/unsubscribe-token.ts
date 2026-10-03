// Signed, login-free unsubscribe links (design decision 7). Uses Web Crypto,
// available in Deno (Edge Functions) and Node.

function base64url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(`unsubscribe:${message}`)));
}

export function signUnsubscribeToken(userId: string, secret: string): Promise<string> {
  return hmac(secret, userId);
}

/** Constant-time comparison so tokens can't be guessed byte by byte. */
export async function verifyUnsubscribeToken(userId: string, token: string, secret: string): Promise<boolean> {
  const expected = await hmac(secret, userId);
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

export async function unsubscribeUrl(functionsBaseUrl: string, userId: string, secret: string): Promise<string> {
  const token = await signUnsubscribeToken(userId, secret);
  return `${functionsBaseUrl}/unsubscribe?u=${encodeURIComponent(userId)}&t=${encodeURIComponent(token)}`;
}
