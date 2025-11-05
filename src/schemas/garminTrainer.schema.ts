import { z } from "zod";

import { GarminWorkoutSchema } from "./garminWorkout.schema";

export const workoutSchema = GarminWorkoutSchema;

export type GarminTrainerWorkout = z.infer<typeof GarminWorkoutSchema>;
