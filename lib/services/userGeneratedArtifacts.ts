import { db } from "@/db";
import { userGeneratedArtifacts } from "@/db/schema";

export const saveTrainingPlanForUser = async (userId: number, planMarkdown: string | null) => {
  await db
    .insert(userGeneratedArtifacts)
    .values({
      userId,
      trainingPlanMarkdown: planMarkdown,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userGeneratedArtifacts.userId,
      set: {
        trainingPlanMarkdown: planMarkdown,
        updatedAt: new Date(),
      },
    });
};

export const saveGarminWorkoutForUser = async (
  userId: number,
  workout: Record<string, unknown> | null,
) => {
  await db
    .insert(userGeneratedArtifacts)
    .values({
      userId,
      garminWorkoutJson: workout,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userGeneratedArtifacts.userId,
      set: {
        garminWorkoutJson: workout,
        updatedAt: new Date(),
      },
    });
};
