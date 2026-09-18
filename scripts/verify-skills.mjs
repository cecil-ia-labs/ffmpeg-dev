import { readFile, stat } from "node:fs/promises";

const skills = [
  "ffmpeg-environment",
  "ffmpeg-video-editing",
  "ffmpeg-audio",
  "ffmpeg-conversion",
  "ffmpeg-composition",
  "ffmpeg-streaming",
  "ffmpeg-diagnostics",
];

const requiredSections = [
  "## Activation scope",
  "## Do not use",
  "## Required inputs",
  "## Preflight",
  "## Preferred toolkit commands",
  "## Native FFmpeg fallback",
  "## Output expectations",
  "## Validation",
  "## Error recovery",
  "## Safety and determinism",
  "## References",
];

for (const skill of skills) {
  const url = new URL(`../skills/${skill}/SKILL.md`, import.meta.url);
  const text = await readFile(url, "utf8");
  if (!text.startsWith(`---\nname: ${skill}\ndescription:`)) {
    throw new Error(`${skill}: invalid or missing YAML front matter`);
  }
  if (!text.includes("@cecilialabs/ffmpeg")) {
    throw new Error(`${skill}: missing toolkit preference`);
  }
  for (const section of requiredSections) {
    if (!text.includes(section)) throw new Error(`${skill}: missing section ${section}`);
  }

  const referenceMatch = /references\/([A-Za-z0-9-]+\.md)/.exec(text);
  if (!referenceMatch?.[1]) throw new Error(`${skill}: no reference document declared`);
  const reference = new URL(`../skills/${skill}/references/${referenceMatch[1]}`, import.meta.url);
  const info = await stat(reference);
  if (!info.isFile() || info.size === 0) throw new Error(`${skill}: reference is empty`);
}

console.log(`Milestone 10 professional skills: PASS (${skills.length} skills)`);
