// Free email breach lookups using XposedOrNot public API.
// Docs: https://api.xposedornot.com
// Endpoint returns a list of breaches for an email if exposed.

export type BreachItem = {
  title: string;
  domain?: string;
  breach_date?: string;
  [k: string]: any;
};

export async function fetchBreachesForEmail(email: string): Promise<BreachItem[]> {
  // XON offers a couple of endpoints; we’ll use "breach-xxxxx" which gives details
  const url = `https://api.xposedornot.com/v1/breach-xxxxx?email=${encodeURIComponent(email)}`;

  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) {
    // if API rate-limits or returns an error, treat as zero results instead of failing the app
    return [];
  }
  const json = await res.json();
  // The shape includes "breaches" array when found
  const breaches = json?.Breaches || json?.breaches || json?.records || [];
  return (Array.isArray(breaches) ? breaches : []).map((b: any) => ({
    title: b?.Name || b?.Title || b?.breach || "Unknown Breach",
    domain: b?.Domain || b?.Site || null,
    breach_date: b?.BreachDate || b?.breach_date || null,
    ...b
  }));
}
