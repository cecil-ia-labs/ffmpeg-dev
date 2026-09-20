import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return readFile(path.join(root, relative), "utf8");
}

const pkg = JSON.parse(await text("package.json"));
const contract = JSON.parse(await text("specs/stable-release-contract.json"));
const plugin = JSON.parse(await text("plugin.json"));

assert(pkg.version === "1.2.0", "Milestone 17 package version must be 1.2.0.");
assert(contract.release === "1.2.0", "Stable release contract must be v1.2.0.");
assert(pkg.scripts?.["verify:hardware"] === "node scripts/verify-hardware.mjs", "Missing verify:hardware script.");
assert(pkg.scripts?.validate?.includes("verify:hardware"), "validate must include verify:hardware.");

for (const relative of [
  "src/hardware/types.ts",
  "src/hardware/selection.ts",
  "src/hardware/index.ts",
  "src/video/hardware.ts",
  "test/hardware/selection.test.ts",
  "test/conversion/hardware.integration.test.ts",
  "docs/hardware-acceleration.md",
]) {
  assert((await stat(path.join(root, relative))).isFile(), "Missing hardware acceleration file: " + relative);
}

const selection = await text("src/hardware/selection.ts");
for (const encoder of [
  "h264_nvenc",
  "h264_qsv",
  "h264_vaapi",
  "h264_videotoolbox",
  "vp9_qsv",
  "vp9_vaapi",
]) {
  assert(selection.includes(encoder), "Hardware selector is missing encoder mapping: " + encoder);
}
for (const invariant of [
  "preferredHardwareBackends",
  "runtimeProbe",
  "W_HARDWARE_SOFTWARE_FALLBACK",
  "W_HARDWARE_DRY_RUN_UNVERIFIED",
  "hardwareStrict",
]) {
  assert(selection.includes(invariant), "Hardware selector is missing invariant: " + invariant);
}
assert(!selection.includes("node:child_process"), "Hardware selection must reuse the existing FFmpeg runtime.");

const conversionOptions = await text("src/cli/conversion-options.ts");
for (const flag of ["--hardware <mode>", "--hardware-device <path>", "--hardware-strict"]) {
  assert(conversionOptions.includes(flag), "Conversion CLI is missing hardware flag: " + flag);
}
const videoOptions = await text("src/cli/video-options.ts");
for (const flag of ["--hardware <mode>", "--hardware-device <path>", "--hardware-strict"]) {
  assert(videoOptions.includes(flag), "Video CLI is missing hardware flag: " + flag);
}

const environment = await text("src/environment/capabilities.ts");
assert(environment.includes('"nvdec"'), "Environment capability inspection must expose NVDEC/CUVID discovery.");
assert(environment.includes("decoders:"), "Hardware capability metadata must include decoder lists.");

const pluginHardware = plugin.extensions?.["com.cecilialabs.ffmpeg"]?.hardware;
assert(pluginHardware?.fallback === "software", "Plugin hardware metadata must declare software fallback.");
assert(pluginHardware?.runtimeProbe === true, "Plugin hardware metadata must declare runtime probing.");
assert(pluginHardware?.modes?.includes("auto"), "Plugin hardware metadata must expose auto mode.");

const hardwareContract = contract.hardwareAcceleration;
assert(hardwareContract?.default === "software", "v1.2 must preserve software encoding by default.");
assert(hardwareContract?.runtimeProbe === true, "Stable hardware contract must require runtime probing.");
assert(hardwareContract?.softwareFallback === true, "Stable hardware contract must preserve software fallback.");

const docs = await text("docs/hardware-acceleration.md");
for (const token of ["--hardware auto", "NVENC", "NVDEC", "Quick Sync", "VAAPI", "VideoToolbox"]) {
  assert(docs.includes(token), "Hardware documentation is missing: " + token);
}

console.log("Milestone 17 hardware acceleration: PASS (NVENC/NVDEC, QSV, VAAPI, VideoToolbox)");
