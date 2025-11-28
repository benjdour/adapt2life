const PLAN_IDS = ["free", "full", "paid", "paid_unlimited"] as const;
export type UserPlanId = (typeof PLAN_IDS)[number];

export type UserPlanConfig = {
  id: UserPlanId;
  label: string;
  description: string;
  trainingQuota: number | null;
  conversionQuota: number | null;
};

export const DEFAULT_USER_PLAN: UserPlanId = "free";

export const USER_PLAN_CATALOG: Record<UserPlanId, UserPlanConfig> = {
  free: {
    id: "free",
    label: "Free",
    description: "10 générations + 5 conversions offertes.",
    trainingQuota: 10,
    conversionQuota: 5,
  },
  full: {
    id: "full",
    label: "Full (illimité)",
    description: "Accès illimité à la génération et à la conversion.",
    trainingQuota: null,
    conversionQuota: null,
  },
  paid: {
    id: "paid",
    label: "Paid",
    description: "70 générations + 35 conversions.",
    trainingQuota: 70,
    conversionQuota: 35,
  },
  paid_unlimited: {
    id: "paid_unlimited",
    label: "Paid Unlimited",
    description: "300 générations + 100 conversions.",
    trainingQuota: 300,
    conversionQuota: 100,
  },
};

export const getUserPlanConfig = (planType?: string | null): UserPlanConfig => {
  if (!planType) {
    return USER_PLAN_CATALOG[DEFAULT_USER_PLAN];
  }
  if (planType in USER_PLAN_CATALOG) {
    return USER_PLAN_CATALOG[planType as UserPlanId];
  }
  return USER_PLAN_CATALOG[DEFAULT_USER_PLAN];
};

export const USER_PLAN_OPTIONS: Array<{ id: UserPlanId; label: string; description: string }> = Object.values(
  USER_PLAN_CATALOG,
).map(({ id, label, description }) => ({ id, label, description }));

export const USER_PLAN_IDS = PLAN_IDS;

export const isUserPlanId = (value: string | null | undefined): value is UserPlanId => {
  if (!value) {
    return false;
  }
  return USER_PLAN_IDS.includes(value as UserPlanId);
};
