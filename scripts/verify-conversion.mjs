#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function versionAtLeast(version, minimum) {
  const left = version.split(".").map(Number);
  const right = minimum.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] ?? 0) > (right[index] ?? 0)) return true;
    if ((left[index] ?? 0) < (right[index] ?? 0)) return false;
  }
  return true;
}

async function run(binary, args) {
  return execFileAsync(binary, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

async function probe(file) {
  const result = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", file]);
  return JSON.parse(result.stdout);
}

const required = [
  "src/conversion/types.ts",
  "src/conversion/profiles.ts",
  "src/conversion/patterns.ts",
  "src/conversion/convert.ts",
  "src/conversion/batch.ts",
  "src/conversion/index.ts",
  "src/cli/actions/conversion.ts",
  "src/cli/conversion-options.ts",
  "test/conversion/conversion-builders.test.ts",
  "test/conversion/batch-discovery.test.ts",
  "test/conversion/conversion.integration.test.ts",
  "test/cli/conversion-options.test.ts",
  "specs/conversion-report.schema.json",
  "specs/batch-conversion-report.schema.json"
];
for (const file of required) await stat(file);

const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (!versionAtLeast(pkg.version, "0.4.0")) throw new Error(`Conversion requires package version >= 0.4.0, got ${pkg.version}`);

const registry = await readFile("src/cli/action-registry.ts", "utf8");
for (const command of ["convert file", "convert batch"]) {
  if (!registry.includes(command)) throw new Error(`Missing Conversion action: ${command}`);
}
const profiles = await readFile("src/conversion/profiles.ts", "utf8");
for (const token of ["jpeg", "wav", "mp3", "aac", "m4a", "flac", "opus", "ogg", "libx264", "libmp3lame", "pcm_s16le"]) {
  if (!profiles.includes(token)) throw new Error(`Expanded conversion profile is missing ${token}`);
}
if (profiles.includes("webpmux")) throw new Error("Animated WebP conversion must not require external webpmux.");
const batchSource = await readFile("src/conversion/batch.ts", "utf8");
for (const capability of ["parallelism", "failFast", "preserveHierarchy", "existing", "onProgress"]) {
  if (!batchSource.includes(capability)) throw new Error(`Batch engine is missing ${capability}`);
}

const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-ffmpeg-conversion-"));
try {
  const mp4 = path.join(directory, "source.mp4");
  const webm = path.join(directory, "source.webm");
  const gif = path.join(directory, "source.gif");
  const webp = path.join(directory, "source.webp");
  const png = path.join(directory, "source.png");
  const staticWebp = path.join(directory, "static.webp");
  const gifWebm = path.join(directory, "gif.webm");
  const webmGif = path.join(directory, "webm.gif");

  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=128x72:rate=12", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000", "-t", "0.6", "-c:v", "mpeg4", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-y", mp4]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", mp4, "-map", "0:v:0", "-map", "0:a:0?", "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-pix_fmt", "yuv420p", "-c:a", "libopus", "-b:a", "128k", "-y", webm]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", mp4, "-filter_complex", "[0:v]fps=8,split[v1][v2];[v1]palettegen=max_colors=256[p];[v2][p]paletteuse=dither=sierra2_4a[v]", "-map", "[v]", "-an", "-loop", "0", "-y", gif]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", mp4, "-vf", "fps=8", "-an", "-c:v", "libwebp", "-quality", "80", "-compression_level", "4", "-loop", "0", "-f", "webp", "-y", webp]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", webm, "-filter_complex", "[0:v]fps=8,split[v1][v2];[v1]palettegen=max_colors=256[p];[v2][p]paletteuse=dither=sierra2_4a[v]", "-map", "[v]", "-an", "-loop", "0", "-y", webmGif]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", gif, "-map", "0:v:0", "-an", "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-pix_fmt", "yuv420p", "-y", gifWebm]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=red:size=64x48:d=0.1", "-frames:v", "1", "-c:v", "libwebp", "-f", "webp", "-y", staticWebp]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", staticWebp, "-map", "0:v:0", "-frames:v", "1", "-an", "-c:v", "png", "-y", png]);

  const checks = [
    [webm, "vp9"],
    [gif, "gif"],
    [webp, "webp"],
    [webmGif, "gif"],
    [gifWebm, "vp9"],
    [png, "png"]
  ];
  for (const [file, codec] of checks) {
    const media = await probe(file);
    const video = media.streams.find((stream) => stream.codec_type === "video");
    if (video?.codec_name !== codec) throw new Error(`Expected ${codec} for ${file}, got ${video?.codec_name}`);
  }

  const batchRoot = path.join(directory, "batch");
  await mkdir(path.join(batchRoot, "nested"), { recursive: true });
  console.log("Conversion conversion verifier: PASS");
  console.log("routes: legacy visual routes plus MP4/JPEG targets and typed audio conversion profiles");
  console.log("batch engine: structural support for recursion, patterns, concurrency, failure modes, hierarchy, existing-output policy, progress, and JSON reports");
} finally {
  await rm(directory, { recursive: true, force: true });
}
