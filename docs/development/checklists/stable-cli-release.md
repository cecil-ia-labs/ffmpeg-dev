# Stable CLI Release — Completion Checklist

**Target:** `v1.0.0`  
**Status:** 🚧 In progress

## Stable contract

- [x] Freeze npm package, plugin, executable, Node, FFmpeg and license identities.
- [x] Freeze global CLI option and top-level command contract.
- [x] Synchronize package/plugin/source/lockfile version to `1.0.0`.
- [x] Establish stable semantic-version format.
- [x] Add public npm publish configuration.
- [x] Add `verify:release`.
- [x] Add `validate:release`.
- [x] Make npm publication use the release validation gate.

## Compatibility

- [ ] Confirm CLI architecture is stable under full validation.
- [ ] Confirm core/public package APIs are stable.
- [x] Preserve all 21 historical migration mappings.
- [ ] Run all seven Skill validations under the v1 release gate.
- [ ] Confirm plugin installation from the packed artifact.
- [ ] Confirm no runtime dependency on historical `.sh` implementations.

## Platform evidence

- [ ] Linux full release validation.
- [ ] macOS smoke test.
- [ ] Windows smoke test and documented strategy.

## Distribution evidence

- [ ] Clean installation from generated `.tgz`.
- [ ] Verify `cecilia-ffmpeg --version` from clean install.
- [ ] Verify `cecilia-ffmpeg --help` from clean install.
- [ ] Final npm package contents inspected.
- [ ] Final publication dry-run.
- [ ] npm package ready for public publication.

## Release documentation

- [ ] Final README review.
- [ ] Final installation guide review.
- [ ] Final changelog review.
- [ ] Record platform validation evidence.
- [ ] Mark roadmap release requirements complete.

## Final release

- [ ] `npm run validate:release`.
- [ ] Merge Milestone 15.
- [ ] Publish `@cecilialabs/ffmpeg@1.0.0`.
- [ ] Verify npm registry.
- [ ] Create/push `v1.0.0` annotated Git tag after registry verification.
