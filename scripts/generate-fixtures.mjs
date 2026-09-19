import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, "test/fixtures/manifest.json"), "utf8"));
const outputDirectory = path.join(root, manifest.generatedDirectory);
const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
const force = process.argv.includes("--force");
const quiet = process.argv.includes("--quiet");

function fail(message) {
  throw new Error(message);
}

function run(args, options = {}) {
  const result = spawnSync(ffmpeg, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`FFmpeg fixture command failed (${result.status ?? "unknown"}):\n${ffmpeg} ${args.join(" ")}\n${result.stderr || result.stdout}`);
  }
  return result;
}

function output(name) {
  return path.join(outputDirectory, name);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function complete() {
  const marker = path.join(outputDirectory, ".fixture-version");
  if (!(await exists(marker))) return false;
  if ((await readFile(marker, "utf8")).trim() !== String(manifest.generatorVersion)) return false;
  for (const fixture of manifest.fixtures) {
    if (!(await exists(output(fixture.file)))) return false;
  }
  return true;
}

const encoderOutput = run(["-hide_banner", "-encoders"]).stdout + run(["-hide_banner", "-encoders"]).stderr;
function requireEncoder(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!(new RegExp(`\\b${escaped}\\b`)).test(encoderOutput)) {
    fail(`Required FFmpeg encoder is unavailable for the Milestone 12 fixture matrix: ${name}`);
  }
}

for (const encoder of ["libx264", "libx265", "libvpx-vp9", "libopus", "libwebp", "libmp3lame", "aac", "pcm_s16le", "pcm_mulaw", "gif", "png", "mjpeg"]) {
  requireEncoder(encoder);
}

if (!force && await complete()) {
  if (!quiet) console.log(`Milestone 12 fixtures already generated: ${outputDirectory}`);
  process.exit(0);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

function avFixture(file, videoCodec, extraVideo = [], extraOutput = []) {
  run([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "testsrc2=size=160x90:rate=24:duration=0.8",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.8",
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", videoCodec, ...extraVideo,
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "64k",
    "-shortest", ...extraOutput, "-y", output(file),
  ]);
}

function videoOnly(file, rate = 24, size = "160x90", pixelFormat = "yuv420p", extraOutput = []) {
  run([
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", `testsrc2=size=${size}:rate=${rate}:duration=0.8`,
    "-an", "-c:v", "libx264", "-preset", "ultrafast", "-threads", "1",
    "-pix_fmt", pixelFormat, ...extraOutput, "-y", output(file),
  ]);
}

avFixture("mp4-h264-aac.mp4", "libx264", ["-preset", "ultrafast", "-threads", "1"]);
avFixture("mp4-h265-aac.mp4", "libx265", ["-preset", "ultrafast", "-x265-params", "pools=1:frame-threads=1:log-level=error"]);

run([
  "-hide_banner", "-loglevel", "error",
  "-f", "lavfi", "-i", "testsrc2=size=160x90:rate=24:duration=0.8",
  "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.8",
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8", "-b:v", "180k",
  "-c:a", "libopus", "-b:a", "48k", "-shortest", "-y", output("webm-vp9-opus.webm"),
]);

run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=64x48:rate=6:duration=0.8", "-an", "-c:v", "gif", "-y", output("animated.gif")]);
run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=64x48:rate=6:duration=0.8", "-an", "-c:v", "libwebp", "-lossless", "1", "-loop", "0", "-y", output("animated.webp")]);
run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=red:size=64x48:d=0.1", "-frames:v", "1", "-c:v", "png", "-y", output("still.png")]);
run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=blue:size=64x48:d=0.1", "-frames:v", "1", "-c:v", "mjpeg", "-q:v", "3", "-y", output("still.jpg")]);

run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=0.6", "-c:a", "libmp3lame", "-b:a", "64k", "-y", output("audio.mp3")]);
run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=550:sample_rate=48000:duration=0.6", "-c:a", "aac", "-b:a", "64k", "-f", "adts", "-y", output("audio.aac")]);
run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=660:sample_rate=48000:duration=0.6", "-c:a", "pcm_s16le", "-y", output("audio-pcm.wav")]);
run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=770:sample_rate=8000:duration=0.6", "-ar", "8000", "-ac", "1", "-c:a", "pcm_mulaw", "-y", output("audio-mulaw.wav")]);

videoOnly("video-24fps.mp4", 24);
videoOnly("video-30fps.mp4", 30);
videoOnly("video-only.mp4", 20);
run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.6", "-vn", "-c:a", "pcm_s16le", "-y", output("audio-only.wav")]);
videoOnly("timebase-1k.mp4", 24, "160x90", "yuv420p", ["-video_track_timescale", "1000"]);
videoOnly("timebase-90k.mp4", 24, "160x90", "yuv420p", ["-video_track_timescale", "90000"]);
videoOnly("resolution-320x180.mp4", 24, "320x180");
videoOnly("pixfmt-yuv444p.mp4", 24, "160x90", "yuv444p");

run([
  "-hide_banner", "-loglevel", "error",
  "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.25",
  "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono:d=0.55",
  "-f", "lavfi", "-i", "sine=frequency=660:sample_rate=48000:duration=0.25",
  "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono:d=0.55",
  "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.25",
  "-filter_complex", "[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1[outa]",
  "-map", "[outa]", "-c:a", "pcm_s16le", "-y", output("speech-with-silence.wav"),
]);

for (const [name, color] of [["vfr-a.png", "red"], ["vfr-b.png", "green"], ["vfr-c.png", "blue"]]) {
  run(["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `color=c=${color}:size=64x48:d=0.1`, "-frames:v", "1", "-c:v", "png", "-y", output(name)]);
}
const vfrList = [
  "ffconcat version 1.0",
  "file vfr-a.png",
  "duration 0.04",
  "file vfr-b.png",
  "duration 0.12",
  "file vfr-c.png",
  "duration 0.08",
  "file vfr-c.png",
  "",
].join("\n");
await writeFile(path.join(outputDirectory, "vfr.ffconcat"), vfrList, "utf8");
run([
  "-hide_banner", "-loglevel", "error",
  "-f", "concat", "-safe", "0", "-i", "vfr.ffconcat",
  "-fps_mode", "vfr", "-an", "-c:v", "libx264", "-preset", "ultrafast", "-threads", "1",
  "-pix_fmt", "yuv420p", "-y", "video-vfr.mp4",
], { cwd: outputDirectory });

for (const file of ["vfr-a.png", "vfr-b.png", "vfr-c.png", "vfr.ffconcat"]) {
  await rm(output(file), { force: true });
}
await writeFile(path.join(outputDirectory, ".fixture-version"), String(manifest.generatorVersion) + "\n", "utf8");

if (!quiet) console.log(`Milestone 12 fixture generation: PASS (${manifest.fixtures.length} fixtures)`);
