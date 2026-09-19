import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, "test/fixtures/manifest.json"), "utf8"));
const generated = path.join(root, manifest.generatedDirectory);
const ffprobe = process.env.FFPROBE_PATH ?? "ffprobe";

function run(binary, args, cwd = root) {
  const result = spawnSync(binary, args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${binary} failed (${result.status ?? "unknown"}):\n${args.join(" ")}\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

run(process.execPath, [path.join(root, "scripts/generate-fixtures.mjs"), "--force", "--quiet"]);

function jsonProbe(file, extra = []) {
  return JSON.parse(run(ffprobe, ["-v", "error", ...extra, "-of", "json", file]));
}

function first(streams, type) {
  return (streams ?? []).find((stream) => stream.codec_type === type);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertExpected(id, kind, actual, expected) {
  assert(actual, `${id}: expected ${kind} stream`);
  for (const [key, value] of Object.entries(expected)) {
    const probeKey = ({
      codecName: "codec_name",
      width: "width",
      height: "height",
      pixelFormat: "pix_fmt",
      averageFrameRate: "avg_frame_rate",
      timeBase: "time_base",
      sampleRate: "sample_rate",
      channels: "channels",
    })[key];
    if (!probeKey) continue;
    const normalizedActual = ["sample_rate", "channels", "width", "height"].includes(probeKey) ? Number(actual[probeKey]) : actual[probeKey];
    assert(normalizedActual === value, `${id}: expected ${kind}.${key}=${value}, got ${normalizedActual}`);
  }
}

function readFrameTimes(file) {
  const raw = jsonProbe(file, ["-select_streams", "v:0", "-show_frames", "-show_entries", "frame=best_effort_timestamp_time"]);
  return (raw.frames ?? [])
    .map((frame) => Number(frame.best_effort_timestamp_time))
    .filter((value) => Number.isFinite(value));
}

for (const fixture of manifest.fixtures) {
  const file = path.join(generated, fixture.file);
  const raw = jsonProbe(file, ["-show_streams", "-show_format"]);
  const video = first(raw.streams, "video");
  const audio = first(raw.streams, "audio");

  if (fixture.expected.video === false) assert(!video, `${fixture.id}: unexpected video stream`);
  else if (fixture.expected.video) assertExpected(fixture.id, "video", video, fixture.expected.video);

  if (fixture.expected.audio === false) assert(!audio, `${fixture.id}: unexpected audio stream`);
  else if (fixture.expected.audio) assertExpected(fixture.id, "audio", audio, fixture.expected.audio);

  if (fixture.expected.framesMin) {
    const frameCount = readFrameTimes(file).length;
    assert(frameCount >= fixture.expected.framesMin, `${fixture.id}: expected at least ${fixture.expected.framesMin} video frames, got ${frameCount}`);
  }

  if (fixture.expected.vfr) {
    const times = readFrameTimes(file);
    const deltas = times.slice(1).map((value, index) => Number((value - times[index]).toFixed(6))).filter((value) => value > 0);
    const unique = new Set(deltas.map((value) => value.toFixed(6)));
    assert(unique.size >= 2, `${fixture.id}: expected variable frame durations, got ${[...unique].join(", ")}`);
  }
}

console.log(`Milestone 12 fixture matrix: PASS (${manifest.fixtures.length} fixtures verified with FFprobe)`);
