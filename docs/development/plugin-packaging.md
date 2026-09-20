# Milestone 11 — Plugin Packaging & Assets

Milestone 11 finalizes the portable Agent Plugin package surface for `v0.9.0`.

## Standards alignment

The root `plugin.json` targets Agent Plugins 1.0.0. That manifest schema is closed, so portable top-level metadata is limited to the fields defined by the standard. Skills are discovered from the fixed `skills/` directory; they are **not** declared as a non-standard top-level `skills` field.

The roadmap's branding, documentation, and explicit skill catalog metadata live under the Cecil-IA Labs extension namespace:

```text
extensions.com.cecilialabs.ffmpeg
```

This preserves Agent Plugins conformance while keeping product-specific packaging metadata machine-readable.

## Portable metadata

`plugin.json` contains:

- name;
- version;
- description;
- author;
- homepage/documentation URL;
- repository;
- license;
- keywords;
- extension metadata.

## Component discovery

The package includes all seven Milestone 10 skills under the standard fixed location:

```text
skills/<skill-name>/SKILL.md
```

The extension skill catalog is descriptive metadata only. Portable clients discover skills from the directory layout.

## Branding

```text
assets/
├── icon.svg
├── icon-dark.svg
├── logo.svg
└── screenshots/
    ├── cli-overview.svg
    └── skills-overview.svg
```

The icons are vector-native and intentionally simple enough for 16, 32, 64, and 128 pixel rendering. No SVG asset depends on external images, stylesheets, scripts, or web fonts.

## Distribution containment

Every file referenced by `plugin.json` is plugin-relative, begins with `./`, and is included by the npm package `files` allowlist.

The package includes:

```text
dist/
assets/
skills/
specs/
docs/
plugin.json
README.md
LICENSE
```

Runtime and plugin components never depend on `legacy/`, `test/`, or repository-only scripts.

## Verification

Static plugin/package verification:

```bash
npm run verify:plugin
```

Actual npm tarball planning after build:

```bash
npm run verify:package
```

`verify:package` executes `npm pack --dry-run --json --ignore-scripts`, validates required distribution files, and rejects repository-only paths if they leak into the tarball.

The full gate is:

```bash
npm run validate
```
