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
Run `npm run package:smoke` before publishing to confirm those files are still
present in the tarball. The package smoke builds the project, runs
`npm pack --dry-run`, and fails if required runtime or support files are missing
from the npm file list.

## Verification

This repository uses pnpm 9 and `pnpm-lock.yaml` as its canonical package
manager and lockfile. Enable the version declared in `package.json`, then use a
frozen install so local and release builds resolve the same dependencies:

```sh
corepack enable
pnpm install --frozen-lockfile
```

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
package contents assertion. `scripts/validate.sh` remains available as a local
repository hygiene wrapper.

The package metadata points at the public GitHub repository so npm and generated
provenance link back to the source.
## CLI Help Smoke

Confirm the packaged command starts and prints its help text before relying on a release tarball or downstream automation:

```bash
npm run build
node ./dist/src/cli.js --help
```

The command should exit successfully, print the available options, and avoid reading project files or contacting external services.

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
