import { describe, expect, it } from "vitest";

import { COMPOSITION_TRANSITIONS, xfadeFilter } from "../../src/composition/transitions.js";

describe("expanded composition transitions", () => {
  it("includes native zoomin and custom zoomout", () => {
    expect(COMPOSITION_TRANSITIONS.has("zoomin")).toBe(true);
    expect(COMPOSITION_TRANSITIONS.has("zoomout")).toBe(true);
  });

  it("renders native zoomin through xfade", () => {
    expect(xfadeFilter("zoomin", 0.75, 2.25)).toBe(
      "xfade=transition=zoomin:duration=0.75:offset=2.25",
    );
  });

  it("renders zoomout as an explicit custom xfade expression", () => {
    const filter = xfadeFilter("zoomout", 1, 3);
    expect(filter).toContain("xfade=transition=custom");
    expect(filter).toContain("a0(");
    expect(filter).toContain("b0(");
  });
});
