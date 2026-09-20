import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const skillScripts = {
  "ffmpeg-onboarding": ["check.mjs", "install.mjs"],
  "ffmpeg-environment": ["inspect.mjs"],
  "ffmpeg-video-editing": ["run.mjs"],
  "ffmpeg-audio": ["run.mjs"],
  "ffmpeg-conversion": ["run.mjs"],
  "ffmpeg-composition": ["run.mjs"],
  "ffmpeg-streaming": ["run.mjs"],
  "ffmpeg-diagnostics": ["run.mjs"],
  "ffmpeg-pipelines": ["run.mjs"],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const shared = await readFile(path.join(root, "src/skill-scripts/shared.ts"), "utf8");
assert(shared.includes("readSkillScriptRequest"), "Shared Skill script adapter must read the JSON request contract.");
assert(shared.includes("runSkillScript"), "Shared Skill script adapter must use the shared runner.");

let count = 0;
for (const [skill, filenames] of Object.entries(skillScripts)) {
  const skillFile = path.join(root, "skills", skill, "SKILL.md");
  const skillText = await readFile(skillFile, "utf8");
  const scriptDirectory = path.join(root, "skills", skill, "scripts");
  const discovered = (await readdir(scriptDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mjs"))
    .map((entry) => entry.name)
    .sort();
  assert(
    JSON.stringify(discovered) === JSON.stringify([...filenames].sort()),
    `${skill}: associated script catalog mismatch`,
  );

  for (const filename of filenames) {
    const relative = `skills/${skill}/scripts/${filename}`;
    const file = path.join(root, relative);
    const info = await stat(file);
    assert(info.isFile(), `Missing Skill script: ${relative}`);
    if (process.platform !== "win32") assert((info.mode & 0o111) !== 0, `${relative} must be executable.`);
    const source = await readFile(file, "utf8");
    assert(source.startsWith("#!/usr/bin/env node"), `${relative} must be directly executable with Node.`);
    assert(
      source.includes("executeSkillScript") || source.includes("runSkillScript"),
      `${relative} must use the shared Skill script adapter or runner.`,
    );
    assert(!source.includes("shell: true"), `${relative} must not enable shell execution.`);
    assert(!/child_process|execSync|spawnSync/.test(source), `${relative} must not invoke a shell process directly.`);
    assert(skillText.includes(`scripts/${filename}`), `${skill}: SKILL.md must declare ${filename}.`);
    count += 1;
  }
}

const examples = await readFile(path.join(root, "docs/skill-request-examples.md"), "utf8");
assert(examples.includes("skill-result-envelope.schema.json"), "Skill examples must link the result envelope schema.");
assert(examples.includes("ffmpeg-workflow"), "Skill examples must include behavioral routing.");

console.log(`Skill script contract: PASS (${count} scripts across ${Object.keys(skillScripts).length} Skills)`);
