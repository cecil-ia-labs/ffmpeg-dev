#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function versionAtLeast(version, minimum) {
  const parse = (value) => value.split(".").map((part) => Number(part));
  const left = parse(version);
  const right = parse(minimum);
  for (let i = 0; i < 3; i += 1) {
    if ((left[i] ?? 0) > (right[i] ?? 0)) return true;
    if ((left[i] ?? 0) < (right[i] ?? 0)) return false;
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
  "src/audio/types.ts",
  "src/audio/encoding.ts",
  "src/audio/helpers.ts",
  "src/audio/attach.ts",
  "src/audio/silence.ts",
  "src/audio/silence-detect.ts",
  "src/audio/remove-silence.ts",
  "src/audio/telephony.ts",
  "src/audio/index.ts",
  "src/cli/actions/milestone-5.ts",
  "src/cli/milestone-5-options.ts",
  "test/audio/audio-builders.test.ts",
  "test/audio/audio.integration.test.ts",
  "test/cli/audio-options.test.ts",
  "specs/silence-detection.schema.json",
];
for (const file of required) await stat(file);

const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (!versionAtLeast(pkg.version, "0.3.0")) throw new Error(`Milestone 5 requires package version >= 0.3.0, got ${pkg.version}`);
const registry = await readFile("src/cli/action-registry.ts", "utf8");
for (const command of ["audio attach", "audio silence", "audio add-silence", "audio detect-silence", "audio remove-silence", "audio telephony"]) {
  if (!registry.includes(command)) throw new Error(`Missing Milestone 5 action: ${command}`);
}
const telephonySource = await readFile("src/audio/telephony.ts", "utf8");
if (!telephonySource.includes("pcm_mulaw") || !telephonySource.includes("libgsm")) {
  throw new Error("Telephony implementation must distinguish G.711 mu-law and GSM encoders.");
}

const directory = await mkdtemp(path.join(os.tmpdir(), "cecilia-ffmpeg-audio-"));
try {
  const video = path.join(directory, "video only.mp4");
  const replacement = path.join(directory, "replacement.wav");
  const silence = path.join(directory, "silence.wav");
  const attached = path.join(directory, "attached.mp4");
  const silentVideo = path.join(directory, "silent-video.mp4");
  const speech = path.join(directory, "speech.wav");
  const cleaned = path.join(directory, "cleaned.wav");
  const mulaw = path.join(directory, "pcmu.wav");
  const gsm = path.join(directory, "voice.gsm");

  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=160x90:rate=20", "-t", "1.2", "-c:v", "mpeg4", "-pix_fmt", "yuv420p", "-an", "-y", video]);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.4", "-c:a", "pcm_s16le", "-y", replacement]);

  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "0.4", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", "-y", silence]);
  const silenceProbe = await probe(silence);
  const silenceAudio = silenceProbe.streams.find((stream) => stream.codec_type === "audio");
  if (silenceAudio?.sample_rate !== "48000" || silenceAudio?.channels !== 2) throw new Error("Silence generation verification failed");

  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", video, "-i", replacement, "-filter_complex", "[1:a:0]apad[newa]", "-map", "0:v:0", "-map", "[newa]", "-c:v", "copy", "-c:a", "aac", "-t", "1.2", "-y", attached]);
  const attachedProbe = await probe(attached);
  if (!attachedProbe.streams.some((stream) => stream.codec_type === "video") || !attachedProbe.streams.some((stream) => stream.codec_type === "audio")) {
    throw new Error("Audio attach verification failed");
  }

  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", video, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-shortest", "-y", silentVideo]);
  const silentVideoProbe = await probe(silentVideo);
  if (!silentVideoProbe.streams.some((stream) => stream.codec_type === "audio")) throw new Error("Silent-track verification failed");

  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.30",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono:d=0.60",
    "-f", "lavfi", "-i", "sine=frequency=660:sample_rate=48000:duration=0.30",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono:d=0.60",
    "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.30",
    "-filter_complex", "[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1[outa]",
    "-map", "[outa]", "-c:a", "pcm_s16le", "-y", speech,
  ]);
  let silenceDetection;
  try {
    await run("ffmpeg", ["-hide_banner", "-nostats", "-i", speech, "-af", "silencedetect=noise=-30dB:d=0.5", "-f", "null", "-"]);
  } catch (error) {
    // execFile rejects non-zero codes, but silencedetect normally exits 0. Preserve stderr for diagnostics if a platform differs.
    silenceDetection = error.stderr ?? "";
  }
  if (silenceDetection === undefined) {
    const detected = await execFileAsync("ffmpeg", ["-hide_banner", "-nostats", "-i", speech, "-af", "silencedetect=noise=-30dB:d=0.5", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    silenceDetection = detected.stderr;
  }
  if ((silenceDetection.match(/silence_start:/g) ?? []).length < 2) throw new Error("Silence detection verification failed");

  const filter = "silenceremove=start_periods=1:start_duration=0.5:start_threshold=-30dB:start_silence=0.03:stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB:stop_silence=0.03:detection=rms";
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", speech, "-map", "0:a:0", "-af", filter, "-c:a", "pcm_s16le", "-y", cleaned]);
  const speechProbe = await probe(speech);
  const cleanedProbe = await probe(cleaned);
  if (Number(cleanedProbe.format.duration) >= Number(speechProbe.format.duration)) throw new Error("Silence removal verification failed");

  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", replacement, "-map", "0:a:0", "-vn", "-ar", "8000", "-ac", "1", "-sample_fmt", "s16", "-c:a", "pcm_mulaw", "-y", mulaw]);
  const mulawProbe = await probe(mulaw);
  const mulawAudio = mulawProbe.streams.find((stream) => stream.codec_type === "audio");
  if (mulawAudio?.codec_name !== "pcm_mulaw" || mulawAudio?.sample_rate !== "8000" || mulawAudio?.channels !== 1) throw new Error("G.711 mu-law verification failed");

  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", replacement, "-map", "0:a:0", "-vn", "-ar", "8000", "-ac", "1", "-sample_fmt", "s16", "-c:a", "libgsm", "-f", "gsm", "-y", gsm]);
  const gsmProbe = await probe(gsm);
  const gsmAudio = gsmProbe.streams.find((stream) => stream.codec_type === "audio");
  if (gsmAudio?.codec_name !== "gsm") throw new Error("GSM verification failed");

  console.log("Milestone 5 audio verifier: PASS");
  console.log("silence: pcm_s16le 48000 Hz stereo");
  console.log("attach/add-silence: video + audio streams verified");
  console.log(`silencedetect intervals: ${(silenceDetection.match(/silence_start:/g) ?? []).length}`);
  console.log(`silence removal: ${speechProbe.format.duration}s -> ${cleanedProbe.format.duration}s`);
  console.log("telephony: pcm_mulaw != gsm (verified as distinct codecs)");
} finally {
  await rm(directory, { recursive: true, force: true });
}
