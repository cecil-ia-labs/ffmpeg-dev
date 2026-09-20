#!/usr/bin/env node

import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createMediaMcpServer } from "./mcp/server.js";

void serveStdio(createMediaMcpServer).catch((error: unknown) => {
  console.error("cecilia-ffmpeg-mcp failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
