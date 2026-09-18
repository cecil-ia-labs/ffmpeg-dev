import { rm } from "node:fs/promises";

for (const path of ["dist", "coverage", ".tmp", ".cache/ffmpeg-media-toolkit"]) {
  await rm(path, { recursive: true, force: true });
}
console.log("[codex cleanup] Generated build/test artifacts removed.");
