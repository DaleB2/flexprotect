import { supabase } from "./supabase";
import { canAddMonitoredEmail, getPlan, Plan } from "./plan";
import { lookupBreachesForEmail, pwnedPasswordCount } from "./hibp";

type BreachItem = {
  id: string;
  title: string;
  domain?: string | null;
  breach_date?: string | null;
  status?: string | null;
  severity?: string | null;
  monitored_email_id?: string | null;
  raw?: any;
};

type AlertItem = {
  id: string;
  title: string;
  status?: string;
  created_at?: string;
  [k: string]: any;
};

type MonitoredEmail = { id: string; email: string };

type Stats = {
  monitoredEmails: number;
  totalBreaches: number;
  unresolvedBreaches: number;
  resolvedBreaches: number;
};

class LimitReachedError extends Error {
  code: "LIMIT_REACHED" = "LIMIT_REACHED";
  constructor(message = "Free plan limit reached") {
    super(message);
    this.name = "LimitReachedError";
  }
}

async function fetchPlan(userId: string): Promise<Plan> {
  return getPlan(userId);
}

async function fetchStats(userId: string): Promise<Stats> {
  if (!userId) {
    return { monitoredEmails: 0, totalBreaches: 0, unresolvedBreaches: 0, resolvedBreaches: 0 };
  }
  const [breaches, monitored] = await Promise.all([fetchBreaches(userId), getMonitoredEmails(userId)]);
  const resolved = breaches.filter((b) => (b.status ?? "open").toLowerCase() === "resolved").length;
  const unresolved = breaches.length - resolved;
  return {
    monitoredEmails: monitored.length,
    totalBreaches: breaches.length,
    unresolvedBreaches: Math.max(0, unresolved),
    resolvedBreaches: Math.max(0, resolved),
  };
}

async function fetchBreaches(userId: string): Promise<BreachItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("breaches")
    .select("id, breach_title, breach_date, resolved, severity, monitored_email_id, email, source, details")
    .eq("user_id", userId)
    .order("breach_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("fetchBreaches error", error.message);
    return [];
  }
  return (data ?? []).map((row: any) => {
    const details = row.details ?? {};
    const title = row.breach_title ?? details.Title ?? details.Name ?? row.source ?? "Unknown breach";
    const domain = details.Domain ?? details.Website ?? details.Site ?? row.source ?? null;
    const breachDate = row.breach_date ?? details.BreachDate ?? details.AddedDate ?? null;
    const status = row.resolved ? "resolved" : "open";
    return {
      id: row.id,
      title,
      domain,
      breach_date: breachDate,
      status,
      severity: row.severity ?? (details.IsVerified ? "high" : null),
      monitored_email_id: row.monitored_email_id ?? null,
      raw: row.details ?? null,
    };
  });
}

async function fetchAlerts(userId: string): Promise<AlertItem[]> {
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

async function markBreachResolved(breachId: string): Promise<void> {
  if (!breachId) return;
  const { error } = await supabase
    .from("breaches")
    .update({ resolved: true })
    .eq("id", breachId);
  if (error) {
    console.warn("markBreachResolved error", error.message);
  }
}

async function getMonitoredEmails(userId: string): Promise<MonitoredEmail[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("monitored_emails")
    .select("id, email, is_active")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("getMonitoredEmails error", error.message);
    return [];
  }
  return (data ?? [])
    .filter((row: any) => row.is_active !== false)
    .map((row: any) => ({ id: row.id, email: row.email }));
}

async function setMonitoredEmail(
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
    { user_id: userId, email: normalized, is_active: true },
    { onConflict: "user_id,email" }
  );

  if (error) {
    console.warn("setMonitoredEmail error", error.message);
    throw error;
  }
}

async function scanEmail(userId: string): Promise<{ breaches: any[]; needsKey?: boolean }> {
  if (!userId) return { breaches: [] };
  const emails = await getMonitoredEmails(userId);
  if (!emails.length) {
    return { breaches: [] };
  }

  const primary = emails[0];
  const lookup = await lookupBreachesForEmail(primary.email);
  const breachList = Array.isArray(lookup.breaches) ? lookup.breaches : [];

  if (breachList.length) {
    try {
      const rows = breachList.map((breach: any) => {
        const breachTitle = breach.Title ?? breach.Name ?? "Unknown Breach";
        const breachDate = breach.BreachDate ?? breach.AddedDate ?? null;
        const severity = breach.IsSensitive || breach.IsVerified ? "high" : "medium";
        const isCritical = Boolean(breach.IsSensitive || breach.DataClasses?.includes("Passwords"));
        return {
          user_id: userId,
          monitored_email_id: primary.id,
          email: primary.email,
          breach_title: breachTitle,
          breach_date: breachDate,
          details: breach,
          source: breach.Domain ?? breach.Name ?? "Have I Been Pwned",
          severity,
          critical: isCritical,
          resolved: false,
        };
      });
      const { error } = await supabase
        .from("breaches")
        .upsert(rows, { onConflict: "user_id,email,breach_title" });
      if (error) {
        console.warn("scanEmail: failed to persist breaches", error.message);
      }
    } catch (error) {
      console.warn("scanEmail: failed to persist breaches", error);
    }
  }

  await supabase
    .from("monitored_emails")
    .update({ last_checked: new Date().toISOString(), is_active: true })
    .eq("id", primary.id);

  return { ...lookup, breaches: breachList };
}

async function scanPassword(password: string): Promise<{ count: number }> {
  const count = await pwnedPasswordCount(password);
  return { count };
}

export {
  LimitReachedError,
  fetchStats,
  fetchBreaches,
  fetchAlerts,
  markBreachResolved,
  getMonitoredEmails,
  setMonitoredEmail,
  scanEmail,
  scanPassword,
};

export type { BreachItem, AlertItem, MonitoredEmail, Stats };
