import { spawnSync } from "node:child_process";

function run(command, args = []) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("[codex setup] Node");
run(process.execPath, ["--version"]);
console.log("[codex setup] npm");
run("npm", ["--version"]);
console.log("[codex setup] FFmpeg");
run("ffmpeg", ["-version"]);
console.log("[codex setup] FFprobe");
run("ffprobe", ["-version"]);
console.log("[codex setup] Installing dependencies");
run("npm", ["install"]);
console.log("[codex setup] Initial build");
run("npm", ["run", "build"]);
console.log("[codex setup] Complete");
