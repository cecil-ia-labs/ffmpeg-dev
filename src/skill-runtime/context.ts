import type { ContextSource, ExecutionContextInfo, SkillExecutionContext } from "./types.js";

const CONTEXTS = new Set<SkillExecutionContext>([
  "chatgpt-regular",
  "chatgpt-work",
  "codex",
  "ide",
  "terminal",
  "unknown",
]);

function capabilitiesFor(
  name: SkillExecutionContext,
): Omit<ExecutionContextInfo, "name" | "source"> {
  switch (name) {
    case "chatgpt-regular":
      return { canInspectFiles: false, canExecuteScripts: false, canInstallDependencies: false };
    case "unknown":
      return { canInspectFiles: false, canExecuteScripts: false, canInstallDependencies: false };
    case "chatgpt-work":
      return { canInspectFiles: true, canExecuteScripts: true, canInstallDependencies: true };
    case "codex":
    case "ide":
    case "terminal":
      return { canInspectFiles: true, canExecuteScripts: true, canInstallDependencies: true };
  }
}

function asContext(value: string | undefined): SkillExecutionContext | undefined {
  if (value === undefined || !CONTEXTS.has(value as SkillExecutionContext)) return undefined;
  return value as SkillExecutionContext;
}

function environmentContext(environment: NodeJS.ProcessEnv): SkillExecutionContext | undefined {
  const explicit = asContext(environment["CECELIA_FFMPEG_CONTEXT"]);
  if (explicit !== undefined) return explicit;

  if (environment["CODEX_THREAD_ID"] || environment["CODEX_SANDBOX"] === "1") return "codex";
  if (environment["CHATGPT_WORKSPACE"] || environment["CHATGPT_WORK"] === "1")
    return "chatgpt-work";
  if (
    environment["TERM_PROGRAM"] ||
    environment["VSCODE_PID"] ||
    environment["IDEA_INITIAL_DIRECTORY"]
  ) {
    return "ide";
  }
  return undefined;
}

export function getExecutionContext(
  requested: SkillExecutionContext | undefined,
  environment: NodeJS.ProcessEnv = process.env,
): ExecutionContextInfo {
  const requestedContext = asContext(requested);
  const detectedContext = environmentContext(environment);
  const name = requestedContext ?? detectedContext ?? "unknown";
  const source: ContextSource =
    requestedContext !== undefined
      ? "request"
      : detectedContext !== undefined
        ? "environment"
        : "unknown";
  return { name, source, ...capabilitiesFor(name) };
}

export function contextGuidance(context: ExecutionContextInfo): string[] {
  switch (context.name) {
    case "chatgpt-regular":
      return [
        "This chat cannot inspect local files or execute scripts.",
        "Run the printed command in a Work/Codex/IDE/terminal environment and provide its JSON result.",
      ];
    case "unknown":
      return [
        "Declare context as chatgpt-work, codex, ide, or terminal before execution.",
        "Do not claim that local files or media were inspected until the command runs on that host.",
      ];
    default:
      return [];
  }
}
