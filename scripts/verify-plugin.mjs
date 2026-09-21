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
  "ffmpeg-pipelines",
  "ffmpeg-onboarding",
  "ffmpeg-workflow",
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
assert(plugin.name === "cecilialabs-ffmpeg", "Unexpected plugin name");
assert(plugin.version === pkg.version, "Plugin/package version mismatch");
for (const key of Object.keys(plugin)) assert(allowedTopLevel.has(key), `Non-portable top-level plugin.json field: ${key}`);

const authorKeys = Object.keys(plugin.author ?? {});
for (const key of authorKeys) assert(["name", "email", "url"].includes(key), `Invalid plugin author field: ${key}`);
assert(plugin.repository === "https://github.com/cecil-ia-labs/ffmpeg-dev", "Unexpected repository metadata");
assert(plugin.license === "MIT", "Plugin license must remain MIT");

const extension = plugin.extensions?.["com.cecilialabs.ffmpeg"];
assert(extension && typeof extension === "object", "Missing com.cecilialabs.ffmpeg extension metadata");
assert(extension.branding?.displayName === "Cecil-IA Labs FFmpeg", "Unexpected branding display name");
assert(extension.npm?.package === "@cecilialabs/ffmpeg", "Unexpected npm package identity");
assert(extension.npm?.binary === "cecilia-ffmpeg", "Unexpected CLI binary identity");
assert(extension.mcp === undefined, "Plugin metadata must not expose a removed MCP extension");
assert(!JSON.stringify(plugin).toLowerCase().includes("mcp"), "Plugin metadata contains a removed MCP surface");
assert(extension.hardware?.fallback === "software", "Hardware metadata must preserve software fallback");
assert(extension.hardware?.runtimeProbe === true, "Hardware metadata must declare runtime probing");
assert(extension.hardware?.modes?.includes("auto"), "Hardware metadata must expose auto mode");
assert(extension.hardware?.codecs?.h264?.includes("nvenc"), "Hardware metadata must expose H.264 NVENC");
assert(extension.hardware?.codecs?.vp9?.includes("qsv"), "Hardware metadata must expose VP9 Quick Sync");

const openai = plugin.extensions?.["com.openai"];
assert(openai && typeof openai === "object", "Missing com.openai extension metadata");
assert(openai.apps === undefined, "Skills-only OpenAI submission must not declare apps");
const openaiInterface = openai.interface;
assert(openaiInterface && typeof openaiInterface === "object", "Missing OpenAI interface metadata");
assert(openaiInterface.displayName === "Cecil-IA Labs FFmpeg", "Unexpected OpenAI display name");
assert(openaiInterface.displayName.length <= 30, "OpenAI display name exceeds 30 characters");
assert(typeof openaiInterface.shortDescription === "string" && openaiInterface.shortDescription.length > 0, "Missing OpenAI short description");
assert(openaiInterface.shortDescription.length <= 30, "OpenAI short description exceeds 30 characters");
assert(typeof openaiInterface.longDescription === "string" && openaiInterface.longDescription.length > 0, "Missing OpenAI long description");
assert(openaiInterface.longDescription.length <= 4000, "OpenAI long description exceeds 4000 characters");
assert(openaiInterface.developerName === plugin.author?.name, "OpenAI developerName must match author.name");
assert(openaiInterface.developerName.length <= 80, "OpenAI developer name exceeds 80 characters");
assert([
  "Productivity",
  "Creativity",
  "Developer Tools",
  "Business & Operations",
  "Data & Analytics",
  "Communication",
  "Education & Research",
  "Security",
  "Finance",
  "Healthcare",
  "Travel",
  "Entertainment",
  "Other",
].includes(openaiInterface.category), "Unsupported OpenAI plugin category");
assert(Array.isArray(openaiInterface.capabilities) && openaiInterface.capabilities.length > 0, "OpenAI capabilities are required");
assert(openaiInterface.capabilities.length <= 20, "OpenAI capabilities exceed 20 entries");
for (const capability of openaiInterface.capabilities) {
  assert(typeof capability === "string" && capability.trim().length > 0, "OpenAI capability must be non-empty");
  assert(capability.length <= 120, "OpenAI capability exceeds 120 characters");
  assert(!/[\r\n]/.test(capability), "OpenAI capability must be one line");
}
assert(Array.isArray(openaiInterface.defaultPrompt) && openaiInterface.defaultPrompt.length <= 3, "OpenAI default prompts exceed 3 entries");
for (const prompt of openaiInterface.defaultPrompt) {
  assert(typeof prompt === "string" && prompt.trim().length > 0, "OpenAI default prompt must be non-empty");
  assert(prompt.length <= 128, "OpenAI default prompt exceeds 128 characters");
  assert(!/[\r\n]/.test(prompt), "OpenAI default prompt must be one line");
  assert(!prompt.includes("@"), "OpenAI default prompt must not contain MCP @mentions");
}
assert(openaiInterface.websiteURL?.startsWith("https://"), "OpenAI websiteURL must use HTTPS");
assert(openaiInterface.screenshots === undefined, "Skills-only OpenAI submission must not declare screenshots");
assert(openaiInterface.composerIcon === "./assets/icon.svg", "OpenAI composer icon must use the square plugin icon");
assert(openaiInterface.logo === "./assets/icon.svg", "OpenAI logo must use the square plugin icon");
await assertContained(openaiInterface.composerIcon);
await assertContained(openaiInterface.logo);

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
