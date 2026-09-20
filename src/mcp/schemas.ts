import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const positive = z.number().finite().positive();
const nonNegative = z.number().finite().min(0);
const positiveInteger = z.number().int().positive();

export const mcpHardwareShape = {
  hardware: z.enum(["software", "auto", "nvenc", "qsv", "vaapi", "videotoolbox"]).default("software"),
  hardware_device: nonEmpty.optional(),
  hardware_strict: z.boolean().default(false),
} as const;

export const mcpRuntimeShape = {
  output: nonEmpty.optional(),
  overwrite: z.boolean().default(false),
  dry_run: z.boolean().default(false),
  verbose: z.boolean().default(false),
  ffmpeg_path: nonEmpty.optional(),
  ffprobe_path: nonEmpty.optional(),
  cwd: nonEmpty.optional(),
  keep_temp: z.boolean().default(false),
} as const;

export const mediaProbeInputSchema = z.object({
  input: nonEmpty,
  dry_run: z.boolean().default(false),
  verbose: z.boolean().default(false),
  ffprobe_path: nonEmpty.optional(),
  cwd: nonEmpty.optional(),
}).strict();

export const mediaTrimInputSchema = z.object({
  input: nonEmpty,
  start: nonNegative.default(0),
  end: positive.optional(),
  duration: positive.optional(),
  mode: z.enum(["auto", "copy", "accurate"]).default("auto"),
  ...mcpRuntimeShape,
}).strict().superRefine((value, ctx) => {
  const count = Number(value.end !== undefined) + Number(value.duration !== undefined);
  if (count !== 1) {
    ctx.addIssue({
      code: "custom",
      message: "Exactly one of end or duration is required.",
      path: ["end"],
    });
  }
  if (value.end !== undefined && value.end <= value.start) {
    ctx.addIssue({
      code: "custom",
      message: "end must be greater than start.",
      path: ["end"],
    });
  }
});

export const mediaConvertInputSchema = z.object({
  input: nonEmpty,
  from: z.enum(["mp4", "webm", "gif", "webp", "png", "jpeg", "wav", "mp3", "aac", "m4a", "flac", "opus", "ogg"]).optional(),
  to: z.enum(["mp4", "webm", "gif", "webp", "png", "jpeg", "wav", "mp3", "aac", "m4a", "flac", "opus", "ogg"]),
  fps: positive.optional(),
  width: positiveInteger.optional(),
  height: positiveInteger.optional(),
  fit: z.enum(["contain", "cover", "stretch"]).optional(),
  background: nonEmpty.optional(),
  quality: z.number().finite().optional(),
  max_colors: z.number().int().min(2).max(256).optional(),
  loop: z.number().int().min(0).optional(),
  audio_bitrate: nonEmpty.optional(),
  sample_rate: positiveInteger.optional(),
  channels: positiveInteger.optional(),
  ...mcpHardwareShape,
  ...mcpRuntimeShape,
}).strict();

export const mediaConcatInputSchema = z.object({
  inputs: z.array(nonEmpty).min(2),
  transition: z.enum([
    "none", "fade", "fadeblack", "fadewhite", "wipeleft", "wiperight",
    "slideup", "slidedown", "circleopen", "circleclose", "dissolve",
    "pixelize", "distance", "zoomin", "zoomout",
  ]).default("none"),
  transition_duration: positive.default(1),
  audio: z.enum(["auto", "preserve", "drop"]).default("auto"),
  width: positiveInteger.optional(),
  height: positiveInteger.optional(),
  fps: positive.optional(),
  fit: z.enum(["contain", "cover", "stretch"]).optional(),
  background: nonEmpty.optional(),
  to: z.enum(["mp4", "webm"]).default("mp4"),
  ...mcpHardwareShape,
  ...mcpRuntimeShape,
}).strict();

export const mediaAttachAudioInputSchema = z.object({
  video: nonEmpty,
  audio: nonEmpty,
  mode: z.enum(["replace", "append"]).default("replace"),
  video_mode: z.enum(["auto", "copy", "encode"]).default("auto"),
  pad: z.boolean().default(true),
  ...mcpRuntimeShape,
}).strict();

export const mediaRemoveSilenceInputSchema = z.object({
  input: nonEmpty,
  noise_db: z.number().finite().min(-120).max(0).default(-30),
  min_duration: positive.default(0.5),
  keep_silence: nonNegative.default(0.05),
  ...mcpRuntimeShape,
}).strict();

export const mediaGenerateSilenceInputSchema = z.object({
  duration: positive.default(1),
  sample_rate: positiveInteger.default(48_000),
  channels: positiveInteger.default(2),
  channel_layout: nonEmpty.optional(),
  ...mcpRuntimeShape,
}).strict();

export const mediaRestoreInputSchema = z.object({
  input: nonEmpty,
  width: positiveInteger,
  height: positiveInteger,
  profile: z.enum(["balanced", "aggressive"]).default("balanced"),
  fps: positive.optional(),
  crf: z.number().finite().min(0).max(63).optional(),
  preset: nonEmpty.optional(),
  fit: z.enum(["contain", "cover", "stretch"]).optional(),
  background: nonEmpty.optional(),
  to: z.enum(["mp4", "webm"]).default("mp4"),
  ...mcpRuntimeShape,
}).strict();

export const mediaDiagnoseInputSchema = z.object({
  input: nonEmpty,
  deep: z.boolean().default(false),
  freeze_noise_db: z.number().finite().min(-120).max(0).default(-50),
  freeze_duration: positive.default(2),
  log_text: z.string().optional(),
  dry_run: z.boolean().default(false),
  verbose: z.boolean().default(false),
  ffmpeg_path: nonEmpty.optional(),
  ffprobe_path: nonEmpty.optional(),
}).strict();

export type MediaProbeInput = z.infer<typeof mediaProbeInputSchema>;
export type MediaTrimInput = z.infer<typeof mediaTrimInputSchema>;
export type MediaConvertInput = z.infer<typeof mediaConvertInputSchema>;
export type MediaConcatInput = z.infer<typeof mediaConcatInputSchema>;
export type MediaAttachAudioInput = z.infer<typeof mediaAttachAudioInputSchema>;
export type MediaRemoveSilenceInput = z.infer<typeof mediaRemoveSilenceInputSchema>;
export type MediaGenerateSilenceInput = z.infer<typeof mediaGenerateSilenceInputSchema>;
export type MediaRestoreInput = z.infer<typeof mediaRestoreInputSchema>;
export type MediaDiagnoseInput = z.infer<typeof mediaDiagnoseInputSchema>;
