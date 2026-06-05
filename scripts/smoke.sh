#!/usr/bin/env bash
set -euo pipefail

node dist/src/cli.js summarize fixtures/basic.jsonl --format json > /tmp/mcpcassette-summary.json
node -e "const fs=require('node:fs'); const summary=JSON.parse(fs.readFileSync('/tmp/mcpcassette-summary.json','utf8')); if (summary.entries !== 2 || summary.requests !== 1 || summary.responses !== 1) process.exit(1);"
