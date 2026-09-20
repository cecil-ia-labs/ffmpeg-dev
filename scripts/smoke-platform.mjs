import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(root, "dist", "cli.js");

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      "cecilia-ffmpeg " + args.join(" ") + " failed (" + String(result.status) + "):\n" +
      (result.stderr || result.stdout),
    );
  }
  return result.stdout;
}

const version = run(["--version"]).trim();
if (version !== "1.0.0") throw new Error("Expected CLI version 1.0.0, received " + version);

const help = run(["--help"]);
for (const token of ["Cecil-IA Labs · FFmpeg Media Toolkit", "doctor", "probe", "video", "audio", "image", "stream"]) {
  if (!help.includes(token)) throw new Error("Platform smoke help is missing: " + token);
}

const doctorText = run(["doctor", "--json"]);
let doctor;
try {
  doctor = JSON.parse(doctorText);
} catch (error) {
  throw new Error("doctor --json did not produce valid JSON.", { cause: error });
}

if (!doctor || typeof doctor !== "object") {
  throw new Error("doctor --json returned an invalid envelope.");
}

console.log("Platform smoke: PASS");
console.log("Platform: " + process.platform + "/" + process.arch);
console.log("Node: " + process.version);
