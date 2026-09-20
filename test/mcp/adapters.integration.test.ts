import { describe, expect, it, beforeAll } from "vitest";

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
} from "../../src/mcp/adapters.js";
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
} from "../../src/mcp/schemas.js";
import { ensureFixtureMatrix, fixturePath } from "../helpers/fixture-matrix.js";

let available = false;

beforeAll(async () => {
  available = await ensureFixtureMatrix();
}, 120_000);

describe("Milestone 16 MCP domain adapters", () => {
  it("routes all initial MCP tools through the existing typed domain implementation", async () => {
    if (!available) return;

    const signal = new AbortController().signal;
    const video = await fixturePath("mp4-h264-aac");
    const audio = await fixturePath("wav-pcm");
    const speech = await fixturePath("speech-with-silence");

    const probe = await mediaProbeAdapter(
      mediaProbeInputSchema.parse({ input: video }),
      signal,
    );
    expect(probe.media?.video).toHaveLength(1);

    const trim = await mediaTrimAdapter(
      mediaTrimInputSchema.parse({ input: video, duration: 0.4, dry_run: true }),
      signal,
    );
    expect(trim).toMatchObject({ operation: "trim", planned: true });

    const conversion = await mediaConvertAdapter(
      mediaConvertInputSchema.parse({ input: video, to: "webm", dry_run: true }),
      signal,
    );
    expect(conversion).toMatchObject({ operation: "convert-file", targetFormat: "webm", planned: true });

    const concat = await mediaConcatAdapter(
      mediaConcatInputSchema.parse({ inputs: [video, video], dry_run: true }),
      signal,
    );
    expect(concat).toMatchObject({ operation: "concat", planned: true });

    const attached = await mediaAttachAudioAdapter(
      mediaAttachAudioInputSchema.parse({ video, audio, dry_run: true }),
      signal,
    );
    expect(attached).toMatchObject({ operation: "attach", planned: true });

    const removed = await mediaRemoveSilenceAdapter(
      mediaRemoveSilenceInputSchema.parse({ input: speech, dry_run: true }),
      signal,
    );
    expect(removed).toMatchObject({ operation: "remove-silence", planned: true });

    const silence = await mediaGenerateSilenceAdapter(
      mediaGenerateSilenceInputSchema.parse({ dry_run: true }),
      signal,
    );
    expect(silence).toMatchObject({ operation: "silence", planned: true });

    const restored = await mediaRestoreAdapter(
      mediaRestoreInputSchema.parse({
        input: video,
        width: 320,
        height: 180,
        dry_run: true,
      }),
      signal,
    );
    expect(restored).toMatchObject({ operation: "upscale", planned: true });

    const diagnosis = await mediaDiagnoseAdapter(
      mediaDiagnoseInputSchema.parse({ input: video, dry_run: true }),
      signal,
    );
    expect(diagnosis.source).toBe(video);
    expect(diagnosis.planned).toBe(true);
  }, 120_000);
});
