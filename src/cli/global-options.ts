import { z } from "zod";

/**
 * Stable global options defined by Milestone 0.
 * Unknown properties are intentionally ignored so command-local options can be
 * validated independently by their own schemas in later milestones.
 */
export const globalCliOptionsSchema = z.object({
  output: z.string().min(1).optional(),
  overwrite: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  json: z.boolean().default(false),
  quiet: z.boolean().default(false),
  verbose: z.boolean().default(false),
  progress: z.boolean().default(true),
  ffmpegPath: z.string().min(1).optional(),
  ffprobePath: z.string().min(1).optional(),
  keepTemp: z.boolean().default(false),
});

export type GlobalCliOptions = z.infer<typeof globalCliOptionsSchema>;

export function validateGlobalCliOptions(value: unknown): GlobalCliOptions {
  return globalCliOptionsSchema.parse(value);
}
