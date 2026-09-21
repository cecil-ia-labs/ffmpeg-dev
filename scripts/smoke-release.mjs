#!/usr/bin/env node

import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(root, "dist", "cli.js");
const environmentSkill = path.join(root, "skills", "ffmpeg-environment", "scripts", "inspect.mjs");
const videoSkill = path.join(root, "skills", "ffmpeg-video-editing", "scripts", "run.mjs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    input: options.input,
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${String(result.status)}):\n${result.stderr || result.stdout}`,
    );
  }
  return result;
}

function runCli(args) {
  return run(process.execPath, [cli, ...args]);
}

function parseJson(label, output) {
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`${label} did not emit valid JSON on stdout.`, { cause: error });
  }
}

function assertCliEnvelope(label, envelope) {
  assert(envelope && typeof envelope === "object", `${label} returned an invalid envelope.`);
  assert(envelope.ok === true, `${label} returned a failed envelope.`);
  assert(typeof envelope.data === "object" && envelope.data !== null, `${label} returned no data.`);
}

function assertSkillEnvelope(label, envelope) {
  assert(envelope && typeof envelope === "object", `${label} returned an invalid envelope.`);
  assert(envelope.ok === true, `${label} returned a failed envelope.`);
  assert(envelope.status === "completed", `${label} did not complete.`);
  assert(
    typeof envelope.output === "object" && envelope.output !== null,
    `${label} returned no output.`,
  );
}

async function assertArtifact(file, label) {
  const info = await stat(file);
  assert(info.isFile() && info.size > 0, `${label} is missing or empty.`);
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "cecilia-ffmpeg-release-smoke-"));

try {
  const doctor = parseJson("doctor", runCli(["doctor", "--json"]).stdout);
  assertCliEnvelope("doctor", doctor);
  assert(doctor.data.planned === false, "doctor must execute against the real environment.");
  assert(doctor.data.status !== "error", "doctor reported an unusable FFmpeg environment.");
  assert(
    doctor.data.versions?.compatible === true,
    "doctor did not confirm the supported FFmpeg version.",
  );

  const readiness = parseJson(
    "environment check",
    runCli(["environment", "check", "--json"]).stdout,
  );
  assertCliEnvelope("environment check", readiness);
  assert(readiness.data.status === "ready", "environment check did not report ready.");
  assert(readiness.data.ffmpeg?.available === true, "environment check did not find FFmpeg.");
  assert(readiness.data.ffprobe?.available === true, "environment check did not find FFprobe.");

  const source = path.join(temporaryRoot, "release smoke source.mp4");
  const cliOutput = path.join(temporaryRoot, "release smoke cli output.mp4");
  const pipelineOutput = path.join(temporaryRoot, "release smoke pipeline output.mp4");
  const skillOutput = path.join(temporaryRoot, "release smoke skill output.mp4");
  const pipelineFile = path.join(temporaryRoot, "release smoke pipeline.yaml");

  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-nostdin",
    "-f",
    "lavfi",
    "-i",
    "color=c=red:s=160x90:r=12",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:sample_rate=48000",
    "-t",
    "1.2",
    "-c:v",
    "mpeg4",
    "-c:a",
    "aac",
    "-shortest",
    "-y",
    source,
  ]);
  await assertArtifact(source, "Generated smoke input");

  const probe = parseJson("probe", runCli(["probe", source, "--json"]).stdout);
  assertCliEnvelope("probe", probe);
  assert(
    probe.data.media?.streams?.length >= 2,
    "probe did not observe the generated audio/video streams.",
  );

  const cliTrim = parseJson(
    "video trim",
    runCli([
      "video",
      "trim",
      source,
      "--start",
      "0.2",
      "--duration",
      "0.6",
      "--mode",
      "accurate",
      "--output",
      cliOutput,
      "--no-progress",
      "--json",
    ]).stdout,
  );
  assertCliEnvelope("video trim", cliTrim);
  assert(cliTrim.data.planned === false, "video trim returned a plan instead of executing.");
  await assertArtifact(cliOutput, "CLI smoke output");
  assert(cliTrim.data.outputMedia?.video?.length >= 1, "video trim did not verify a video stream.");

  await writeFile(
    pipelineFile,
    [
      "version: 1",
      `input: ${JSON.stringify(source)}`,
      "steps:",
      "  - trim:",
      "      start: 0.1",
      "      duration: 0.5",
      "      mode: accurate",
      "output:",
      `  path: ${JSON.stringify(pipelineOutput)}`,
      "  codec: h264",
      "",
    ].join("\n"),
    "utf8",
  );

  const pipelineValidation = parseJson(
    "pipeline validation",
    runCli(["pipeline", pipelineFile, "validate", "--json"]).stdout,
  );
  assertCliEnvelope("pipeline validation", pipelineValidation);
  assert(
    pipelineValidation.data.operation === "pipeline.validate",
    "pipeline validation used the wrong operation.",
  );
  assert(
    pipelineValidation.data.stepCount === 1,
    "pipeline validation did not parse the trim step.",
  );

  const pipelineRun = parseJson(
    "pipeline run",
    runCli(["pipeline", pipelineFile, "run", "--no-progress", "--json"]).stdout,
  );
  assertCliEnvelope("pipeline run", pipelineRun);
  assert(pipelineRun.data.planned === false, "pipeline run returned a plan instead of executing.");
  await assertArtifact(pipelineOutput, "Pipeline smoke output");

  const environmentSkillResult = parseJson(
    "environment Skill",
    run(process.execPath, [environmentSkill], {
      input: JSON.stringify({ context: "terminal", input: { action: "doctor" } }) + "\n",
    }).stdout,
  );
  assertSkillEnvelope("environment Skill", environmentSkillResult);
  assert(
    environmentSkillResult.output.planned === false,
    "environment Skill returned a plan instead of executing.",
  );
  assert(
    environmentSkillResult.output.status !== "error",
    "environment Skill reported an unusable environment.",
  );

  const videoSkillResult = parseJson(
    "video Skill",
    run(process.execPath, [videoSkill], {
      input:
        JSON.stringify({
          context: "terminal",
          input: {
            action: "trim",
            input: source,
            start: 0.15,
            duration: 0.45,
            mode: "accurate",
            output: skillOutput,
          },
        }) + "\n",
    }).stdout,
  );
  assertSkillEnvelope("video Skill", videoSkillResult);
  assert(
    videoSkillResult.output.planned === false,
    "video Skill returned a plan instead of executing.",
  );
  await assertArtifact(skillOutput, "Skill smoke output");

  console.log("Release smoke: PASS");
  console.log(`Version: ${packageJson.version}`);
  console.log(`Platform: ${process.platform}/${process.arch}`);
  console.log(
    "Environment, media, namespaced pipeline, and Skill-script flows executed successfully.",
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
