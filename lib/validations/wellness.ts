import { z } from "zod";

export const wellnessEntrySchema = z.object({
  mood: z.number().int().min(1).max(5).nullable(),
  sleepHours: z
    .number({ invalid_type_error: "Please enter a number of hours." })
    .min(0, "Hours can't be negative.")
    .max(24, "There are only 24 hours in a day!")
    .nullable(),
  energy: z.number().int().min(1).max(5).nullable(),
  notes: z.string().max(1000, "That note is a bit long.").optional().or(z.literal("")),
});

export type WellnessEntryValues = z.infer<typeof wellnessEntrySchema>;
