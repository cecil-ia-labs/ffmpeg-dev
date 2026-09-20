import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const scripts = [
  "skills/ffmpeg-onboarding/scripts/check.mjs",
  "skills/ffmpeg-onboarding/scripts/install.mjs",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const relative of scripts) {
  const file = path.join(root, relative);
  const info = await stat(file);
  assert(info.isFile(), `Missing Skill script: ${relative}`);
  if (process.platform !== "win32")
    assert((info.mode & 0o111) !== 0, `${relative} must be executable.`);
  const source = await readFile(file, "utf8");
  assert(
    source.startsWith("#!/usr/bin/env node"),
    `${relative} must be directly executable with Node.`,
  );
  assert(source.includes("runSkillScript"), `${relative} must use the shared Skill script runner.`);
  assert(
    source.includes("readSkillScriptRequest"),
    `${relative} must read the JSON request contract.`,
  );
  assert(!source.includes("shell: true"), `${relative} must not enable shell execution.`);
  assert(
    !/child_process|execSync|spawnSync/.test(source),
    `${relative} must use the shared process runtime.`,
  );
}

const onboarding = await readFile(path.join(root, "skills/ffmpeg-onboarding/SKILL.md"), "utf8");
assert(onboarding.includes("scripts/check.mjs"), "Onboarding Skill must declare its check script.");
assert(
  onboarding.includes("scripts/install.mjs"),
  "Onboarding Skill must declare its install script.",
);

console.log(`Skill script contract: PASS (${scripts.length} scripts)`);
