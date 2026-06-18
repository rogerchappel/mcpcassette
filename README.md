# mcpcassette

mcpcassette is a local-first CLI and library for inspecting MCP stdio
JSON-RPC session cassettes stored as deterministic JSONL fixtures.

## Status

This is a v0.1.0 developer tool. Treat the cassette schema and CLI output as
early-stage, pin versions in automation, and inspect generated summaries before
using them as release evidence.

## Install from a checkout

```sh
git clone https://github.com/rogerchappel/mcpcassette.git
cd mcpcassette
npm install
npm run build
```

## CLI Quickstart

Print CLI help from the built package:

```sh
node dist/src/cli.js --help
```

Summarize the maintained fixture cassette as text:

```sh
node dist/src/cli.js summarize fixtures/basic.jsonl
```

Write the same summary as JSON for a scripted check:

```sh
node dist/src/cli.js summarize fixtures/basic.jsonl --format json > /tmp/mcpcassette-summary.json
```

The current CLI reads existing cassette files; recording and replay orchestration
belong in follow-up milestones.

## Package contents

The npm package allowlist includes the runtime files plus the public support
documents needed for release review: `README.md`, `LICENSE`, `SECURITY.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
Run `npm run package:smoke` or `npm pack --dry-run` before publishing to
confirm those files are still present in the tarball.

## Verification

Run the release-readiness checks before opening a PR or publishing a release:

```sh
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

`release:check` runs type-checking, tests, build, fixture smoke coverage, and a
dry-run package check. `scripts/validate.sh` remains available as a local
repository hygiene wrapper.

## Limitations

- mcpcassette operates on local JSONL cassette files and does not upload session
  contents.
- The current CLI summarizes cassettes; it does not yet drive a live MCP server
  to record or replay sessions.
- Review cassettes before committing them because MCP messages can include
  prompts, file paths, tool payloads, or other sensitive context.
- Cassette schemas and summary fields may change before a stable 1.0 release.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance. Do not
paste private MCP sessions, tokens, proprietary prompts, or sensitive fixture
payloads into public issues.

## License

MIT
