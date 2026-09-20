import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return await readFile(path.join(root, relative), "utf8");
}

for (const relative of [
  "src/core/progress.ts",
  "src/core/progress-context.ts",
  "src/cli/progress-renderer.ts",
  "src/cli/icons.ts",
  "test/cli/semantic-ux.test.ts",
  "test/core/progress.test.ts",
  "test/core/progress-runtime.integration.test.ts",
  "test/cli/progress-renderer.test.ts",
  "docs/development/ux-progress-agent-output.md",
]) {
  assert((await stat(path.join(root, relative))).isFile(), `Missing UX/progress file: ${relative}`);
}

const runner = await text("src/core/ffmpeg-runner.ts");
assert(runner.includes('"pipe:1"'), "FFmpeg runner must use machine-readable -progress pipe:1 output.");
assert(runner.includes('"-nostats"'), "FFmpeg runner must suppress decorated FFmpeg stats when structured progress is active.");
assert(runner.includes("deriveProgressEvent"), "FFmpeg runner must derive structured progress metrics.");

const shared = await text("src/cli/actions/shared.ts");
assert(shared.includes("withProgressObserver"), "CLI actions must establish a progress context.");
assert(shared.includes("CliProgressReporter"), "CLI actions must use the shared progress reporter.");
assert(shared.includes("colorizeError(runtimeError.code, runtimeError.message"), "Human failures must preserve stable runtime error codes through the formatter.");

const program = await text("src/cli/program.ts");
assert(program.includes("--no-progress"), "CLI must expose --no-progress.");
assert(program.includes("--no-color"), "CLI must expose --no-color.");

const colors = await text("src/cli/colors.ts");
assert(colors.includes("NO_COLOR"), "Human color output must honor NO_COLOR.");
assert(colors.includes("FORCE_COLOR"), "Human color output must honor FORCE_COLOR.");
assert(colors.includes("CLI_ICONS"), "Human output must use semantic icons.");

const progressRenderer = await text("src/cli/progress-renderer.ts");
assert(progressRenderer.includes("progressSourceIcon"), "TTY progress must expose semantic source icons.");
assert(progressRenderer.includes("friendly"), "Progress renderer must separate friendly TTY decoration from plain output.");

const icons = await text("src/cli/icons.ts");
for (const icon of ["🎬", "🖼️", "🎧", "🔄", "🧩", "📡", "⚡", "🚀", "⌛"]) {
  assert(icons.includes(icon), `Semantic icon catalog is missing ${icon}`);
}

const schema = JSON.parse(await text("specs/output-envelope.schema.json"));
assert(schema.properties?.progress?.$ref === "#/$defs/progress", "JSON envelope schema must expose structured progress.");
assert(schema.$defs?.progressRun?.properties?.percentage, "JSON progress schema must define percentage.");
assert(schema.$defs?.progressRun?.properties?.etaSeconds, "JSON progress schema must define ETA.");
assert(schema.$defs?.progressRun?.properties?.speedMultiplier, "JSON progress schema must define speed multiplier.");
assert(schema.$defs?.progressRun?.properties?.fps, "JSON progress schema must define processing FPS.");
assert(schema.$defs?.progressRun?.properties?.frame, "JSON progress schema must define processed frames.");

const packageJson = JSON.parse(await text("package.json"));
assert(packageJson.scripts?.["verify:ux"] === "node scripts/verify-ux.mjs", "Missing verify:ux package script.");
assert(packageJson.scripts?.validate?.includes("verify:ux"), "validate must include verify:ux.");

console.log("UX/progress UX/progress/agent-output structure: PASS");
