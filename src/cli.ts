#!/usr/bin/env node
import { readCassette, summarizeCassette } from "./index.js";

async function main(argv = process.argv.slice(2)) {
  const [command, path, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(helpText());
    return 0;
  }

  if (command !== "summarize") {
    process.stderr.write(`mcpcassette: unknown command ${command}\n`);
    process.stderr.write(helpText());
    return 2;
  }

  if (!path) {
    process.stderr.write("mcpcassette: summarize requires a cassette path\n");
    return 2;
  }

  const format = parseFormat(rest);
  const entries = await readCassette(path);
  const summary = summarizeCassette(path, entries);
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(renderText(summary));
  }
  return 0;
}

function parseFormat(args) {
  const index = args.findIndex((arg) => arg === "--format" || arg === "-f");
  const value = index >= 0 ? args[index + 1] : "text";
  if (value !== "text" && value !== "json") {
    throw new Error("--format must be text or json");
  }
  return value;
}

function renderText(summary) {
  const methods = Object.entries(summary.methods)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([method, count]) => `- ${method}: ${count}`);
  return [
    `Cassette: ${summary.path}`,
    `Entries: ${summary.entries}`,
    `Client messages: ${summary.clientMessages}`,
    `Server messages: ${summary.serverMessages}`,
    `Requests: ${summary.requests}`,
    `Responses: ${summary.responses}`,
    `Notifications: ${summary.notifications}`,
    "Methods:",
    ...(methods.length > 0 ? methods : ["- none"]),
    ""
  ].join("\n");
}

function helpText() {
  return `mcpcassette\n\nUsage:\n  mcpcassette summarize <cassette.jsonl> [--format text|json]\n`;
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  process.stderr.write(`mcpcassette: ${error.message}\n`);
  process.exitCode = 1;
});
