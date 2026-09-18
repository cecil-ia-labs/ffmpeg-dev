import { readFile, stat } from "node:fs/promises";

const required = [
  "src/video/io.ts",
  "src/video/encoding.ts",
  "src/video/helpers.ts",
  "src/video/trim.ts",
  "src/video/speed.ts",
  "src/video/from-image.ts",
  "src/video/restore.ts",
  "src/cli/actions/milestone-4.ts",
  "test/video/video-builders.test.ts",
  "test/video/video.integration.test.ts",
];

for (const file of required) await stat(file);

const pkg = JSON.parse(await readFile("package.json", "utf8"));
function versionAtLeast(version, minimum) {
  const parse = (value) => {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-alpha\.(\d+))?$/.exec(value);
    if (!match) return undefined;
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? Number.POSITIVE_INFINITY : Number(match[4])];
  };
  const left = parse(version);
  const right = parse(minimum);
  if (!left || !right) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] > right[i]) return true;
    if (left[i] < right[i]) return false;
  }
  return true;
}
if (!versionAtLeast(pkg.version, "0.2.0")) throw new Error(`Expected package version >= 0.2.0, got ${pkg.version}`);

const registry = await readFile("src/cli/action-registry.ts", "utf8");
for (const command of ["video trim-start", "video trim-end", "video trim", "video speed", "video from-image", "video restore"]) {
  if (!registry.includes(command)) throw new Error(`Missing Milestone 4 action: ${command}`);
}

const io = await readFile("src/media/io.ts", "utf8");
if (!io.includes("E_IO_OUTPUT_EXISTS") || !io.includes("cecilia-ffmpeg")) {
  throw new Error("Output safety/atomic staging policy is not present.");
}

console.log("Milestone 4 video foundation verified.");
