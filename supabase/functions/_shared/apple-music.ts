import * as jose from "jose";

const KEY_ID = Deno.env.get("APPLE_MUSIC_KEY_ID")!;
const TEAM_ID = Deno.env.get("APPLE_MUSIC_TEAM_ID")!;
const PRIVATE_KEY_B64 = Deno.env.get("APPLE_MUSIC_PRIVATE_KEY")!;

// Apple's maximum token lifetime: 6 months
const TOKEN_TTL = 15_777_000;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export function clearAppleMusicTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

export async function getAppleMusicToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  const privateKey = await jose.importPKCS8(atob(PRIVATE_KEY_B64), "ES256");
  const exp = now + TOKEN_TTL;

  cachedToken = await new jose.SignJWT({ iss: TEAM_ID, iat: now, exp })
    .setProtectedHeader({ alg: "ES256", kid: KEY_ID })
    .sign(privateKey);
  tokenExpiresAt = exp;

  return cachedToken;
}
