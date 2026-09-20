import { McpServer } from "@modelcontextprotocol/server";

import { VERSION } from "../version.js";
import {
  mediaAttachAudioAdapter,
  mediaConcatAdapter,
  mediaConvertAdapter,
  mediaDiagnoseAdapter,
  mediaGenerateSilenceAdapter,
  mediaProbeAdapter,
  mediaRemoveSilenceAdapter,
  mediaRestoreAdapter,
  mediaTrimAdapter,
} from "./adapters.js";
import { executeMcpOperation } from "./runtime.js";
import {
  mediaAttachAudioInputSchema,
  mediaConcatInputSchema,
  mediaConvertInputSchema,
  mediaDiagnoseInputSchema,
  mediaGenerateSilenceInputSchema,
  mediaProbeInputSchema,
  mediaRemoveSilenceInputSchema,
  mediaRestoreInputSchema,
  mediaTrimInputSchema,
} from "./schemas.js";

export const MCP_TOOL_NAMES = [
  "media_probe",
  "media_trim",
  "media_convert",
  "media_concat",
  "media_attach_audio",
  "media_remove_silence",
  "media_generate_silence",
  "media_restore",
  "media_diagnose",
] as const;

export type MediaMcpToolName = (typeof MCP_TOOL_NAMES)[number];

const instructions = [
  "Use media_probe before complex transformations when source properties are unknown.",
  "All file paths refer to the filesystem visible to this MCP server process.",
  "Transform tools call the same typed domain functions as the cecilia-ffmpeg CLI.",
  "Outputs never overwrite an existing destination unless overwrite=true is explicit.",
  "Use dry_run=true when the user wants a validated FFmpeg plan without mutating media.",
  "media_restore uses the toolkit's canonical upscale/restoration implementation.",
].join(" ");

export function createMediaMcpServer(): McpServer {
  const server = new McpServer(
    { name: "ffmpeg-media-toolkit", version: VERSION },
    { instructions },
  );

  server.registerTool(
    "media_probe",
    {
      title: "Probe media",
      description: "Inspect a local media file with FFprobe and return normalized typed media metadata.",
      inputSchema: mediaProbeInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaProbeAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_trim",
    {
      title: "Trim video",
      description: "Trim a local video range using the toolkit's deterministic video trim implementation.",
      inputSchema: mediaTrimInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaTrimAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_convert",
    {
      title: "Convert media",
      description: "Convert one local media file using the same typed conversion profiles as the CLI.",
      inputSchema: mediaConvertInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaConvertAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_concat",
    {
      title: "Concatenate media",
      description: "Concatenate two or more videos with normalization, optional transitions, and audio policy.",
      inputSchema: mediaConcatInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaConcatAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_attach_audio",
    {
      title: "Attach audio",
      description: "Attach or replace a video's audio track using the toolkit audio attachment implementation.",
      inputSchema: mediaAttachAudioInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaAttachAudioAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_remove_silence",
    {
      title: "Remove silence",
      description: "Remove detected silence from an audio-only input with configurable threshold and retention.",
      inputSchema: mediaRemoveSilenceInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaRemoveSilenceAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_generate_silence",
    {
      title: "Generate silence",
      description: "Generate a silent audio file with explicit duration, sample rate, channels, and layout.",
      inputSchema: mediaGenerateSilenceInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaGenerateSilenceAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_restore",
    {
      title: "Restore or upscale video",
      description: "Restore/upscale video through the canonical video scaling pipeline with balanced or aggressive profiles.",
      inputSchema: mediaRestoreInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaRestoreAdapter(args, ctx.mcpReq.signal),
    ),
  );

  server.registerTool(
    "media_diagnose",
    {
      title: "Diagnose media",
      description: "Probe and diagnose timestamps, streams, codecs, decoding issues, and optional frozen video intervals.",
      inputSchema: mediaDiagnoseInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async (args, ctx) => await executeMcpOperation(
      async () => await mediaDiagnoseAdapter(args, ctx.mcpReq.signal),
    ),
  );

  return server;
}
