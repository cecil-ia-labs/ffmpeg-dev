#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || { echo "Node.js is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required." >&2; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "zip is required to build the OpenAI submission archive." >&2; exit 1; }
command -v unzip >/dev/null 2>&1 || { echo "unzip is required to inspect the OpenAI submission archive." >&2; exit 1; }

VERSION="$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version")"
PACK_ROOT="$ROOT_DIR/.openai-pack"
PLUGIN_ROOT="$PACK_ROOT/cecilialabs-ffmpeg"
ARCHIVE="$PACK_ROOT/cecilialabs-ffmpeg-openai-v${VERSION}.zip"

echo "Validating canonical plugin metadata..."
npm run verify:plugin
npm run build

rm -rf "$PACK_ROOT"
mkdir -p "$PLUGIN_ROOT/assets"

cp "$ROOT_DIR/plugin.json" "$PLUGIN_ROOT/plugin.json"
cp "$ROOT_DIR/LICENSE" "$PLUGIN_ROOT/LICENSE"
cp "$ROOT_DIR/README.md" "$PLUGIN_ROOT/README.md"
cp -R "$ROOT_DIR/assets/." "$PLUGIN_ROOT/assets/"
cp -R "$ROOT_DIR/docs" "$PLUGIN_ROOT/docs"
cp -R "$ROOT_DIR/dist" "$PLUGIN_ROOT/dist"
cp -R "$ROOT_DIR/skills" "$PLUGIN_ROOT/skills"

if find "$PLUGIN_ROOT" -type l -print -quit | grep -q .; then
  echo "Submission bundle must not contain symbolic links." >&2
  exit 1
fi

if find "$PLUGIN_ROOT/skills" -mindepth 1 -maxdepth 1 ! -type d -print -quit | grep -q .; then
  echo "Skills-only submission requires directories directly under skills/." >&2
  exit 1
fi

for forbidden in .app.json; do
  if find "$PLUGIN_ROOT" -name "$forbidden" -print -quit | grep -q .; then
    echo "Skills-only submission must not contain $forbidden." >&2
    exit 1
  fi
done

node --input-type=module - "$PLUGIN_ROOT/plugin.json" <<'NODE'
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = process.argv[2];
const plugin = JSON.parse(await readFile(manifestPath, "utf8"));
const openai = plugin.extensions?.["com.openai"];
const ui = openai?.interface;

if (!ui) throw new Error("Missing extensions.com.openai.interface.");
if (openai.apps !== undefined) throw new Error("Skills-only bundle must not declare extensions.com.openai.apps.");
if (ui.screenshots !== undefined) throw new Error("Skills-only bundle must not declare interface.screenshots.");
if (plugin.name !== "cecilialabs-ffmpeg") throw new Error(`Unexpected plugin name: ${plugin.name}.`);
if (typeof plugin.version !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(plugin.version)) {
  throw new Error(`Plugin version is not valid semver: ${plugin.version}.`);
}

const root = path.dirname(manifestPath);
const localPaths = [
  openaiInterfacePath(plugin, "branding", "icon"),
  openaiInterfacePath(plugin, "branding", "iconDark"),
  openaiInterfacePath(plugin, "branding", "logo"),
  ...(plugin.extensions?.["com.cecilialabs.ffmpeg"]?.branding?.screenshots ?? []),
  plugin.extensions?.["com.cecilialabs.ffmpeg"]?.documentation?.readme,
  plugin.extensions?.["com.cecilialabs.ffmpeg"]?.documentation?.skills,
  plugin.extensions?.["com.cecilialabs.ffmpeg"]?.documentation?.packaging,
  ...(plugin.extensions?.["com.cecilialabs.ffmpeg"]?.skillCatalog ?? []).map((entry) => entry.path),
].filter((value) => typeof value === "string");

for (const relative of localPaths) {
  if (!relative.startsWith("./")) throw new Error(`Plugin path is not relative: ${relative}`);
  await access(path.resolve(root, relative));
}

function openaiInterfacePath(value, group, field) {
  return value.extensions?.["com.cecilialabs.ffmpeg"]?.[group]?.[field];
}
NODE

(
  cd "$PACK_ROOT"
  zip -qr "$ARCHIVE" "cecilialabs-ffmpeg"
)

VERIFY_ROOT="$PACK_ROOT/verify"
mkdir -p "$VERIFY_ROOT"
unzip -q "$ARCHIVE" -d "$VERIFY_ROOT"
node --input-type=module - "$VERIFY_ROOT/cecilialabs-ffmpeg" <<'NODE'
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.argv[2];

function run(relative, request) {
  const result = spawnSync(process.execPath, [path.join(root, relative)], {
    cwd: root,
    encoding: "utf8",
    input: JSON.stringify(request) + "\n",
    shell: false,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${relative} failed (${String(result.status)}): ${result.stderr || result.stdout}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${relative} did not emit one JSON envelope.`, { cause: error });
  }
}

const onboarding = run("skills/ffmpeg-onboarding/scripts/check.mjs", { context: "codex", input: {} });
if (onboarding.operation !== "environment.check") throw new Error("Bundled onboarding operation mismatch.");
if (typeof onboarding.status !== "string") throw new Error("Bundled onboarding did not emit a status.");

const dryRun = run("skills/ffmpeg-audio/scripts/run.mjs", {
  context: "codex",
  dryRun: true,
  input: { action: "silence", duration: 0.1, output: "bundle-smoke.wav" },
});
if (dryRun.status !== "planned" || dryRun.output?.planned !== true) {
  throw new Error("Bundled Skill dry-run did not preserve planned state.");
}
if (dryRun.artifacts?.some((artifact) => artifact.verified === true)) {
  throw new Error("Bundled Skill dry-run claimed a verified artifact.");
}

const pipeline = run("skills/ffmpeg-pipelines/scripts/run.mjs", {
  context: "codex",
  input: {
    action: "validate",
    document: {
      version: 1,
      input: "missing.mp4",
      steps: [{ trim: { start: 0 } }],
      output: { path: "planned.mp4", codec: "h264" },
    },
  },
});
if (pipeline.artifacts?.length !== 0) throw new Error("Pipeline validation fabricated an artifact.");

console.log("Extracted OpenAI plugin Skill smoke: PASS");
NODE

BYTES="$(wc -c < "$ARCHIVE" | tr -d ' ')"
MAX_BYTES=$((100 * 1024 * 1024))
if (( BYTES > MAX_BYTES )); then
  echo "OpenAI submission archive exceeds 100 MiB." >&2
  exit 1
fi

echo
echo "OpenAI Skills-only plugin bundle ready:"
echo "  $ARCHIVE"
echo
echo "Archive contents:"
unzip -l "$ARCHIVE"
