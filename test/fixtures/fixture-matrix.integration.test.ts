import { readFile } from "node:fs/promises";
import { describe, expect, it, beforeAll } from "vitest";

import { probeMedia } from "../../src/media/probe.js";
import { ensureFixtureMatrix, fixtureDefinitions, fixturePath } from "../helpers/fixture-matrix.js";

interface ExpectedStream {
  codecName?: string;
  width?: number;
  height?: number;
  pixelFormat?: string;
  averageFrameRate?: string;
  timeBase?: string;
  sampleRate?: number;
  channels?: number;
}

interface ManifestFixture {
  id: string;
  expected: {
    video?: ExpectedStream | false;
    audio?: ExpectedStream | false;
    framesMin?: number;
    webpAnimationChunksMin?: number;
    vfr?: boolean;
  };
}

let available = false;
let manifest: ManifestFixture[] = [];

beforeAll(async () => {
  available = await ensureFixtureMatrix();
  if (!available) return;
  const definitions = await fixtureDefinitions();
  const raw = JSON.parse(await readFile("test/fixtures/manifest.json", "utf8")) as { fixtures: ManifestFixture[] };
  expect(definitions.length).toBe(raw.fixtures.length);
  manifest = raw.fixtures;
}, 120_000);

describe("Milestone 12 FFprobe fixture matrix", () => {
  it("verifies media properties rather than only file existence", async () => {
    if (!available) return;
    for (const fixture of manifest) {
      const file = await fixturePath(fixture.id);
      const report = await probeMedia(file);
      const media = report.media;
      expect(media, fixture.id).toBeDefined();
      if (!media) continue;

      if (fixture.expected.video === false) expect(media.video, fixture.id).toHaveLength(0);
      else if (fixture.expected.video) expect(media.video[0], fixture.id).toMatchObject(fixture.expected.video);

      if (fixture.expected.audio === false) expect(media.audio, fixture.id).toHaveLength(0);
      else if (fixture.expected.audio) expect(media.audio[0], fixture.id).toMatchObject(fixture.expected.audio);

      if (fixture.expected.webpAnimationChunksMin) {
        const chunks = (await readFile(file)).toString("latin1");
        const animationFrames = chunks.match(/ANMF/g)?.length ?? 0;
        expect(chunks.includes("ANIM"), fixture.id).toBe(true);
        expect(animationFrames, fixture.id).toBeGreaterThanOrEqual(fixture.expected.webpAnimationChunksMin);
      }

      if (fixture.expected.vfr) {
        expect(media.video[0]?.averageFrameRate, fixture.id).toBeDefined();
        expect(media.video[0]?.realFrameRate, fixture.id).toBeDefined();
        expect(media.video[0]?.averageFrameRate, fixture.id).not.toBe(media.video[0]?.realFrameRate);
      }
    }
  }, 120_000);
});
