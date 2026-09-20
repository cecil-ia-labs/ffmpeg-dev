#!/usr/bin/env node

import { constants } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { spawnSync } from "node:child_process";

const CLI_NAME = "cecilia-ffmpeg";
const BASHRC_START = "# >>> cecilia-ffmpeg local CLI >>>";
const BASHRC_END = "# <<< cecilia-ffmpeg local CLI <<<";

const CYAN = "\u001b[38;2;0;210;255m";
const GREEN = "\u001b[38;2;0;255;140m";
const YELLOW = "\u001b[93m";
const RED = "\u001b[91m";
const BOLD = "\u001b[1m";
const RESET = "\u001b[0m";

function info(message) {
  console.log(CYAN + BOLD + "→" + RESET + " " + message);
}

function success(message) {
  console.log(GREEN + BOLD + "✓" + RESET + " " + message);
}

function warn(message) {
  console.log(YELLOW + BOLD + "!" + RESET + " " + message);
}

function fail(message) {
  console.error(RED + BOLD + "✗" + RESET + " " + message);
  process.exitCode = 1;
}

function run(command, args) {
  info(command + " " + args.join(" "));
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(command + " exited with code " + String(result.status));
  }
}

async function isExecutable(file) {
  try {
    await access(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findCommand(name) {
  const directories = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";")
    : [""];

  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = path.join(directory, name + extension.toLowerCase());
      if (await isExecutable(candidate)) return candidate;
    }
  }
  return undefined;
}

function npmGlobalBin() {
  const result = spawnSync("npm", ["prefix", "--global"], {
    encoding: "utf8",
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error("Unable to resolve the npm global prefix.");
  }

  const prefix = result.stdout.trim();
  if (!prefix) throw new Error("npm returned an empty global prefix.");

  return process.platform === "win32" ? prefix : path.join(prefix, "bin");
}

async function askYesNo(rl, question) {
  const answer = (await rl.question(question)).trim().toLowerCase();
  return answer === "y" || answer === "yes";
}

function removeManagedBlock(content) {
  const start = content.indexOf(BASHRC_START);
  if (start === -1) return content;

  const end = content.indexOf(BASHRC_END, start);
  if (end === -1) return content;

  return (
    content.slice(0, start).trimEnd() +
    "\n" +
    content.slice(end + BASHRC_END.length).trimStart()
  );
}

function quoteForDoubleQuotedShell(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("$", "\\$")
    .replaceAll("`", "\\`");
}

async function addBinToBashrc(globalBin) {
  const bashrc = path.join(os.homedir(), ".bashrc");
  let current = "";

  try {
    current = await readFile(bashrc, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
      throw error;
    }
  }

  const cleaned = removeManagedBlock(current).trimEnd();
  const block = [
    BASHRC_START,
    'export PATH="' + quoteForDoubleQuotedShell(globalBin) + ':$PATH"',
    BASHRC_END,
  ].join("\n");

  await writeFile(bashrc, cleaned + (cleaned ? "\n\n" : "") + block + "\n", "utf8");
  return bashrc;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log();
    console.log(CYAN + BOLD + "Cecil-IA Labs · FFmpeg Media Toolkit" + RESET);
    console.log("Local CLI setup");
    console.log();
    console.log("This will:");
    console.log("  1. build the TypeScript project;");
    console.log("  2. create the npm global link;");
    console.log("  3. verify that " + CLI_NAME + " is available in PATH;");
    console.log("  4. offer to update ~/.bashrc only when PATH needs it.");
    console.log();

    if (!await askYesNo(rl, "Continue? [y/N] ")) {
      warn("Setup cancelled.");
      return;
    }

    console.log();
    run("npm", ["run", "link:cli"]);

    const linked = await findCommand(CLI_NAME);
    if (linked) {
      console.log();
      success(CLI_NAME + " is available at " + linked);
      console.log();
      console.log("Try:");
      console.log("  " + CLI_NAME + " --help");
      console.log("  " + CLI_NAME + " doctor");
      return;
    }

    const globalBin = npmGlobalBin();
    console.log();
    warn("npm link succeeded, but the npm global bin directory is not in PATH.");
    console.log("npm global bin: " + globalBin);

    if (process.platform === "win32") {
      warn("Automatic ~/.bashrc configuration is only available on POSIX systems.");
      return;
    }

    const shell = process.env.SHELL ?? "";
    if (shell && path.basename(shell) !== "bash") {
      warn("Current shell appears to be " + path.basename(shell) + "; ~/.bashrc will not be modified automatically.");
      console.log("Add this directory to your shell PATH manually:");
      console.log("  " + globalBin);
      return;
    }

    console.log();
    if (!await askYesNo(rl, "Add the npm global bin directory to ~/.bashrc? [y/N] ")) {
      warn("Skipped ~/.bashrc modification.");
      console.log("You can add it manually with:");
      console.log('  export PATH="' + globalBin + ':$PATH"');
      return;
    }

    const bashrc = await addBinToBashrc(globalBin);
    success("Updated " + bashrc + " using an idempotent managed block.");
    console.log();
    console.log("Activate it in the current terminal:");
    console.log("  source ~/.bashrc");
    console.log();
    console.log("Then run:");
    console.log("  " + CLI_NAME + " --help");
  } catch (error) {
    console.log();
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

await main();
