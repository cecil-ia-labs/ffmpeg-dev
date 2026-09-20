import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

const migration = await readJson("test/fixtures/legacy-migration-map.json");
const mapped = migration.migrations.map((entry) => entry.legacy);
assert(mapped.length === 21, "Legacy migration integration map must preserve all 21 historical Bash migrations.");
assert(new Set(mapped).size === mapped.length, "Legacy migration integration map must not contain duplicate script identifiers.");
for (const legacy of mapped) {
  assert(
    typeof legacy === "string" && legacy.startsWith("legacy/bash/") && legacy.endsWith(".sh"),
    `Invalid historical legacy script identifier: ${legacy}`,
  );
}
assert(migration.integrationTest.endsWith(".integration.test.ts"), "Legacy migration map must target an integration test.");
const migrationSource = await readFile(path.join(root, migration.integrationTest), "utf8");
for (const legacy of mapped) {
  assert(migrationSource.includes(legacy), `Missing explicit integration test case for ${legacy}`);
}

const manifest = await readJson("test/fixtures/manifest.json");
const ids = new Set(manifest.fixtures.map((fixture) => fixture.id));
for (const id of [
  "mp4-h264-aac", "mp4-h265-aac", "webm-vp9-opus", "gif", "static-webp", "animated-webp",
  "png", "jpeg", "mp3", "aac", "wav-pcm", "wav-mulaw",
  "video-24fps", "video-30fps", "video-vfr", "video-only", "audio-only",
  "timebase-1k", "timebase-90k", "resolution-320x180", "pixfmt-yuv444p",
]) {
  assert(ids.has(id), `Fixture matrix is missing ${id}`);
}

const layers = {
  unit: "test/core/command-result.test.ts",
  integration: "test/video/video.integration.test.ts",
  cli: "test/cli/help.test.ts",
  ffmpegIntegration: "test/fixtures/fixture-matrix.integration.test.ts",
  fixtureRegression: "test/regression/legacy-migrations.integration.test.ts",
  mcpUnit: "test/mcp/schemas.test.ts",
  mcpIntegration: "test/mcp/adapters.integration.test.ts",
  hardwareUnit: "test/hardware/selection.test.ts",
  hardwareIntegration: "test/conversion/hardware.integration.test.ts",
  pipelineUnit: "test/pipeline/presets.test.ts",
  pipelineIntegration: "test/pipeline/normalize.integration.test.ts",
  outputPreflight: "test/media/output-preflight.test.ts",
};
for (const [layer, relative] of Object.entries(layers)) {
  assert((await stat(path.join(root, relative))).isFile(), `Missing ${layer} test layer: ${relative}`);
}

const fixtureTest = await readFile(path.join(root, layers.ffmpegIntegration), "utf8");
assert(fixtureTest.includes("probeMedia"), "Fixture regression must verify media properties with FFprobe-backed probeMedia.");

console.log(`Test-suite structure: PASS (${mapped.length} historical migrations, ${manifest.fixtures.length} fixture recipes)`);
