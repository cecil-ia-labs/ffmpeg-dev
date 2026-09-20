import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const skills = [
  "ffmpeg-environment",
  "ffmpeg-video-editing",
  "ffmpeg-audio",
  "ffmpeg-conversion",
  "ffmpeg-composition",
  "ffmpeg-streaming",
  "ffmpeg-diagnostics",
  "ffmpeg-pipelines",
  "ffmpeg-onboarding",
  "ffmpeg-workflow",
] as const;

const requiredHeadings = [
  "## Activation scope",
  "## Do not use",
  "## Required inputs",
  "## Preflight",
  "## Toolkit surface selection",
  "## Preferred toolkit commands",
  "## Native FFmpeg fallback",
  "## Output expectations",
  "## Validation",
  "## Error recovery",
  "## Safety and determinism",
  "## References",
] as const;

describe("professional skills catalog", () => {
  for (const skill of skills) {
    it(`${skill} is self-contained and has professional workflow sections`, async () => {
      const file = path.resolve("skills", skill, "SKILL.md");
      const text = await readFile(file, "utf8");
      expect(text).toMatch(new RegExp(`^---\\nname: ${skill}\\ndescription: .+\\n---`, "s"));
      expect(text).toContain("@cecilialabs/ffmpeg");
      expect(text).toContain("cecilia-ffmpeg");
      expect(text).toContain("npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg");
      expect(text).not.toContain("npx @cecilialabs/ffmpeg");
      for (const heading of requiredHeadings) expect(text).toContain(heading);
      expect(text).toMatch(/references\/[A-Za-z0-9-]+\.md/);
    });
  }

  it("installs the intended skill directories", async () => {
    expect(skills).toHaveLength(10);
  });
});
