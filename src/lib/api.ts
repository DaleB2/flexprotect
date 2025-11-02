import { supabase } from "./supabase";
import { canAddMonitoredEmail, getPlan, Plan } from "./plan";
import { lookupBreachesForEmail, pwnedPasswordCount } from "./hibp";

export type BreachItem = {
  id: string;
  title: string;
  domain?: string | null;
  breach_date?: string | null;
  status?: string | null;
  severity?: string | null;
  monitored_email_id?: string | null;
  raw?: any;
};

export type AlertItem = {
  id: string;
  title: string;
  status?: string;
  created_at?: string;
  [k: string]: any;
};

export type MonitoredEmail = { id: string; email: string };

export type Stats = {
  monitoredEmails: number;
  totalBreaches: number;
  unresolvedBreaches: number;
  resolvedBreaches: number;
};

export class LimitReachedError extends Error {
  code: "LIMIT_REACHED" = "LIMIT_REACHED";
  constructor(message = "Free plan limit reached") {
    super(message);
    this.name = "LimitReachedError";
  }
}

async function fetchPlan(userId: string): Promise<Plan> {
  return getPlan(userId);
}

export async function fetchStats(userId: string): Promise<Stats> {
  const breaches = await fetchBreaches(userId);
  const monitored = await getMonitoredEmails(userId);
  const resolved = breaches.filter((b) => (b.status ?? "open").toLowerCase() === "resolved").length;
  const unresolved = breaches.length - resolved;
  return {
    monitoredEmails: monitored.length,
    totalBreaches: breaches.length,
    unresolvedBreaches: Math.max(0, unresolved),
    resolvedBreaches: Math.max(0, resolved),
  };
}

export async function fetchBreaches(userId: string): Promise<BreachItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("breaches")
    .select("id,title,domain,breach_date,status,severity,monitored_email_id,raw")
    .eq("user_id", userId)
    .order("breach_date", { ascending: false });
  if (error) {
    console.warn("fetchBreaches error", error.message);
    return [];
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title ?? row.name ?? "Unknown breach",
    domain: row.domain ?? row.site ?? null,
    breach_date: row.breach_date ?? row.detected_at ?? null,
    status: row.status ?? null,
    severity: row.severity ?? null,
    monitored_email_id: row.monitored_email_id ?? null,
    raw: row.raw ?? null,
  }));
}

export async function fetchAlerts(userId: string): Promise<AlertItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("fetchAlerts error", error.message);
    return [];
  }
  return data ?? [];
}

export async function markBreachResolved(breachId: string): Promise<void> {
  if (!breachId) return;
  const { error } = await supabase
    .from("breaches")
    .update({ status: "resolved" })
    .eq("id", breachId);
  if (error) {
    console.warn("markBreachResolved error", error.message);
  }
}

export async function getMonitoredEmails(userId: string): Promise<MonitoredEmail[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("monitored_emails")
    .select("id,email")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("getMonitoredEmails error", error.message);
    return [];
  }
  return data ?? [];
}

export async function setMonitoredEmail(
  userId: string,
  email: string,
  options?: { replaceExisting?: boolean }
): Promise<void> {
  if (!userId || !email) return;
  const normalized = email.trim().toLowerCase();
  const plan = await fetchPlan(userId);
  const existing = await getMonitoredEmails(userId);
  const hasEmail = existing.length > 0;

  if (!canAddMonitoredEmail(plan, existing.length) && !options?.replaceExisting) {
    throw new LimitReachedError();
  }

  if (plan === "free" && hasEmail) {
    await supabase.from("monitored_emails").delete().eq("user_id", userId);
  }

  const { error } = await supabase.from("monitored_emails").upsert(
    { user_id: userId, email: normalized },
    { onConflict: "user_id,email" }
  );

  if (error) {
    console.warn("setMonitoredEmail error", error.message);
    throw error;
  }
}

export async function scanEmail(userId: string): Promise<{ breaches: any[]; needsKey?: boolean }> {
  if (!userId) return { breaches: [] };
  const emails = await getMonitoredEmails(userId);
  if (!emails.length) {
    return { breaches: [] };
  }

  const primary = emails[0];
  const lookup = await lookupBreachesForEmail(primary.email);

  if (lookup.breaches?.length) {
    try {
      const rows = lookup.breaches.map((breach: any) => ({
        user_id: userId,
        monitored_email_id: primary.id,
        title: breach.Title ?? breach.Name ?? breach.Name ?? "Unknown Breach",
        domain: breach.Domain ?? breach.Website ?? null,
        breach_date: breach.BreachDate ?? breach.AddedDate ?? null,
        severity: breach.IsVerified ? "high" : "medium",
        status: "open",
        raw: breach,
      }));
      await supabase.from("breaches").upsert(rows, { ignoreDuplicates: true });
    } catch (error) {
      console.warn("scanEmail: failed to persist breaches", error);
    }
  }

  return lookup;
}

export async function scanPassword(password: string): Promise<{ count: number }> {
  const count = await pwnedPasswordCount(password);
  return { count };
}
