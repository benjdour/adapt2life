import { z } from "zod";

import { GarminWorkoutSchema } from "./garminWorkout.schema";

export const WorkoutSchema = GarminWorkoutSchema;

export type Workout = z.infer<typeof GarminWorkoutSchema>;
