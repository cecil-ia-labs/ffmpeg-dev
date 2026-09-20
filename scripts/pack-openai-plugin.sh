#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || { echo "Node.js is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required." >&2; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "zip is required to build the OpenAI submission archive." >&2; exit 1; }

VERSION="$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version")"
PACK_ROOT="$ROOT_DIR/.openai-pack"
PLUGIN_ROOT="$PACK_ROOT/ffmpeg-media-toolkit"
ARCHIVE="$PACK_ROOT/ffmpeg-media-toolkit-openai-v${VERSION}.zip"

echo "Validating canonical plugin metadata..."
npm run verify:plugin

rm -rf "$PACK_ROOT"
mkdir -p "$PLUGIN_ROOT/assets"

cp "$ROOT_DIR/plugin.json" "$PLUGIN_ROOT/plugin.json"
cp "$ROOT_DIR/LICENSE" "$PLUGIN_ROOT/LICENSE"
cp "$ROOT_DIR/assets/icon.svg" "$PLUGIN_ROOT/assets/icon.svg"
cp -R "$ROOT_DIR/skills" "$PLUGIN_ROOT/skills"

if find "$PLUGIN_ROOT" -type l -print -quit | grep -q .; then
  echo "Submission bundle must not contain symbolic links." >&2
  exit 1
fi

for forbidden in mcp.json .mcp.json .app.json; do
  if find "$PLUGIN_ROOT" -name "$forbidden" -print -quit | grep -q .; then
    echo "Skills-only submission must not contain $forbidden." >&2
    exit 1
  fi
done

node --input-type=module - "$PLUGIN_ROOT/plugin.json" <<'NODE'
import { readFile } from "node:fs/promises";

const manifestPath = process.argv[2];
const plugin = JSON.parse(await readFile(manifestPath, "utf8"));
const openai = plugin.extensions?.["com.openai"];
const ui = openai?.interface;

if (!ui) throw new Error("Missing extensions.com.openai.interface.");
if (openai.apps !== undefined) throw new Error("Skills-only bundle must not declare extensions.com.openai.apps.");
if (ui.screenshots !== undefined) throw new Error("Skills-only bundle must not declare interface.screenshots.");
if (plugin.version !== "1.3.0") throw new Error(`Expected plugin version 1.3.0, received ${plugin.version}.`);
NODE

(
  cd "$PACK_ROOT"
  zip -qr "$ARCHIVE" "ffmpeg-media-toolkit"
)

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
