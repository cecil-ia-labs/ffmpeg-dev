import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

interface SkillCatalogEntry {
  name: string;
  path: string;
}

interface PluginExtension {
  branding: {
    displayName: string;
    icon: string;
    iconDark: string;
    logo: string;
    screenshots: string[];
  };
  documentation: {
    readme: string;
    skills: string;
    packaging: string;
  };
  skillCatalog: SkillCatalogEntry[];
  npm: { package: string; binary: string };
}

interface PluginManifest {
  $schema: string;
  name: string;
  version: string;
  repository?: string;
  license?: string;
  extensions?: Record<string, PluginExtension>;
}

const root = process.cwd();
const expectedSkills = [
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
];

async function manifest(): Promise<PluginManifest> {
  return JSON.parse(await readFile(path.join(root, "plugin.json"), "utf8")) as PluginManifest;
}

describe("Milestone 11 plugin package", () => {
  it("keeps portable manifest fields schema-conformant", async () => {
    const plugin = await manifest();
    const keys = Object.keys(plugin);
    const allowed = [
      "$schema", "name", "version", "description", "author", "homepage",
      "repository", "license", "keywords", "extensions",
    ];
    expect(keys.every((key) => allowed.includes(key))).toBe(true);
    expect(plugin.$schema).toBe("https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
    expect(plugin.repository).toBe("https://github.com/cecil-ia-labs/ffmpeg-dev");
    expect(plugin.license).toBe("MIT");
  });

  it("catalogs exactly the ten discoverable skills", async () => {
    const plugin = await manifest();
    const extension = plugin.extensions?.["com.cecilialabs.ffmpeg"];
    expect(extension).toBeDefined();
    const discovered = (await readdir(path.join(root, "skills"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(discovered).toEqual([...expectedSkills].sort());
    expect(extension?.skillCatalog.map((entry) => entry.name).sort()).toEqual([...expectedSkills].sort());
  });

  it("ships all manifest-referenced local files", async () => {
    const plugin = await manifest();
    const extension = plugin.extensions?.["com.cecilialabs.ffmpeg"];
    expect(extension).toBeDefined();
    if (!extension) return;
    const paths = [
      extension.branding.icon, extension.branding.iconDark, extension.branding.logo,
      ...extension.branding.screenshots,
      extension.documentation.readme, extension.documentation.skills, extension.documentation.packaging,
      ...extension.skillCatalog.map((entry) => entry.path),
    ];
    for (const relative of paths) {
      expect(relative.startsWith("./")).toBe(true);
      expect((await stat(path.resolve(root, relative))).isFile()).toBe(true);
    }
  });

  it("uses scalable self-contained icon assets", async () => {
    for (const file of ["assets/icon.svg", "assets/icon-dark.svg"]) {
      const svg = await readFile(path.join(root, file), "utf8");
      expect(svg).toMatch(/viewBox=["']0 0 128 128["']/);
      expect(svg).not.toMatch(/<script\b/i);
      expect(svg).not.toMatch(/(?:href|src)\s*=\s*["']https?:/i);
    }
  });
});
