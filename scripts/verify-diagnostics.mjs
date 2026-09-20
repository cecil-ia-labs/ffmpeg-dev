import { readFile } from "node:fs/promises";

const required = [
  "src/diagnostics/analyze.ts",
  "src/diagnostics/repair.ts",
  "src/diagnostics/types.ts",
  "src/cli/actions/diagnostics.ts",
  "src/cli/diagnostics-options.ts",
  "test/diagnostics/parsers.test.ts",
  "test/diagnostics/diagnostics.integration.test.ts",
];

for (const file of required) await readFile(new URL(`../${file}`, import.meta.url), "utf8");
const registry = await readFile(new URL("../src/cli/action-registry.ts", import.meta.url), "utf8");
for (const command of ["cecilia-ffmpeg diagnose", "cecilia-ffmpeg repair timestamps", "cecilia-ffmpeg repair normalize"]) {
  if (!registry.includes(command)) throw new Error(`Missing Diagnostics action: ${command}`);
}
console.log("Diagnostics diagnostics structure: PASS");
