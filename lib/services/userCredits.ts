import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getUserPlanConfig, DEFAULT_USER_PLAN, type UserPlanId, isUserPlanId } from "@/lib/constants/userPlans";

export type CreditReservationResult = {
  remaining: number;
};

const incrementTrainingUsage = async (userId: number) => {
  await db
    .update(users)
    .set({
      trainingGenerationsUsedMonth: sql`${users.trainingGenerationsUsedMonth} + 1`,
    })
    .where(eq(users.id, userId));
};

const decrementTrainingUsage = async (userId: number) => {
  await db
    .update(users)
    .set({
      trainingGenerationsUsedMonth: sql`GREATEST(${users.trainingGenerationsUsedMonth} - 1, 0)`,
    })
    .where(eq(users.id, userId));
};

const incrementConversionUsage = async (userId: number) => {
  await db
    .update(users)
    .set({
      garminConversionsUsedMonth: sql`${users.garminConversionsUsedMonth} + 1`,
    })
    .where(eq(users.id, userId));
};

const decrementConversionUsage = async (userId: number) => {
  await db
    .update(users)
    .set({
      garminConversionsUsedMonth: sql`GREATEST(${users.garminConversionsUsedMonth} - 1, 0)`,
    })
    .where(eq(users.id, userId));
};

const fetchUserPlan = async (userId: number) => {
  const [record] = await db
    .select({ planType: users.planType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const storedPlan = record?.planType;
  if (isUserPlanId(storedPlan)) {
    return storedPlan;
  }
  return DEFAULT_USER_PLAN;
};

export const reserveTrainingGenerationCredit = async (userId: number): Promise<CreditReservationResult | null> => {
  const planType = await fetchUserPlan(userId);
  const plan = getUserPlanConfig(planType);
  if (plan.trainingQuota === null) {
    await incrementTrainingUsage(userId);
    return { remaining: Number.MAX_SAFE_INTEGER };
  }

  const [result] = await db
    .update(users)
    .set({
      trainingGenerationsRemaining: sql`${users.trainingGenerationsRemaining} - 1`,
      trainingGenerationsUsedMonth: sql`${users.trainingGenerationsUsedMonth} + 1`,
    })
    .where(and(eq(users.id, userId), gt(users.trainingGenerationsRemaining, 0)))
    .returning({ remaining: users.trainingGenerationsRemaining });

  return result ?? null;
};

export const refundTrainingGenerationCredit = async (userId: number) => {
  const planType = await fetchUserPlan(userId);
  const plan = getUserPlanConfig(planType);
  if (plan.trainingQuota === null) {
    await decrementTrainingUsage(userId);
    return;
  }

  await db
    .update(users)
    .set({
      trainingGenerationsRemaining: sql`${users.trainingGenerationsRemaining} + 1`,
      trainingGenerationsUsedMonth: sql`GREATEST(${users.trainingGenerationsUsedMonth} - 1, 0)`,
    })
    .where(eq(users.id, userId));
};

export const reserveGarminConversionCredit = async (userId: number): Promise<CreditReservationResult | null> => {
  const planType = await fetchUserPlan(userId);
  const plan = getUserPlanConfig(planType);
  if (plan.conversionQuota === null) {
    await incrementConversionUsage(userId);
    return { remaining: Number.MAX_SAFE_INTEGER };
  }

  const [result] = await db
    .update(users)
    .set({
      garminConversionsRemaining: sql`${users.garminConversionsRemaining} - 1`,
      garminConversionsUsedMonth: sql`${users.garminConversionsUsedMonth} + 1`,
    })
    .where(and(eq(users.id, userId), gt(users.garminConversionsRemaining, 0)))
    .returning({ remaining: users.garminConversionsRemaining });

  return result ?? null;
};

export const refundGarminConversionCredit = async (userId: number) => {
  const planType = await fetchUserPlan(userId);
  const plan = getUserPlanConfig(planType);
  if (plan.conversionQuota === null) {
    await decrementConversionUsage(userId);
    return;
  }

  await db
    .update(users)
    .set({
      garminConversionsRemaining: sql`${users.garminConversionsRemaining} + 1`,
      garminConversionsUsedMonth: sql`GREATEST(${users.garminConversionsUsedMonth} - 1, 0)`,
    })
    .where(eq(users.id, userId));
};

export const getUserCreditSnapshot = async (userId: number) => {
  const [record] = await db
    .select({
      trainingGenerationsRemaining: users.trainingGenerationsRemaining,
      garminConversionsRemaining: users.garminConversionsRemaining,
      planType: users.planType,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return record ?? null;
};

export const applyUserPlan = async (userId: number, planId: UserPlanId) => {
  const plan = getUserPlanConfig(planId);
  const updateValues: Partial<typeof users.$inferInsert> = {
    planType: plan.id,
    trainingGenerationsUsedMonth: 0,
    garminConversionsUsedMonth: 0,
  };
  if (plan.trainingQuota !== null) {
    updateValues.trainingGenerationsRemaining = plan.trainingQuota;
  }
  if (plan.conversionQuota !== null) {
    updateValues.garminConversionsRemaining = plan.conversionQuota;
  }
  await db.update(users).set(updateValues).where(eq(users.id, userId));
};

export const resetMonthlyQuotas = async () => {
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const targets = await db
    .select({ id: users.id, planType: users.planType, planDowngradeAt: users.planDowngradeAt })
    .from(users)
    .where(or(isNull(users.lastQuotaResetAt), lt(users.lastQuotaResetAt, currentMonthStart)));

  let updated = 0;

  for (const target of targets) {
    const planDowngradeDate =
      target.planDowngradeAt instanceof Date ? target.planDowngradeAt : target.planDowngradeAt ? new Date(target.planDowngradeAt) : null;

    if (planDowngradeDate && now >= planDowngradeDate) {
      const starterPlan = getUserPlanConfig(DEFAULT_USER_PLAN);
      await db
        .update(users)
        .set({
          lastQuotaResetAt: now,
          planDowngradeAt: null,
          planType: DEFAULT_USER_PLAN,
          stripePlanId: null,
          stripeSubscriptionId: null,
          trainingGenerationsRemaining: starterPlan.trainingQuota ?? 0,
          garminConversionsRemaining: starterPlan.conversionQuota ?? 0,
          trainingGenerationsUsedMonth: 0,
          garminConversionsUsedMonth: 0,
        })
        .where(eq(users.id, target.id));
      updated += 1;
      continue;
    }

    const planType = isUserPlanId(target.planType) ? target.planType : DEFAULT_USER_PLAN;
    const plan = getUserPlanConfig(planType);
    const updateValues: Partial<typeof users.$inferInsert> = {
      lastQuotaResetAt: now,
      trainingGenerationsUsedMonth: 0,
      garminConversionsUsedMonth: 0,
    };

    if (plan.id === DEFAULT_USER_PLAN) {
      await db.update(users).set(updateValues).where(eq(users.id, target.id));
      continue;
    }

    if (plan.trainingQuota !== null) {
      updateValues.trainingGenerationsRemaining = plan.trainingQuota;
    }
    if (plan.conversionQuota !== null) {
      updateValues.garminConversionsRemaining = plan.conversionQuota;
    }

    await db.update(users).set(updateValues).where(eq(users.id, target.id));
    updated += 1;
  }

  return { processed: targets.length, updated };
};
