import path from "node:path";

function normalize(value: string): string {
  return value.split(path.sep).join("/");
}

function escapeRegexCharacter(character: string): string {
  return /[\\^$.*+?()[\]{}|]/.test(character) ? `\\${character}` : character;
}

export function globToRegExp(pattern: string): RegExp {
  const normalized = normalize(pattern.trim());
  let source = "^";
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index]!;
    if (character === "*") {
      if (normalized[index + 1] === "*") {
        index += 1;
        if (normalized[index + 1] === "/") {
          index += 1;
          source += "(?:.*/)?";
        } else {
          source += ".*";
        }
      } else {
        source += "[^/]*";
      }
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += escapeRegexCharacter(character);
    }
  }
  source += "$";
  return new RegExp(source, "i");
}

export function matchesAnyPattern(relativePath: string, patterns: readonly string[]): boolean {
  if (patterns.length === 0) return false;
  const normalized = normalize(relativePath);
  const basename = path.posix.basename(normalized);
  return patterns.some((pattern) => {
    const expression = globToRegExp(pattern);
    return expression.test(normalized) || (!pattern.includes("/") && expression.test(basename));
  });
}
