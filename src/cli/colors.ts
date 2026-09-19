const ESC = "\u001b[";

const codes = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  cyan: `${ESC}36m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  red: `${ESC}31m`,
  magenta: `${ESC}35m`,
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

function colorLabel(label: string, kind: "info" | "success" | "detail"): string {
  switch (kind) {
    case "success":
      return wrap(label, codes.bold, codes.green);
    case "detail":
      return wrap(label, codes.bold, codes.magenta);
    case "info":
      return wrap(label, codes.bold, codes.cyan);
  }
}

export function colorizeHumanOutput(text: string, enabled: boolean): string {
  if (!enabled || text.length === 0) return text;

  return text.split("\n").map((line, index) => {
    if (index === 0 && !line.includes(":")) return wrap(line, codes.bold, codes.cyan);

    const separator = line.indexOf(":");
    if (separator <= 0) return line;
    const label = line.slice(0, separator + 1);
    const value = line.slice(separator + 1);

    if (label === "Output:" || label === "Result:") {
      return `${colorLabel(label, "success")}${value}`;
    }
    if (label === "Command:") {
      return `${wrap(label, codes.bold, codes.dim)}${wrap(value, codes.dim)}`;
    }
    if (["Transport:", "Container:", "Video:", "Audio:"].includes(label)) {
      return `${colorLabel(label, "detail")}${value}`;
    }
    return `${colorLabel(label, "info")}${value}`;
  }).join("\n");
}

export function colorizeWarning(code: string, message: string, enabled: boolean): string {
  const prefix = `warning [${code}]`;
  return enabled
    ? `${wrap(prefix, codes.bold, codes.yellow)}: ${message}`
    : `${prefix}: ${message}`;
}

export function colorizeError(code: string, message: string, enabled: boolean): string {
  const prefix = `error [${code}]`;
  return enabled
    ? `${wrap(prefix, codes.bold, codes.red)}: ${message}`
    : `${prefix}: ${message}`;
}
