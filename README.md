# mcpcassette

mcpcassette is a local-first CLI and library for inspecting MCP stdio
JSON-RPC session cassettes stored as deterministic JSONL fixtures.

## Status

This is a v0.1.0 developer tool. Treat the cassette schema and CLI output as
early-stage, pin versions in automation, and inspect generated summaries before
using them as release evidence.

## Install the current source

The package is not published to npm yet. Clone the repository and use the
locked pnpm dependencies until a release appears in the registry:

```sh
git clone https://github.com/rogerchappel/mcpcassette.git
cd mcpcassette
corepack enable
pnpm install --frozen-lockfile
npm run build
node dist/src/cli.js --help
node dist/src/cli.js summarize fixtures/basic.jsonl
```

After `npm view @rogerchappel/mcpcassette version` returns a version, the
release can instead be installed with
`npm install --global @rogerchappel/mcpcassette`.

## CLI Quickstart

Print CLI help from the built checkout:

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

The format option accepts `text` (the default) or `json`, using either
`--format` or `-f`. The command accepts exactly one cassette path and at most
one format option; unknown flags, extra arguments, missing values, and repeated
format options are errors.

The current CLI reads existing cassette files; recording and replay orchestration
belong in follow-up milestones.

## Cassette schema

Each non-empty JSONL line is an object with a canonical ISO 8601 UTC
`timestamp` in the format emitted by `Date.prototype.toISOString()` (for
example, `2026-01-01T00:00:00.000Z`), a `direction` of `client` or `server`,
and a JSON-RPC 2.0 `body`. Calendar dates and times must exist; offsets,
omitted milliseconds, and other non-canonical representations are rejected.
The body is the
canonical source for `method` and `id`. Writers may repeat `method` or `id` on
the outer object for compatibility, but any repeated value must exactly match
the body or parsing fails with the line number.

The body must be a JSON-RPC 2.0 request/notification (`method`, optional object
or array `params`, and an optional string, number, or null `id`) or response (an
`id` and exactly one of `result` or `error`). An error object requires an integer
`code` and string `message`. Body-only entries are supported and are preferred
for hand-authored fixtures.

The public `entryFromMessage` helper validates its JSON-RPC body and explicit
timestamp before returning an entry. Invalid messages therefore fail with a
`JSON-RPC body ...` diagnostic, and invalid or non-canonical timestamps fail
with `timestamp must be a valid ISO 8601 UTC timestamp`, before callers can
pass an invalid entry to `formatCassette` or `writeCassette`.

Summary request, response, and notification counts come from those validated
body shapes, regardless of whether the message travels from client to server or
server to client. The separate `clientMessages` and `serverMessages` counts
retain the transport direction.

## Package contents

The npm package allowlist includes the runtime files plus the public support
documents needed for release review: `README.md`, `LICENSE`, `SECURITY.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
Run `npm run package:smoke` before publishing to confirm those files are still
present in the tarball. The package smoke builds the project, runs
`npm pack --dry-run`, and fails if required runtime or support files are missing
or compiled tests appear in the npm file list.

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

## Release process

Release tags must exactly match the version in `package.json` (for example,
package version `0.1.0` is released from tag `v0.1.0`). The tag workflow runs
all release checks, creates one tarball, publishes that validated tarball to npm
with trusted publishing and provenance, and creates the GitHub release only
after publishing succeeds. The npm trusted publisher must be configured for
this repository and `.github/workflows/release.yml`; no long-lived npm token is
used by the workflow.
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
