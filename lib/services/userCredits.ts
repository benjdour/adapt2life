import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

export type CreditReservationResult = {
  remaining: number;
};

const incrementTrainingGenerations = async (userId: number, delta: number) => {
  await db
    .update(users)
    .set({
      trainingGenerationsRemaining: sql`${users.trainingGenerationsRemaining} + ${delta}`,
    })
    .where(eq(users.id, userId));
};

const incrementGarminConversions = async (userId: number, delta: number) => {
  await db
    .update(users)
    .set({
      garminConversionsRemaining: sql`${users.garminConversionsRemaining} + ${delta}`,
    })
    .where(eq(users.id, userId));
};

export const reserveTrainingGenerationCredit = async (userId: number): Promise<CreditReservationResult | null> => {
  const [result] = await db
    .update(users)
    .set({
      trainingGenerationsRemaining: sql`${users.trainingGenerationsRemaining} - 1`,
    })
    .where(and(eq(users.id, userId), gt(users.trainingGenerationsRemaining, 0)))
    .returning({ remaining: users.trainingGenerationsRemaining });

  return result ?? null;
};

export const refundTrainingGenerationCredit = async (userId: number) => {
  await incrementTrainingGenerations(userId, 1);
};

export const reserveGarminConversionCredit = async (userId: number): Promise<CreditReservationResult | null> => {
  const [result] = await db
    .update(users)
    .set({
      garminConversionsRemaining: sql`${users.garminConversionsRemaining} - 1`,
    })
    .where(and(eq(users.id, userId), gt(users.garminConversionsRemaining, 0)))
    .returning({ remaining: users.garminConversionsRemaining });

  return result ?? null;
};

export const refundGarminConversionCredit = async (userId: number) => {
  await incrementGarminConversions(userId, 1);
};

export const getUserCreditSnapshot = async (userId: number) => {
  const [record] = await db
    .select({
      trainingGenerationsRemaining: users.trainingGenerationsRemaining,
      garminConversionsRemaining: users.garminConversionsRemaining,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return record ?? null;
};
