#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(binary, args) {
  return execFileAsync(binary, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-ffmpeg-inspection-"));
const fixture = path.join(directory, "fixture.mp4");
try {
  const ffmpegVersion = await run("ffmpeg", ["-version"]);
  const ffprobeVersion = await run("ffprobe", ["-version"]);
  if (!/^ffmpeg version /m.test(ffmpegVersion.stdout)) throw new Error("Unable to read FFmpeg version");
  if (!/^ffprobe version /m.test(ffprobeVersion.stdout)) throw new Error("Unable to read FFprobe version");

  const encoders = await run("ffmpeg", ["-hide_banner", "-encoders"]);
  const decoders = await run("ffmpeg", ["-hide_banner", "-decoders"]);
  const filters = await run("ffmpeg", ["-hide_banner", "-filters"]);
  const hwaccels = await run("ffmpeg", ["-hide_banner", "-hwaccels"]);
  if (!/Encoders:/m.test(encoders.stdout)) throw new Error("Encoder enumeration failed");
  if (!/Decoders:/m.test(decoders.stdout)) throw new Error("Decoder enumeration failed");
  if (!/Filters:/m.test(filters.stdout)) throw new Error("Filter enumeration failed");
  if (!/Hardware acceleration methods:/m.test(hwaccels.stdout)) throw new Error("Hardware accelerator enumeration failed");

  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc=size=96x64:rate=10",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
    "-t", "0.5", "-c:v", "mpeg4", "-c:a", "aac", "-shortest", "-y", fixture,
  ]);
  const probe = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", fixture]);
  const parsed = JSON.parse(probe.stdout);
  if (!Array.isArray(parsed.streams) || parsed.streams.length < 2) throw new Error("FFprobe stream inspection failed");
  if (!parsed.format || typeof parsed.format !== "object") throw new Error("FFprobe format inspection failed");

  console.log("Environment verifier: PASS");
  console.log(ffmpegVersion.stdout.split(/\r?\n/)[0]);
  console.log(ffprobeVersion.stdout.split(/\r?\n/)[0]);
  console.log(`fixture streams: ${parsed.streams.length}`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
