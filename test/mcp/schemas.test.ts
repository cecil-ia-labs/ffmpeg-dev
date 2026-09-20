import { describe, expect, it } from "vitest";

import { MCP_TOOL_NAMES, createMediaMcpServer } from "../../src/mcp/server.js";
import {
  mediaConvertInputSchema,
  mediaGenerateSilenceInputSchema,
  mediaTrimInputSchema,
} from "../../src/mcp/schemas.js";

describe("Milestone 16 MCP server surface", () => {
  it("registers the frozen initial media tool catalog", () => {
    expect(MCP_TOOL_NAMES).toEqual([
      "media_probe",
      "media_trim",
      "media_convert",
      "media_concat",
      "media_attach_audio",
      "media_remove_silence",
      "media_generate_silence",
      "media_restore",
      "media_diagnose",
    ]);
    expect(createMediaMcpServer()).toBeDefined();
  });

  it("validates trim ranges before reaching the media domain", () => {
    expect(mediaTrimInputSchema.safeParse({ input: "clip.mp4" }).success).toBe(false);
    expect(mediaTrimInputSchema.safeParse({ input: "clip.mp4", duration: 1 }).success).toBe(true);
    expect(mediaTrimInputSchema.safeParse({ input: "clip.mp4", start: 2, end: 1 }).success).toBe(false);
    expect(mediaTrimInputSchema.safeParse({ input: "clip.mp4", end: 2, duration: 1 }).success).toBe(false);
  });

  it("keeps MCP arguments JSON-native and deterministic", () => {
    const conversion = mediaConvertInputSchema.parse({ input: "clip.mp4", to: "webm", dry_run: true });
    expect(conversion).toMatchObject({
      input: "clip.mp4",
      to: "webm",
      overwrite: false,
      dry_run: true,
      verbose: false,
      keep_temp: false,
    });

    const silence = mediaGenerateSilenceInputSchema.parse({});
    expect(silence).toMatchObject({
      duration: 1,
      sample_rate: 48_000,
      channels: 2,
      overwrite: false,
      dry_run: false,
    });
  });
});
