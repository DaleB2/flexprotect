import { sha1HexUpper } from "./crypto";
import { HIBP_API_KEY, HIBP_USER_AGENT } from "./config";
import { supabase } from "./supabase";

const USER_AGENT = HIBP_USER_AGENT || "FlexProtect/1.0";
const PASSWORD_ENDPOINT = "https://api.pwnedpasswords.com/range/";
const EMAIL_ENDPOINT = "https://haveibeenpwned.com/api/v3/breachedaccount/";
const MIN_DELAY_MS = 150;
let lastRequestAt = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function pwnedPasswordCount(password: string): Promise<number> {
  if (!password) return 0;
  const hash = sha1HexUpper(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    await throttle();
    const res = await fetch(`${PASSWORD_ENDPOINT}${prefix}`, {
      headers: { "user-agent": USER_AGENT },
    });
    if (!res.ok) {
      console.warn("pwnedPasswordCount: HIBP request failed", res.status, res.statusText);
      return 0;
    }
    const body = await res.text();
    const lines = body.split(/\r?\n/);
    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix?.toUpperCase() === suffix) {
        const count = parseInt(countStr ?? "0", 10);
        return Number.isFinite(count) ? count : 0;
      }
    }
  } catch (error) {
    console.warn("pwnedPasswordCount error", error);
  }
  return 0;
}

type LookupResult = { breaches: any[]; needsKey?: boolean };

export async function lookupBreachesForEmail(email: string): Promise<LookupResult> {
  if (!email) return { breaches: [] };

  if (!HIBP_API_KEY) {
    const { data } = await supabase
      .from("hibp_email_cache")
      .select("last_result, checked_at")
      .eq("email", email)
      .maybeSingle();
    const checkedAt = data?.checked_at ? new Date(data.checked_at) : null;
    const stale = !checkedAt || Date.now() - checkedAt.getTime() > 1000 * 60 * 60 * 24 * 7;
    if (!data || stale) {
      return { breaches: [], needsKey: true };
    }
    const cached = Array.isArray((data.last_result as any)?.breaches)
      ? (data.last_result as any).breaches
      : Array.isArray(data.last_result)
        ? data.last_result
        : [];
    return { breaches: cached, needsKey: true };
  }

  try {
    await throttle();
    const res = await fetch(`${EMAIL_ENDPOINT}${encodeURIComponent(email)}?truncateResponse=false`, {
      headers: {
        "user-agent": USER_AGENT,
        "hibp-api-key": HIBP_API_KEY,
        accept: "application/json",
      },
    });

    if (res.status === 404) {
      await supabase.from("hibp_email_cache").upsert({
        email,
        last_result: { breaches: [] },
        checked_at: new Date().toISOString(),
      });
      return { breaches: [] };
    }

    if (!res.ok) {
      console.warn("lookupBreachesForEmail failed", res.status, res.statusText);
      if (res.status === 401 || res.status === 403) {
        return { breaches: [], needsKey: true };
      }
      return { breaches: [] };
    }

    const breaches = await res.json();
    await supabase.from("hibp_email_cache").upsert({
      email,
      last_result: { breaches },
      checked_at: new Date().toISOString(),
    });
    return { breaches };
  } catch (error) {
    console.warn("lookupBreachesForEmail error", error);
    return { breaches: [] };
  }
}
