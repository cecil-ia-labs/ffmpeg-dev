import { buildProgram } from "./program.js";

export async function runCli(argv: readonly string[] = process.argv): Promise<void> {
  const program = buildProgram();
  await program.parseAsync([...argv]);
}
