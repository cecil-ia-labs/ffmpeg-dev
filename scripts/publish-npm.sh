#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PACK_DIR="${ROOT_DIR}/.npm-pack"
DRY_RUN=false
SKIP_VALIDATE=false
ALLOW_NON_MASTER=false
TAG=""
OTP=""

if [[ -t 1 ]]; then
  RESET=$'\033[0m'
  BOLD=$'\033[1m'
  CYAN=$'\033[38;2;0;210;255m'
  GREEN=$'\033[38;2;0;255;140m'
  YELLOW=$'\033[93m'
  RED=$'\033[91m'
else
  RESET=""
  BOLD=""
  CYAN=""
  GREEN=""
  YELLOW=""
  RED=""
fi

info()    { printf "%s%s→%s %s\n" "$BOLD" "$CYAN" "$RESET" "$*"; }
success() { printf "%s%s✓%s %s\n" "$BOLD" "$GREEN" "$RESET" "$*"; }
warn()    { printf "%s%s!%s %s\n" "$BOLD" "$YELLOW" "$RESET" "$*"; }
fail()    { printf "%s%s✗%s %s\n" "$BOLD" "$RED" "$RESET" "$*" >&2; exit 1; }
section() { printf "\n%s%s== %s ==%s\n\n" "$BOLD" "$CYAN" "$*" "$RESET"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-validate)
      SKIP_VALIDATE=true
      shift
      ;;
    --allow-non-master)
      ALLOW_NON_MASTER=true
      shift
      ;;
    --tag)
      [[ $# -ge 2 ]] || fail "--tag requires a value"
      TAG="$2"
      shift 2
      ;;
    --otp)
      [[ $# -ge 2 ]] || fail "--otp requires a value"
      OTP="$2"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
Usage:
  ./scripts/publish-npm.sh [options]

Options:
  --dry-run             Pack and run npm publish --dry-run without publishing
  --skip-validate       Skip npm run validate
  --allow-non-master    Permit a dry-run from a non-master branch
  --tag <tag>           npm dist-tag (latest, next, beta, alpha, ...)
  --otp <code>          npm 2FA one-time password
  -h, --help            Show this help

Release flow:
  clean master -> validate -> pack -> inspect -> publish -> verify -> git tag
EOF
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

command -v node >/dev/null 2>&1 || fail "Node.js is not installed"
command -v npm >/dev/null 2>&1 || fail "npm is not installed"
command -v git >/dev/null 2>&1 || fail "git is not installed"
command -v tar >/dev/null 2>&1 || fail "tar is not installed"
[[ -f package.json ]] || fail "package.json was not found"

PACKAGE_NAME="$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).name")"
PACKAGE_VERSION="$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version")"

[[ -n "$PACKAGE_NAME" ]] || fail "package.json does not define a package name"
[[ -n "$PACKAGE_VERSION" ]] || fail "package.json does not define a version"

if [[ -z "$TAG" ]]; then
  if [[ "$PACKAGE_VERSION" == *-* ]]; then
    TAG="next"
  else
    TAG="latest"
  fi
fi

section "Release"
printf "Package:  %s%s%s\n" "$BOLD" "$PACKAGE_NAME" "$RESET"
printf "Version:  %s%s%s\n" "$BOLD" "$PACKAGE_VERSION" "$RESET"
printf "Tag:      %s%s%s\n" "$BOLD" "$TAG" "$RESET"
printf "Registry: %s\n" "$(npm config get registry)"

section "Git safety"

CURRENT_BRANCH="$(git branch --show-current)"
[[ -n "$CURRENT_BRANCH" ]] || fail "Detached HEAD is not supported for publishing"

if [[ "$CURRENT_BRANCH" != "master" && "$ALLOW_NON_MASTER" != true ]]; then
  fail "Publishing is restricted to master. Current branch: $CURRENT_BRANCH"
fi

if [[ "$CURRENT_BRANCH" != "master" && "$DRY_RUN" != true ]]; then
  fail "--allow-non-master is accepted only together with --dry-run"
fi

[[ -z "$(git status --porcelain)" ]] || {
  git status --short
  fail "Working tree is not clean"
}

success "Working tree is clean on $CURRENT_BRANCH"

if [[ "$CURRENT_BRANCH" == "master" ]]; then
  info "Fetching origin/master..."
  git fetch origin master --quiet
  LOCAL_HEAD="$(git rev-parse HEAD)"
  REMOTE_HEAD="$(git rev-parse origin/master)"
  [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" ]] || fail "Local master is not identical to origin/master"
  success "master matches origin/master"
fi

section "npm authentication"

if ! NPM_USER="$(npm whoami 2>/dev/null)"; then
  fail "npm authentication failed. Run: npm login"
fi
success "Authenticated as $NPM_USER"

section "Version check"

VERSIONS_FILE="$(mktemp)"
ERROR_FILE="$(mktemp)"
trap 'rm -f "$VERSIONS_FILE" "$ERROR_FILE"' EXIT

if npm view "$PACKAGE_NAME" versions --json >"$VERSIONS_FILE" 2>"$ERROR_FILE"; then
  if node - "$VERSIONS_FILE" "$PACKAGE_VERSION" <<'NODE'
const fs = require("fs");
const versions = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const target = process.argv[3];
const list = Array.isArray(versions) ? versions : versions ? [versions] : [];
process.exit(list.includes(target) ? 0 : 1);
NODE
  then
    fail "$PACKAGE_NAME@$PACKAGE_VERSION already exists on npm"
  fi
else
  if grep -q "E404" "$ERROR_FILE"; then
    info "Package is not present in the registry yet; this appears to be the first publish."
  else
    cat "$ERROR_FILE" >&2
    fail "Unable to query npm versions"
  fi
fi
success "$PACKAGE_NAME@$PACKAGE_VERSION is available for publication"

if [[ "$SKIP_VALIDATE" != true ]]; then
  section "Validation"
  npm run validate
  success "Validation passed"
else
  warn "Validation skipped by explicit request"
fi

section "Pack"

rm -rf "$PACK_DIR"
mkdir -p "$PACK_DIR"

npm pack --pack-destination "$PACK_DIR"

shopt -s nullglob
TARBALLS=("$PACK_DIR"/*.tgz)
shopt -u nullglob

[[ ${#TARBALLS[@]} -eq 1 ]] || fail "Expected exactly one .tgz in $PACK_DIR"
TARBALL="${TARBALLS[0]}"

success "Created $(basename "$TARBALL")"
printf "\nPackage contents:\n"
tar -tzf "$TARBALL" | sed 's/^/  /'

if [[ "$DRY_RUN" == true ]]; then
  section "Publish dry-run"
  PUBLISH_ARGS=("$TARBALL" --access public --tag "$TAG" --dry-run)
  [[ -z "$OTP" ]] || PUBLISH_ARGS+=(--otp "$OTP")
  npm publish "${PUBLISH_ARGS[@]}"
  success "Dry-run completed; tarball preserved at $TARBALL"
  exit 0
fi

section "Publish"
printf "Publish %s@%s with dist-tag %s? [y/N] " "$PACKAGE_NAME" "$PACKAGE_VERSION" "$TAG"
read -r CONFIRM
case "$CONFIRM" in
  y|Y|yes|YES) ;;
  *) warn "Publication cancelled"; exit 0 ;;
esac

PUBLISH_ARGS=("$TARBALL" --access public --tag "$TAG")
[[ -z "$OTP" ]] || PUBLISH_ARGS+=(--otp "$OTP")
npm publish "${PUBLISH_ARGS[@]}"

section "Registry verification"

VERIFIED=false
for DELAY in 0 3 7 12; do
  [[ "$DELAY" -eq 0 ]] || sleep "$DELAY"
  PUBLISHED_VERSION="$(npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version 2>/dev/null || true)"
  if [[ "$PUBLISHED_VERSION" == "$PACKAGE_VERSION" ]]; then
    VERIFIED=true
    break
  fi
done

if [[ "$VERIFIED" == true ]]; then
  success "Verified $PACKAGE_NAME@$PACKAGE_VERSION on npm"
else
  warn "npm accepted the publish, but registry propagation could not yet be verified"
  warn "Git tagging is intentionally stopped until the published version can be verified."
  exit 2
fi

section "Git tag"

GIT_TAG="v$PACKAGE_VERSION"
if git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
  warn "Git tag $GIT_TAG already exists locally"
elif git ls-remote --exit-code --tags origin "refs/tags/$GIT_TAG" >/dev/null 2>&1; then
  warn "Git tag $GIT_TAG already exists on origin"
else
  printf "Create and push annotated Git tag %s? [Y/n] " "$GIT_TAG"
  read -r TAG_CONFIRM
  case "$TAG_CONFIRM" in
    n|N|no|NO)
      warn "Git tag was not created"
      ;;
    *)
      git tag -a "$GIT_TAG" -m "FFmpeg Media Toolkit $GIT_TAG"
      git push origin "$GIT_TAG"
      success "Created and pushed $GIT_TAG"
      ;;
  esac
fi

echo
success "Release flow complete"
