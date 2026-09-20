import { readFile } from "node:fs/promises";

const required = [
  "src/streaming/types.ts",
  "src/streaming/plan.ts",
  "src/streaming/stream.ts",
  "src/streaming/index.ts",
  "src/cli/actions/streaming.ts",
  "src/cli/streaming-options.ts",
  "test/streaming/plan.test.ts",
  "test/streaming/streaming.integration.test.ts",
];

for (const file of required) await readFile(new URL(`../${file}`, import.meta.url), "utf8");

const registry = await readFile(new URL("../src/cli/action-registry.ts", import.meta.url), "utf8");
for (const command of ["cecilia-ffmpeg stream camera", "cecilia-ffmpeg stream file"]) {
  if (!registry.includes(command)) throw new Error(`Missing Streaming action: ${command}`);
}

const migration = JSON.parse(
  await readFile(new URL("../test/fixtures/legacy-migration-map.json", import.meta.url), "utf8"),
);
const legacyStreaming = migration.migrations.find(
  (entry) => entry.legacy === "legacy/bash/stream-to-websocket.sh",
);
if (legacyStreaming?.equivalent !== "stream camera HTTP relay plan") {
  throw new Error("Historical streaming migration must preserve the HTTP MPEG-TS relay semantics.");
}

console.log("Streaming streaming structure: PASS");
