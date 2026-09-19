import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const concatSource = await readFile(new URL("../src/composition/concat.ts", import.meta.url), "utf8");
const transitionSource = await readFile(new URL("../src/composition/transition.ts", import.meta.url), "utf8");
const transitionsSource = await readFile(new URL("../src/composition/transitions.ts", import.meta.url), "utf8");
const slideshowSource = await readFile(new URL("../src/composition/slideshow.ts", import.meta.url), "utf8");
const graphSource = await readFile(new URL("../src/composition/filter-graph.ts", import.meta.url), "utf8");
const normalizationSource = await readFile(new URL("../src/composition/normalization.ts", import.meta.url), "utf8");
const registry = await readFile(new URL("../src/cli/action-registry.ts", import.meta.url), "utf8");

assert(concatSource.includes("xfadeFilter"), "concat implementation must use the shared transition builder.");
assert(concatSource.includes("acrossfade="), "concat implementation missing acrossfade.");
for (const token of ["settb=AVTB", "setpts=PTS-STARTPTS", "fps=${fps}"]) {
  assert(normalizationSource.includes(token), `composition normalization missing ${token}`);
}
assert(transitionSource.includes("xfadeFilter"), "transition implementation must use the shared transition builder.");
assert(transitionsSource.includes("zoomin"), "transition catalog missing zoomin");
assert(transitionsSource.includes("zoomout"), "transition catalog missing zoomout");
assert(slideshowSource.includes("vstack=inputs="), "slideshow implementation missing vstack");
assert(slideshowSource.includes("overlay=x=0:y="), "slideshow implementation missing scrolling overlay");
assert(slideshowSource.includes("style === \"sequence\""), "slideshow sequence style missing");
assert(slideshowSource.includes("includes"), "slideshow include selection missing");
assert(slideshowSource.includes("excludes"), "slideshow exclude selection missing");
assert(graphSource.includes("class FilterGraphBuilder"), "typed filter graph builder missing");
for (const command of ["compose concat", "compose transition", "compose slideshow"]) {
  assert(registry.includes(command), `action registry missing ${command}`);
}

console.log("Milestone 7 composition verification passed.");
