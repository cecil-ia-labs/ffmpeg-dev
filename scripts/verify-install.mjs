import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npmBinary = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      command + " " + args.join(" ") + " failed (" + String(result.status) + "):\n" +
      (result.stderr || result.stdout),
    );
  }
  return result;
}

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cecilia-ffmpeg-install-"));

try {
  const packDir = path.join(tempRoot, "pack");
  const installDir = path.join(tempRoot, "consumer");
  await mkdir(packDir, { recursive: true });
  await mkdir(installDir, { recursive: true });

  const packed = run(
    npmBinary,
    ["pack", "--ignore-scripts", "--json", "--pack-destination", packDir],
    root,
  );

  const report = JSON.parse(packed.stdout);
  const filename = report?.[0]?.filename;
  if (!filename) throw new Error("npm pack did not return a tarball filename.");

  const tarball = path.join(packDir, filename);

  await writeFile(
    path.join(installDir, "package.json"),
    JSON.stringify({ name: "cecilia-ffmpeg-clean-install-smoke", private: true, type: "module" }, null, 2),
    "utf8",
  );

  run(
    npmBinary,
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", tarball],
    installDir,
  );

  const version = run(
    npmBinary,
    ["exec", "--offline", "--", "cecilia-ffmpeg", "--version"],
    installDir,
  ).stdout.trim();
  if (version !== "1.0.0") {
    throw new Error("Clean-install CLI version mismatch: expected 1.0.0, received " + version);
  }

  const help = run(
    npmBinary,
    ["exec", "--offline", "--", "cecilia-ffmpeg", "--help"],
    installDir,
  ).stdout;
  for (const token of ["Cecil-IA Labs · FFmpeg Media Toolkit", "cecilia-ffmpeg", "doctor", "video", "audio", "image"]) {
    if (!help.includes(token)) throw new Error("Clean-install help is missing: " + token);
  }

  run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      'import("@cecilialabs/ffmpeg").then((m) => { if (m.VERSION !== "1.0.0") process.exit(2); })',
    ],
    installDir,
  );

  console.log("Clean npm tarball installation: PASS");
  console.log("Platform: " + process.platform + "/" + process.arch);
  console.log("Tarball: " + filename);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
