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

const required = [
  "src/cli/output-preflight.ts",
  "test/cli/output-preflight.test.ts",
  "test/media/output-preflight.test.ts",
];
for (const relative of required) {
  assert((await stat(path.join(root, relative))).isFile(), "Missing output-preflight artifact: " + relative);
}

const io = await text("src/media/io.ts");
assert(io.includes("export async function preflightOutputPath"), "Media I/O must expose preflightOutputPath().");
assert(io.includes("await preflightOutputPath({"), "Output transactions must reuse preflightOutputPath().");

const shared = await text("src/cli/actions/shared.ts");
assert(shared.includes("preflightExplicitCliOutput"), "CLI action wrapper must run the common output preflight.");
assert(
  shared.indexOf("preflightExplicitCliOutput") < shared.indexOf("withProgressObserver"),
  "CLI explicit-output preflight must run before operation progress/execution.",
);

const cliPreflight = await text("src/cli/output-preflight.ts");
for (const command of [
  "cecilia-ffmpeg video trim-start",
  "cecilia-ffmpeg video trim-end",
  "cecilia-ffmpeg video trim",
  "cecilia-ffmpeg video speed",
  "cecilia-ffmpeg video from-image",
  "cecilia-ffmpeg video upscale",
  "cecilia-ffmpeg video restore",
  "cecilia-ffmpeg video attach-audio",
  "cecilia-ffmpeg video add-silence",
  "cecilia-ffmpeg image convert",
  "cecilia-ffmpeg image extract",
  "cecilia-ffmpeg audio attach",
  "cecilia-ffmpeg audio silence",
  "cecilia-ffmpeg audio add-silence",
  "cecilia-ffmpeg audio remove-silence",
  "cecilia-ffmpeg audio telephony",
  "cecilia-ffmpeg convert file",
  "cecilia-ffmpeg compose concat",
  "cecilia-ffmpeg compose transition",
  "cecilia-ffmpeg compose slideshow",
  "cecilia-ffmpeg repair timestamps",
  "cecilia-ffmpeg repair normalize",
]) {
  assert(cliPreflight.includes(command), "CLI output-preflight catalog is missing: " + command);
}
assert(
  !cliPreflight.includes('"cecilia-ffmpeg run"'),
  "Pipeline must keep its pipeline-directory-relative output preflight instead of the generic CLI path rule.",
);

const domainChecks = [
  ["src/video/trim.ts", "preflightOutputPath"],
  ["src/video/speed.ts", "preflightOutputPath"],
  ["src/video/from-image.ts", "preflightOutputPath"],
  ["src/video/restore.ts", "preflightOutputPath"],
  ["src/audio/attach.ts", "preflightOutputPath"],
  ["src/audio/remove-silence.ts", "preflightOutputPath"],
  ["src/audio/silence.ts", "preflightOutputPath"],
  ["src/audio/telephony.ts", "preflightOutputPath"],
  ["src/conversion/convert.ts", "preflightOutputPath"],
  ["src/conversion/batch.ts", "preflightOutputPath"],
  ["src/composition/concat.ts", "preflightCompositionOutput"],
  ["src/composition/transition.ts", "preflightCompositionOutput"],
  ["src/composition/slideshow.ts", "preflightOutputPath"],
  ["src/image/extract.ts", "preflightOutputPath"],
  ["src/diagnostics/repair.ts", "preflightOutputPath"],
  ["src/pipeline/executor.ts", "preflightOutputPath"],
];

for (const [relative, token] of domainChecks) {
  const source = await text(relative);
  assert(source.includes(token), "Output-producing domain is missing early preflight: " + relative);
}

const pipeline = await text("src/pipeline/executor.ts");
assert(
  pipeline.indexOf("preflightOutputPath") < pipeline.indexOf("TemporaryWorkspace.create"),
  "Pipeline final-output preflight must happen before workspace creation.",
);

const batch = await text("src/conversion/batch.ts");
assert(
  batch.indexOf('if (existing === "error")') < batch.indexOf("const startedAt"),
  "Batch existing-output preflight must finish before workers start.",
);

const repair = await text("src/diagnostics/repair.ts");
assert(
  repair.indexOf("preflightOutputPath({") < repair.indexOf("const beforeReport = await diagnoseMedia"),
  "Repair output preflight must happen before expensive diagnostics.",
);

console.log("Output preflight policy: PASS (CLI hook + all file-producing domains)");
