#!/usr/bin/env node

import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createMediaMcpServer } from "./mcp/server.js";

serveStdio(createMediaMcpServer, {
  onerror(error: Error) {
    console.error("cecilia-ffmpeg-mcp error:", error.message);
  },
});
