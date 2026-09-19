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
  "src/media/fit.ts",
  "src/image/types.ts",
  "src/image/extract.ts",
  "src/cli/actions/milestone-13-5.ts",
  "src/cli/milestone-13-5-options.ts",
  "src/composition/transitions.ts",
  "test/media/fit.test.ts",
  "test/image/image.integration.test.ts",
  "test/conversion/audio-conversion.integration.test.ts",
  "test/composition/transitions.test.ts",
  "docs/milestone-13-5/media-capability-expansion.md",
]) {
  assert((await stat(path.join(root, relative))).isFile(), `Missing Milestone 13.5 file: ${relative}`);
}

const registry = await text("src/cli/action-registry.ts");
for (const command of [
  "video upscale",
  "video attach-audio",
  "video add-silence",
  "image convert",
  "image extract",
]) {
  assert(registry.includes(command), `Missing Milestone 13.5 action: ${command}`);
}

const profiles = await text("src/conversion/profiles.ts");
for (const token of [
  "jpeg", "mp4", "wav", "mp3", "aac", "m4a", "flac", "opus", "ogg",
  "libx264", "libmp3lame", "pcm_s16le",
]) {
  assert(profiles.includes(token), `Expanded conversion profile missing ${token}`);
}
assert(profiles.includes('if (normalized === "jpg") return "jpeg"'), "JPG alias must normalize to jpeg.");

const fit = await text("src/media/fit.ts");
for (const mode of ["contain", "cover", "stretch"]) {
  assert(fit.includes(`"${mode}"`), `Missing fit mode ${mode}`);
}

const transitions = await text("src/composition/transitions.ts");
assert(transitions.includes('"zoomin"'), "Missing zoomin transition.");
assert(transitions.includes('"zoomout"'), "Missing zoomout transition.");
assert(transitions.includes("transition=custom"), "zoomout must use an explicit custom transition rather than aliasing dissolve.");

const slideshow = await text("src/composition/slideshow.ts");
for (const token of ['style === "sequence"', "includes", "excludes", "transitionDuration", "SlideshowOutputFormat"]) {
  assert(slideshow.includes(token), `Slideshow expansion missing ${token}`);
}

const colors = await text("src/cli/colors.ts");
assert(colors.includes("brightGreen"), "CLI color pass must include bright success output.");
assert(colors.includes("brightMagenta"), "CLI color pass must include visible detail color.");
assert(colors.includes("NO_COLOR"), "CLI colors must retain NO_COLOR support.");

const packageJson = JSON.parse(await text("package.json"));
assert(packageJson.scripts?.["verify:media-expansion"] === "node scripts/verify-media-expansion.mjs", "Missing verify:media-expansion package script.");
assert(packageJson.scripts?.validate?.includes("verify:media-expansion"), "validate must include verify:media-expansion.");

console.log("Milestone 13.5 media capability expansion: PASS");
