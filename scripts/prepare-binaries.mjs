import { chmod, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const binaries = ["dist/cli.js", "dist/mcp.js"];

if (process.platform !== "win32") {
  for (const relative of binaries) {
    const absolute = path.join(root, relative);
    await chmod(absolute, 0o755);
    const mode = (await stat(absolute)).mode & 0o777;
    if ((mode & 0o111) === 0) {
      throw new Error(`Binary is not executable after chmod: ${relative}`);
    }
  }
}
