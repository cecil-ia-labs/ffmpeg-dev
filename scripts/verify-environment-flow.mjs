import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return readFile(path.join(root, relative), "utf8");
}

const [packageText, readiness, install, commandSpec, cliReference, schema] = await Promise.all([
  text("package.json"),
  text("src/environment/readiness.ts"),
  text("src/environment/install.ts"),
  text("src/cli/command-spec.ts"),
  text("docs/cli-reference.md"),
  text("specs/skill-result-envelope.schema.json"),
]);
const packageJson = JSON.parse(packageText);

assert(
  packageJson.scripts?.["verify:skill-scripts"] === "node scripts/verify-skill-scripts.mjs",
  "Skill script verifier is not wired.",
);
assert(
  packageJson.scripts?.["verify:environment-flow"] === "node scripts/verify-environment-flow.mjs",
  "Environment flow verifier is not wired.",
);
assert(
  packageJson.scripts?.validate?.includes("verify:environment-flow"),
  "validate must include the environment flow verifier.",
);
for (const token of [
  "inspectEnvironmentReadiness",
  "plannedCommands",
  "capabilities",
  "contextGuidance",
]) {
  assert(readiness.includes(token), `Environment readiness is missing ${token}.`);
}
for (const token of ["global", "local", "npm-exec", "authorized", "E_ENV_INSTALL_FAILED"]) {
  assert(install.includes(token), `Installation flow is missing ${token}.`);
}
for (const token of ['syntax: "check"', 'syntax: "install [scope]"']) {
  assert(commandSpec.includes(token), `Command tree is missing ${token}.`);
}
for (const token of ["environment check", "environment install"]) {
  assert(cliReference.includes(token), `CLI reference is missing ${token}.`);
}
for (const token of ["operation", "status", "context", "artifacts", "next", "error"]) {
  assert(schema.includes(`"${token}"`), `Skill result schema is missing ${token}.`);
}

console.log("Environment flow contract: PASS");
