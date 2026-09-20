import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relative) {
  return readFile(path.join(root, relative), "utf8");
}

const pkg = JSON.parse(await text("package.json"));
const lock = JSON.parse(await text("package-lock.json"));

assert(pkg.dependencies?.["js-yaml"] === "^4.3.2", "Pipeline YAML parser must be a direct runtime dependency.");
assert(lock.packages?.[""]?.dependencies?.["js-yaml"] === "^4.3.2", "Lockfile root must include js-yaml.");
assert(pkg.scripts?.["verify:pipeline"] === "node scripts/verify-pipeline.mjs", "Missing verify:pipeline package script.");
assert(pkg.scripts?.validate?.includes("verify:pipeline"), "validate must include verify:pipeline.");

for (const relative of [
  "src/pipeline/types.ts",
  "src/pipeline/schema.ts",
  "src/pipeline/parser.ts",
  "src/pipeline/presets.ts",
  "src/pipeline/validation.ts",
  "src/pipeline/executor.ts",
  "src/pipeline/index.ts",
  "src/pipeline/inspection.ts",
  "src/pipeline/inline.ts",
  "specs/pipeline.schema.json",
  "test/pipeline/trim.integration.test.ts",
  "test/pipeline/speed.integration.test.ts",
  "test/pipeline/resize.integration.test.ts",
  "test/pipeline/normalize.integration.test.ts",
  "test/pipeline/convert.integration.test.ts",
  "test/pipeline/presets.test.ts",
  "test/pipeline/presets.integration.test.ts",
  "test/pipeline/validation.test.ts",
  "docs/pipelines.md",
  "skills/ffmpeg-pipelines/SKILL.md",
  "skills/ffmpeg-pipelines/references/pipeline-schema.md",
]) {
  assert((await stat(path.join(root, relative))).isFile(), "Missing pipeline artifact: " + relative);
}

const publicSchema = JSON.parse(await text("specs/pipeline.schema.json"));
assert(publicSchema.$schema === "https://json-schema.org/draft/2020-12/schema", "Pipeline public schema must use JSON Schema 2020-12.");
assert(publicSchema.properties?.version?.const === 1, "Pipeline public schema must freeze version 1.");
assert(publicSchema.$defs?.step?.oneOf?.length === 7, "Pipeline public schema must expose all seven declarative step forms.");

const schema = await text("src/pipeline/schema.ts");
for (const token of ["trim:", "speed:", "resize:", "normalize:", "audio:", "convert:", "preset:"]) {
  assert(schema.includes(token), "Pipeline schema is missing step: " + token);
}

const executor = await text("src/pipeline/executor.ts");
for (const domainCall of [
  "trimVideoRange(",
  "trimVideoStart(",
  "changeVideoSpeed(",
  "upscaleVideo(",
  "normalizeMedia(",
  "convertFile(",
]) {
  assert(executor.includes(domainCall), "Pipeline executor does not reuse typed domain call: " + domainCall);
}
assert(executor.includes("TemporaryWorkspace"), "Pipeline execution must isolate intermediate artifacts.");
assert(executor.includes("preflightOutputPath"), "Pipeline must preflight its final output before executing media steps.");
assert(executor.indexOf("preflightOutputPath") < executor.indexOf("TemporaryWorkspace.create"), "Pipeline output preflight must happen before workspace creation.");
assert(executor.includes("validatePipelineResultCodec"), "Pipeline executor must enforce the final codec assertion.");
assert(!/node:child_process|from\s+["']child_process["']/.test(executor), "Pipeline executor must not create a process boundary.");

const presets = await text("src/pipeline/presets.ts");
assert(presets.includes("Pipeline preset cycle detected."), "Preset expansion must reject cycles.");
assert(presets.includes("unknown preset"), "Preset expansion must reject missing references.");
assert(presets.includes("MAX_PIPELINE_PRESET_DEPTH = 32"), "Preset expansion must enforce a nesting limit.");
assert(presets.includes("MAX_EXPANDED_PIPELINE_STEPS = 256"), "Preset expansion must enforce an expanded-step limit.");

const validation = await text("src/pipeline/validation.ts");
assert(validation.includes("output codec"), "Pipeline output codec consistency must be validated.");
assert(validation.includes("Final conversion target"), "Final conversion/output extension consistency must be validated.");
assert(validation.includes("validatePipelineResultCodec"), "Pipeline must verify the declared codec against final media.");

const parser = await text("src/pipeline/parser.ts");
assert(parser.includes('require("js-yaml")'), "Pipeline loader must use the declared YAML parser.");
assert(parser.includes("pipelineDocumentSchema.parse"), "Parsed YAML must pass through the typed schema.");

const inline = await text("src/pipeline/inline.ts");
for (const token of ["parsePipelineInvocation", "--step", "pipelineDocumentSchema.safeParse", "validate", "print", "run"]) {
  assert(inline.includes(token), "Inline pipeline parser is missing: " + token);
}

const commandSpec = await text("src/cli/command-spec.ts");
const actionRegistry = await text("src/cli/action-registry.ts");
assert(commandSpec.includes('syntax: "pipeline [tokens...]"'), "CLI command tree must expose the namespaced pipeline command.");
assert(!commandSpec.includes('syntax: "run <pipeline>"'), "Top-level run command must be removed.");
assert(actionRegistry.includes('"cecilia-ffmpeg pipeline": runPipelineAction'), "CLI action registry must route pipeline to the pipeline action.");
assert(!actionRegistry.includes('"cecilia-ffmpeg run": runPipelineAction'), "Top-level run action must be removed.");

const skill = await text("skills/ffmpeg-pipelines/SKILL.md");
assert(skill.includes("cecilia-ffmpeg pipeline"), "Pipeline skill must document the namespaced CLI runner.");
assert(!skill.includes("cecilia-ffmpeg run"), "Pipeline skill must not document the removed top-level runner.");
assert(skill.includes("scripts/run.mjs"), "Pipeline skill must document its associated script.");

const pipelineDir = path.join(root, "src/pipeline");
for (const entry of await readdir(pipelineDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
  const source = await readFile(path.join(pipelineDir, entry.name), "utf8");
  assert(!/node:child_process|from\s+["']child_process["']/.test(source), "Pipeline module must not execute child processes directly: " + entry.name);
}

console.log("Milestone 21 namespaced pipeline CLI: PASS");
