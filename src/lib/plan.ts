import { supabase } from "./supabase";

export type Plan = "free" | "flexpass";

export async function getPlan(userId: string): Promise<Plan> {
  if (!userId) return "free";

  const { data, error } = await supabase
    .from("profiles")
    .select("id, plan")
    .eq("id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.warn("getPlan error", error.message);
  }

  if (!data) {
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: userId, plan: "free" }, { onConflict: "id" });
    if (upsertError) {
      console.warn("getPlan upsert error", upsertError.message);
    }
    return "free";
  }

  const plan = (data.plan as Plan | null) ?? "free";
  if (!data.plan) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan: "free" })
      .eq("id", userId);
    if (updateError) {
      console.warn("getPlan update error", updateError.message);
    }
  }

  return plan;
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
