import { ToolkitRuntimeError } from "../core/errors.js";

const LABEL = /^[A-Za-z0-9_:.-]+$/;

function assertLabel(label: string): string {
  if (!LABEL.test(label)) {
    throw new ToolkitRuntimeError("E_INTERNAL_INVARIANT", `Invalid filter-graph label: ${label}`);
  }
  return label;
}

export class FilterGraphBuilder {
  readonly #chains: string[] = [];

  addRaw(chain: string): this {
    const value = chain.trim().replace(/;+$/, "");
    if (value.length > 0) this.#chains.push(value);
    return this;
  }

  add(inputs: readonly string[], filters: readonly string[], output: string): this {
    if (filters.length === 0) {
      throw new ToolkitRuntimeError("E_INTERNAL_INVARIANT", "A filter graph chain requires at least one filter.");
    }
    const source = inputs.map((label) => `[${assertLabel(label)}]`).join("");
    const destination = `[${assertLabel(output)}]`;
    this.#chains.push(`${source}${filters.join(",")}${destination}`);
    return this;
  }

  build(): string {
    if (this.#chains.length === 0) {
      throw new ToolkitRuntimeError("E_INTERNAL_INVARIANT", "Cannot build an empty filter graph.");
    }
    return this.#chains.join(";");
  }

  get size(): number {
    return this.#chains.length;
  }
}
