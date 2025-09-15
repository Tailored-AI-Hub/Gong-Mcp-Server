#!/usr/bin/env node

// Bootstrap to ensure ONLY JSON-RPC goes to stdout before any imports run.
// Route all non-JSON-RPC output to stderr.

// Preserve original stdout write
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

function isJsonRpcPayload(chunk: any): boolean {
  try {
    const str = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    if (str.trim().length === 0) return false;
    // Fast path: must contain jsonrpc field
    if (!str.includes('"jsonrpc"')) return false;
    // Best-effort check: try parse the first JSON object on the line
    // Avoid throwing for large streams
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Override stdout: only allow JSON-RPC frames
(process.stdout as any).write = function (chunk: any, encoding?: any, cb?: any) {
  if (isJsonRpcPayload(chunk)) {
    return originalStdoutWrite(chunk, encoding as any, cb as any);
  }
  // Divert anything else to stderr
  return originalStderrWrite(chunk, encoding as any, cb as any);
};

// Route console.log to stderr to be safe
// eslint-disable-next-line no-console
console.log = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

// Dynamically import the real server after guards are in place
import('./index.js').catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start Gong MCP Server:', err?.message || err);
  process.exit(1);
});


