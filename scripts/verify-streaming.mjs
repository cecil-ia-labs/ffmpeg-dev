import { readFile } from "node:fs/promises";

const required = [
  "src/streaming/types.ts",
  "src/streaming/plan.ts",
  "src/streaming/stream.ts",
  "src/streaming/index.ts",
  "src/cli/actions/milestone-9.ts",
  "src/cli/milestone-9-options.ts",
  "test/streaming/plan.test.ts",
  "test/streaming/streaming.integration.test.ts",
];

for (const file of required) await readFile(new URL(`../${file}`, import.meta.url), "utf8");

const registry = await readFile(new URL("../src/cli/action-registry.ts", import.meta.url), "utf8");
for (const command of ["cecilia-ffmpeg stream camera", "cecilia-ffmpeg stream file"]) {
  if (!registry.includes(command)) throw new Error(`Missing Milestone 9 action: ${command}`);
}

const legacy = await readFile(new URL("../legacy/bash/stream-to-websocket.sh", import.meta.url), "utf8");
if (!legacy.includes("http://")) throw new Error("Legacy streaming fixture no longer demonstrates the HTTP relay mismatch.");

console.log("Milestone 9 streaming structure: PASS");
