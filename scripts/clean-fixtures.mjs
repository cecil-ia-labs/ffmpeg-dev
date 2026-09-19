import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await rm(path.join(root, "test/fixtures/generated"), { recursive: true, force: true });
console.log("Milestone 12 generated fixtures removed.");
