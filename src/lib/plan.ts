import { supabase } from "./supabase";

export type Plan = "free" | "flexpass";

export async function getPlan(userId: string): Promise<Plan> {
  if (!userId) return "free";
  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("getPlan error", error.message);
    return "free";
  }
  return (data?.plan as Plan) ?? "free";
}

export function canAddMonitoredEmail(plan: Plan, currentCount: number): boolean {
  if (plan === "flexpass") return true;
  return currentCount < 1;
}
