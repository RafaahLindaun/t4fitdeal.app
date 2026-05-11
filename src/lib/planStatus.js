import { supabase } from "./supabase";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function isUsableSubscription(row) {
  if (!row) return false;

  const status = normalize(row.status);

  if (status !== "active" && status !== "trialing") {
    return false;
  }

  // No seu app: cancelou = remove feature imediatamente
  if (row.cancel_at_period_end === true) {
    return false;
  }

  if (row.canceled_at) {
    return false;
  }

  if (row.current_period_end) {
    const end = new Date(row.current_period_end).getTime();
    const now = Date.now();

    if (Number.isFinite(end) && end < now) {
      return false;
    }
  }

  return true;
}

function isNutriPlan(row) {
  const planKey = normalize(row?.plan_key);
  const plan = normalize(row?.plan);
  const planType = normalize(row?.plan_type);

  return (
    planKey === "nutri" ||
    planKey === "nutri_plus" ||
    planKey === "nutriplus" ||
    plan.includes("nutri") ||
    planType.includes("nutri")
  );
}

function isBasicPlan(row) {
  const planKey = normalize(row?.plan_key);
  const plan = normalize(row?.plan);
  const planType = normalize(row?.plan_type);

  return (
    planKey === "basico" ||
    planKey === "basic" ||
    plan.includes("basico") ||
    plan.includes("basic") ||
    planType.includes("basico") ||
    planType.includes("basic")
  );
}

export async function loadUserPlanStatus(userId) {
  if (!userId) {
    return {
      planKey: "free",
      paid: false,
      hasNutriPlus: false,
      canUseBasic: false,
      canUseNutri: false,
      subscription: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(
        "id, status, plan_key, plan, plan_type, current_period_end, cancel_at_period_end, canceled_at, updated_at, created_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("loadUserPlanStatus error:", error);

      return {
        planKey: "free",
        paid: false,
        hasNutriPlus: false,
        canUseBasic: false,
        canUseNutri: false,
        subscription: null,
      };
    }

    const rows = Array.isArray(data) ? data : [];
    const activeRows = rows.filter(isUsableSubscription);

    const nutriRow = activeRows.find(isNutriPlan);

    if (nutriRow) {
      return {
        planKey: "nutri",
        paid: true,
        hasNutriPlus: true,
        canUseBasic: true,
        canUseNutri: true,
        subscription: nutriRow,
      };
    }

    const basicRow = activeRows.find(isBasicPlan);

    if (basicRow) {
      return {
        planKey: "basico",
        paid: true,
        hasNutriPlus: false,
        canUseBasic: true,
        canUseNutri: false,
        subscription: basicRow,
      };
    }

    return {
      planKey: "free",
      paid: false,
      hasNutriPlus: false,
      canUseBasic: false,
      canUseNutri: false,
      subscription: null,
    };
  } catch (err) {
    console.error("loadUserPlanStatus catch:", err);

    return {
      planKey: "free",
      paid: false,
      hasNutriPlus: false,
      canUseBasic: false,
      canUseNutri: false,
      subscription: null,
    };
  }
}
