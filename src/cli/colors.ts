import { CLI_ICONS, iconForCommandPath } from "./icons.js";

const ESC = "\u001b[";

export const codes = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  cyan: `${ESC}38;2;0;210;255m`,
  green: `${ESC}38;2;0;255;140m`,
  yellow: `${ESC}93m`,
  red: `${ESC}91m`,
  magenta: `${ESC}95m`,
  log: `${ESC}38;2;110;130;125m`,
  // log: `${ESC}38;2;0;255;140m`,
  white: `${ESC}97m`,
} as const;

export function wrap(text: string, ...styles: string[]): string {
  if (styles.length === 0) return text;
  return `${styles.join("")}${text}${codes.reset}`;
}

function normalColor(text: string, color: string): string {
  return wrap(text, color);
}

function boldColor(text: string, color: string): string {
  return wrap(text, codes.bold, color);
}

export function brandCyan(text: string): string {
  return boldColor(text, codes.cyan);
}


export function normalCyan(text: string): string {
  return normalColor(text, codes.cyan);
}

export function brandGreen(text: string): string {
  return boldColor(text, codes.green);
}

export function brandYellow(text: string): string {
  return boldColor(text, codes.yellow);
}

export function normalGreen(text: string): string {
  return boldColor(text, codes.green);
}

export function brandMagenta(text: string): string {
  return boldColor(text, codes.magenta);
}

export function normalMagenta(text: string): string {
  return normalColor(text, codes.magenta);
}

export function brandWhite(text: string): string {
  return boldColor(text, codes.white);
}


export function normalWhite(text: string): string {
  return normalColor(text, codes.white);
}

export function normalLog(text: string): string {
  return normalColor(text, codes.log);
}

export function colorEnabled(
  requested: boolean,
  stream: { isTTY?: boolean },
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!requested) return false;
  if (env["NO_COLOR"] !== undefined) return false;
  if (env["FORCE_COLOR"] === "0") return false;
  if (env["FORCE_COLOR"] !== undefined) return true;
  return Boolean(stream.isTTY);
}

function iconForHeader(line: string): string {
  const normalized = line.toLowerCase();
  if (normalized.startsWith("video ")) return CLI_ICONS.video;
  if (normalized.startsWith("image ")) return CLI_ICONS.image;
  if (normalized.startsWith("audio ")) return CLI_ICONS.audio;
  if (normalized.startsWith("convert ")) return CLI_ICONS.convert;
  if (normalized.startsWith("compose ")) return CLI_ICONS.compose;
  if (normalized.startsWith("stream ")) return CLI_ICONS.stream;
  if (normalized.startsWith("repair ")) return CLI_ICONS.repair;
  if (normalized.startsWith("diagnose")) return CLI_ICONS.diagnose;
  if (normalized.startsWith("doctor")) return CLI_ICONS.doctor;
  if (normalized.startsWith("probe")) return CLI_ICONS.probe;
  if (normalized.startsWith("environment")) return CLI_ICONS.environment;
  return iconForCommandPath(`cecilia-ffmpeg ${normalized}`);
}

function labelIcon(label: string): string {
  switch (label) {
    case "Input:":
    case "Inputs:":
    case "Source:":
      return CLI_ICONS.input;
    case "Output:":
    case "Output directory:":
      return CLI_ICONS.output;
    case "Result:":
      return CLI_ICONS.result;
    case "Command:":
      return CLI_ICONS.command;
    case "Resolution:":
      return CLI_ICONS.resolution;
    case "Duration:":
      return CLI_ICONS.duration;
    case "Format:":
    case "Video:":
    case "Audio:":
    case "Container:":
      return CLI_ICONS.format;
    case "Transport:":
      return CLI_ICONS.stream;
    case "Succeeded:":
      return CLI_ICONS.success;
    case "Failed:":
      return CLI_ICONS.error;
    case "Skipped:":
      return CLI_ICONS.warning;
    case "Discovered:":
    case "Attempted:":
    case "Parallelism:":
      return CLI_ICONS.batch;
    default:
      return CLI_ICONS.info;
  }
}

export function colorizeHumanOutput(text: string, enabled: boolean): string {
  if (!enabled || text.length === 0) return text;

  return text.split("\n").map((line, index) => {
    if (index === 0 && !line.includes(":")) {
      return `${iconForHeader(line)}\t\b\b\b\b${normalLog(line)}`;
    }

    const separator = line.indexOf(":");
    if (separator <= 0) return `${normalLog(line)}`;
    const label = line.slice(0, separator + 1);
    const value = line.slice(separator + 1);
    const icon = labelIcon(label);

    if (label === "Output:" || label === "Result:" || label === "Succeeded:") {
      return `${icon}\t\b\b\b\b${brandCyan(label)}${normalLog(value)}`;
    }
    if (label === "Failed:") {
      return `${icon}\t\b\b\b\b${boldColor(label, codes.red)}${boldColor(value, codes.red)}`;
    }
    if (label === "Skipped:") {
      return `${icon}\t\b\b\b\b${brandCyan(label)}${normalLog(value)}`;
    }
    if (label === "Command:") {
      return `${icon}\t\b\b\b\b${brandCyan(label)}${normalLog(value)}`;
    }
    if (["Transport:", "Container:", "Video:", "Audio:", "Format:", "Resolution:"].includes(label)) {
      return `${icon}\t\b\b\b\b${brandCyan(label)}${normalLog(value)}`;
    }
    if (["Duration:", "Discovered:", "Attempted:", "Parallelism:"].includes(label)) {
      return `${icon}\t\b\b\b\b${brandCyan(label)}${normalLog(value)}`;
    }
    return `${icon}\t\b\b\b\b${brandCyan(label)}${normalLog(value)}`;
  }).join("\n");
}

export function colorizeProgressLine(text: string, enabled: boolean): string {
  if (!enabled) return text;

  return text
    .split("\t| ")
    .map((part, index) => {
      if (index === 0) return brandWhite(part);
      if (part.includes(CLI_ICONS.completed) || part.includes(CLI_ICONS.progress)) return brandGreen(part);
      if (part.includes(CLI_ICONS.frame)) return brandMagenta(part);
      if (part.includes(CLI_ICONS.fps) || part.includes(CLI_ICONS.speed)) return brandCyan(part);
      if (part.includes(CLI_ICONS.eta)) return brandYellow(part);
      return brandWhite(part);
    })
    .join(` ${brandCyan("│")} `);
}

export function colorizeWarning(code: string, message: string, enabled: boolean): string {
  const prefix = `warning [${code}]`;
  return enabled
    ? `${CLI_ICONS.warning}\t\b\b\b\b ${boldColor(prefix, codes.yellow)}: ${boldColor(message, codes.yellow)}`
    : `${prefix}: ${message}`;
}

export function colorizeError(code: string, message: string, enabled: boolean): string {
  const prefix = `error [${code}]`;
  return enabled
    ? `${CLI_ICONS.error}\t\b\b\b\b ${boldColor(prefix, codes.red)}: ${boldColor(message, codes.red)}`
    : `${prefix}: ${message}`;
}
