import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const allowedTopLevel = new Set([
  "$schema", "name", "version", "description", "author", "homepage",
  "repository", "license", "keywords", "extensions",
]);
const expectedSkills = [
  "ffmpeg-environment",
  "ffmpeg-video-editing",
  "ffmpeg-audio",
  "ffmpeg-conversion",
  "ffmpeg-composition",
  "ffmpeg-streaming",
  "ffmpeg-diagnostics",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

function localPaths(extension) {
  return [
    extension.branding?.icon,
    extension.branding?.iconDark,
    extension.branding?.logo,
    ...(extension.branding?.screenshots ?? []),
    extension.documentation?.readme,
    extension.documentation?.skills,
    extension.documentation?.packaging,
    ...(extension.skillCatalog ?? []).map((entry) => entry.path),
  ].filter((value) => typeof value === "string");
}

async function assertContained(relative) {
  assert(relative.startsWith("./"), `Plugin-relative path must begin with ./: ${relative}`);
  const absolute = path.resolve(root, relative);
  const rootReal = await realpath(root);
  const info = await lstat(absolute);
  assert(!info.isSymbolicLink(), `Plugin distribution path must not be a symlink: ${relative}`);
  const targetReal = await realpath(absolute);
  assert(targetReal === rootReal || targetReal.startsWith(`${rootReal}${path.sep}`), `Path escapes plugin root: ${relative}`);
  assert((await stat(absolute)).isFile(), `Expected plugin file: ${relative}`);
}

const plugin = await readJson("plugin.json");
const pkg = await readJson("package.json");

assert(plugin.$schema === "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "Unexpected Agent Plugins schema");
assert(plugin.name === "ffmpeg-media-toolkit", "Unexpected plugin name");
assert(plugin.version === pkg.version, "Plugin/package version mismatch");
for (const key of Object.keys(plugin)) assert(allowedTopLevel.has(key), `Non-portable top-level plugin.json field: ${key}`);

const authorKeys = Object.keys(plugin.author ?? {});
for (const key of authorKeys) assert(["name", "email", "url"].includes(key), `Invalid plugin author field: ${key}`);
assert(plugin.repository === "https://github.com/cecil-ia-labs/ffmpeg-dev", "Unexpected repository metadata");
assert(plugin.license === "MIT", "Plugin license must remain MIT");

const extension = plugin.extensions?.["com.cecilialabs.ffmpeg"];
assert(extension && typeof extension === "object", "Missing com.cecilialabs.ffmpeg extension metadata");
assert(extension.branding?.displayName === "FFmpeg Media Toolkit", "Unexpected branding display name");
assert(extension.npm?.package === "@cecilialabs/ffmpeg", "Unexpected npm package identity");
assert(extension.npm?.binary === "cecilia-ffmpeg", "Unexpected CLI binary identity");
assert(extension.mcp?.binary === "cecilia-ffmpeg-mcp", "Unexpected MCP binary identity");
assert(extension.mcp?.transport === "stdio", "Milestone 16 MCP transport must be stdio");
assert(extension.mcp?.protocol === "2026-07-28", "Unexpected MCP protocol revision");
assert(Array.isArray(extension.mcp?.tools) && extension.mcp.tools.length === 9, "Unexpected MCP tool catalog");

for (const relative of localPaths(extension)) await assertContained(relative);

const discoveredSkills = (await readdir(path.join(root, "skills"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const catalogSkills = (extension.skillCatalog ?? []).map((entry) => entry.name).sort();
assert(JSON.stringify(discoveredSkills) === JSON.stringify([...expectedSkills].sort()), "Unexpected discovered skill directory set");
assert(JSON.stringify(catalogSkills) === JSON.stringify([...expectedSkills].sort()), "Plugin extension skill catalog mismatch");

for (const file of ["assets/icon.svg", "assets/icon-dark.svg", "assets/logo.svg"]) {
  const svg = await readFile(path.join(root, file), "utf8");
  assert(svg.includes("<svg"), `${file} is not SVG`);
  assert(!/<script\b/i.test(svg), `${file} must not contain scripts`);
  assert(!/(?:href|src)\s*=\s*["']https?:/i.test(svg), `${file} must not reference remote resources`);
}
for (const file of ["assets/icon.svg", "assets/icon-dark.svg"]) {
  const svg = await readFile(path.join(root, file), "utf8");
  assert(/viewBox=["']0 0 128 128["']/.test(svg), `${file} must use a 128×128 viewBox`);
}

for (const required of ["dist/", "assets/", "skills/", "specs/", "docs/", "plugin.json", "README.md", "LICENSE", "CHANGELOG.md"]) {
  assert(pkg.files?.includes(required), `package.json files allowlist is missing ${required}`);
}

console.log(`Milestone 11 plugin packaging structure: PASS (${expectedSkills.length} skills)`);
