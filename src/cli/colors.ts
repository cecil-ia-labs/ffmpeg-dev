import { CLI_ICONS, iconForCommandPath } from "./icons.js";

const ESC = "\u001b[";

const codes = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  brightBlue: `${ESC}94m`,
  brightCyan: `${ESC}96m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightRed: `${ESC}91m`,
  brightMagenta: `${ESC}95m`,
  brightWhite: `${ESC}97m`,
} as const;

function wrap(text: string, ...styles: string[]): string {
  if (styles.length === 0) return text;
  return `${styles.join("")}${text}${codes.reset}`;
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
      return `${iconForHeader(line)} ${wrap(line, codes.bold, codes.brightCyan)}`;
    }

    const separator = line.indexOf(":");
    if (separator <= 0) return line;
    const label = line.slice(0, separator + 1);
    const value = line.slice(separator + 1);
    const icon = labelIcon(label);

    if (label === "Output:" || label === "Result:" || label === "Succeeded:") {
      return `${icon} ${wrap(label, codes.bold, codes.brightGreen)}${wrap(value, codes.brightGreen)}`;
    }
    if (label === "Failed:") {
      return `${icon} ${wrap(label, codes.bold, codes.brightRed)}${wrap(value, codes.brightRed)}`;
    }
    if (label === "Skipped:") {
      return `${icon} ${wrap(label, codes.bold, codes.brightYellow)}${wrap(value, codes.brightYellow)}`;
    }
    if (label === "Command:") {
      return `${icon} ${wrap(label, codes.bold, codes.dim)}${wrap(value, codes.dim)}`;
    }
    if (["Transport:", "Container:", "Video:", "Audio:", "Format:", "Resolution:"].includes(label)) {
      return `${icon} ${wrap(label, codes.bold, codes.brightMagenta)}${wrap(value, codes.brightMagenta)}`;
    }
    if (["Duration:", "Discovered:", "Attempted:", "Parallelism:"].includes(label)) {
      return `${icon} ${wrap(label, codes.bold, codes.brightCyan)}${wrap(value, codes.brightWhite)}`;
    }
    return `${icon} ${wrap(label, codes.bold, codes.brightBlue)}${wrap(value, codes.brightWhite)}`;
  }).join("\n");
}

export function colorizeProgressLine(text: string, enabled: boolean): string {
  if (!enabled) return text;

  return text
    .split(" | ")
    .map((part) => {
      if (part.includes("%")) return wrap(part, codes.bold, codes.brightGreen);
      if (part.includes("ETA")) return wrap(part, codes.bold, codes.brightYellow);
      if (part.includes("fps") || part.includes("x")) return wrap(part, codes.brightCyan);
      if (part.includes("frame")) return wrap(part, codes.brightMagenta);
      return wrap(part, codes.bold, codes.brightWhite);
    })
    .join(` ${wrap("│", codes.dim)} `);
}

export function colorizeWarning(code: string, message: string, enabled: boolean): string {
  const prefix = `warning [${code}]`;
  return enabled
    ? `${CLI_ICONS.warning} ${wrap(prefix, codes.bold, codes.brightYellow)}: ${wrap(message, codes.brightYellow)}`
    : `${prefix}: ${message}`;
}

export function colorizeError(code: string, message: string, enabled: boolean): string {
  const prefix = `error [${code}]`;
  return enabled
    ? `${CLI_ICONS.error} ${wrap(prefix, codes.bold, codes.brightRed)}: ${wrap(message, codes.brightRed)}`
    : `${prefix}: ${message}`;
}
