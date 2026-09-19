const ESC = "\u001b[";

const codes = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
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

export function colorizeHumanOutput(text: string, enabled: boolean): string {
  if (!enabled || text.length === 0) return text;

  return text.split("\n").map((line, index) => {
    if (index === 0 && !line.includes(":")) {
      return wrap(line, codes.bold, codes.brightCyan);
    }

    const separator = line.indexOf(":");
    if (separator <= 0) return line;
    const label = line.slice(0, separator + 1);
    const value = line.slice(separator + 1);

    if (label === "Output:" || label === "Result:") {
      return `${wrap(label, codes.bold, codes.brightGreen)}${wrap(value, codes.brightGreen)}`;
    }
    if (label === "Command:") {
      return `${wrap(label, codes.bold, codes.dim)}${wrap(value, codes.dim)}`;
    }
    if (["Transport:", "Container:", "Video:", "Audio:", "Format:", "Resolution:"].includes(label)) {
      return `${wrap(label, codes.bold, codes.brightMagenta)}${wrap(value, codes.brightMagenta)}`;
    }
    if (["Duration:", "Succeeded:", "Discovered:"].includes(label)) {
      return `${wrap(label, codes.bold, codes.brightCyan)}${wrap(value, codes.brightWhite)}`;
    }
    return `${wrap(label, codes.bold, codes.brightCyan)}${wrap(value, codes.brightWhite)}`;
  }).join("\n");
}

export function colorizeWarning(code: string, message: string, enabled: boolean): string {
  const prefix = `warning [${code}]`;
  return enabled
    ? `${wrap(prefix, codes.bold, codes.brightYellow)}: ${wrap(message, codes.brightYellow)}`
    : `${prefix}: ${message}`;
}

export function colorizeError(code: string, message: string, enabled: boolean): string {
  const prefix = `error [${code}]`;
  return enabled
    ? `${wrap(prefix, codes.bold, codes.brightRed)}: ${wrap(message, codes.brightRed)}`
    : `${prefix}: ${message}`;
}
