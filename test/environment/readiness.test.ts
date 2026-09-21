import { describe, expect, it } from "vitest";

import { inspectEnvironmentReadiness } from "../../src/environment/readiness.js";
import { installToolkit } from "../../src/environment/install.js";

describe("Environment flow", () => {
  it("returns guided instructions without executing commands in regular Chat", async () => {
    const report = await inspectEnvironmentReadiness({ context: "chatgpt-regular" });

    expect(report.status).toBe("planned");
    expect(report.context.name).toBe("chatgpt-regular");
    expect(report.observed.canExecuteScripts).toBe(false);
    expect(report.plannedCommands).toContain("node --version");
    expect(report.next.join("\n")).toContain("environment check --json");
  });

  it("plans installation without mutating the project until explicitly authorized", async () => {
    const report = await installToolkit({ scope: "local", cwd: process.cwd() });

    expect(report.status).toBe("planned");
    expect(report.plan.mutatesProject).toBe(true);
    expect(report.plan.args).toEqual(["install", "--no-audit", "--no-fund", "@cecilialabs/ffmpeg"]);
    expect(report.execution).toBeUndefined();
  });
});
