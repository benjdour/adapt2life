import { z } from "zod";

import { GarminWorkoutSchema } from "@/schemas/garminWorkout.schema";

export const WorkoutSchema = GarminWorkoutSchema;

export type Workout = z.infer<typeof GarminWorkoutSchema>;
