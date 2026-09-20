# Installation

## Recommended global CLI installation

Install the package globally when you want the canonical `cecilia-ffmpeg` command to be available directly from the shell:

```bash
npm install -g @cecilialabs/ffmpeg
```

Then run:

```bash
cecilia-ffmpeg --help
cecilia-ffmpeg doctor
cecilia-ffmpeg environment capabilities --json
```

For an MCP host, configure the installed stdio server:

```json
{
  "mcpServers": {
    "cecilia-ffmpeg": {
      "command": "cecilia-ffmpeg-mcp"
    }
  }
}
```

See [MCP Server](mcp.md) for the tool catalog, safety model, and no-global-install configuration.

The executables are provided by the package `bin` mapping:

```json
{
  "bin": {
    "cecilia-ffmpeg": "./dist/cli.js",
    "cecilia-ffmpeg-mcp": "./dist/mcp.js"
  }
}
```

`cecilia-ffmpeg` is the human/automation CLI. `cecilia-ffmpeg-mcp` is the local stdio MCP server introduced in v1.1.0.

npm creates the executable link automatically. The package deliberately has **no `postinstall` shell mutation**.

## Run without installing globally

Because the package exposes both `cecilia-ffmpeg` and `cecilia-ffmpeg-mcp`, package-runner usage must name the intended executable explicitly:

```bash
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg doctor
```

For the MCP server:

```bash
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg-mcp
```

Or install as a project dependency:

```bash
npm install @cecilialabs/ffmpeg
npx cecilia-ffmpeg doctor
```

All subsequent CLI examples in the public documentation assume the recommended global installation and therefore use `cecilia-ffmpeg ...` directly.

## Local development checkout

Repository contributors can expose the compiled checkout as a global command without installing the published package:

```bash
npm run setup:cli
```

The interactive setup asks for permission before it:

1. builds the TypeScript project;
2. runs the local npm link flow;
3. checks whether `cecilia-ffmpeg` is already in `PATH`;
4. only if necessary, offers to add the npm global bin directory to `~/.bashrc`.

The shell modification is explicit, opt-in, Bash-specific, and written as an idempotent managed block. If the npm global bin directory is already in `PATH`, `~/.bashrc` is not changed.

Equivalent manual development commands:

```bash
npm run build
npm link
cecilia-ffmpeg --help
```

Remove the development link with:

```bash
npm run unlink:cli
```

## Runtime requirements

- Node.js: `>=22.0.0`
- minimum supported FFmpeg: `6.1`
- FFprobe is required for media inspection and output validation

Binary resolution follows the configured environment unless overridden:

```bash
cecilia-ffmpeg doctor \
  --ffmpeg-path /opt/ffmpeg/bin/ffmpeg \
  --ffprobe-path /opt/ffmpeg/bin/ffprobe
```

## Verify the environment

```bash
cecilia-ffmpeg doctor
cecilia-ffmpeg environment capabilities --json
```

A successful `doctor` confirms binary resolution and inspects available capabilities. In v1.2, hardware encoding selection performs an additional runtime usability probe before choosing an accelerator; capability discovery alone still does not prove that a device is usable.

## Packaging and release lifecycle

`npm pack` invokes:

```text
prepack -> npm run build
```

Publication retains the existing quality gate:

```text
prepublishOnly -> npm run validate:release
```

Repository maintainers also have `scripts/publish-npm.sh`, which is intentionally excluded from the npm package. Its release flow is:

```text
clean master
  -> origin/master parity
  -> npm authentication
  -> duplicate-version check
  -> npm run validate:release
  -> npm pack
  -> tarball inspection
  -> npm publish
  -> registry verification
  -> optional annotated Git tag + push
```

Dry-run from a feature branch:

```bash
./scripts/publish-npm.sh --dry-run --allow-non-master
```

Actual publication is restricted to a clean `master` matching `origin/master`:

```bash
./scripts/publish-npm.sh
```

## Plugin distribution

The npm package also contains the Agent Plugin manifest, Skills, assets, specs, and documentation. Repository-only setup, test, and release scripts are not shipped in the npm tarball.

## Platform notes

Linux is the full release-validation platform for v1. macOS and Windows receive clean-install and CLI/doctor smoke validation in the release workflow. Camera capture uses V4L2 on Linux, AVFoundation on macOS, and DirectShow on Windows when selected.

Platform-specific FFmpeg installation is intentionally outside the toolkit's runtime responsibility.

See [Platform support & release validation](platform-support.md) for the v1 test matrix and hosted-CI limitations.
