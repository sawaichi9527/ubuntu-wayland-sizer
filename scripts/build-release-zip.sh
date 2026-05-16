#!/usr/bin/env bash
set -euo pipefail

EXTENSION_UUID="ubuntu-wayland-sizer@sawaichi9527"
EXTENSION_DIR="extension"
BUILD_DIR="build"
RELEASE_DIR="${BUILD_DIR}/release"
PACKAGE_DIR="${RELEASE_DIR}/${EXTENSION_UUID}"

if ! command -v glib-compile-schemas >/dev/null 2>&1; then
  echo "ERROR: glib-compile-schemas not found"
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "ERROR: zip not found"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found"
  exit 1
fi

if [[ ! -f "${EXTENSION_DIR}/metadata.json" ]]; then
  echo "ERROR: ${EXTENSION_DIR}/metadata.json not found"
  exit 1
fi

METADATA_VERSION="$(python3 - <<'PY'
import json
from pathlib import Path

metadata = json.loads(Path("extension/metadata.json").read_text())
print(metadata["version"])
PY
)"

SHELL_VERSION="$(python3 - <<'PY'
import json
from pathlib import Path

metadata = json.loads(Path("extension/metadata.json").read_text())
shell_versions = metadata.get("shell-version", [])
if not shell_versions:
    raise SystemExit("metadata shell-version is empty")
print(shell_versions[0])
PY
)"

DISPLAY_VERSION="v${METADATA_VERSION}.0"
ZIP_NAME="ubuntu-wayland-sizer-${DISPLAY_VERSION}-gnome${SHELL_VERSION}.zip"
ZIP_PATH="${BUILD_DIR}/${ZIP_NAME}"

echo "Building Ubuntu Wayland Sizer release package"
echo "Extension UUID: ${EXTENSION_UUID}"
echo "Metadata version: ${METADATA_VERSION}"
echo "Display version: ${DISPLAY_VERSION}"
echo "GNOME Shell version: ${SHELL_VERSION}"
echo "Output: ${ZIP_PATH}"

rm -rf "${RELEASE_DIR}"
mkdir -p "${PACKAGE_DIR}"

cp "${EXTENSION_DIR}/extension.js" "${PACKAGE_DIR}/"
cp "${EXTENSION_DIR}/metadata.json" "${PACKAGE_DIR}/"
cp -r "${EXTENSION_DIR}/schemas" "${PACKAGE_DIR}/"

glib-compile-schemas "${PACKAGE_DIR}/schemas"

rm -f "${ZIP_PATH}"

(
  cd "${RELEASE_DIR}"
  zip -r "../${ZIP_NAME}" "${EXTENSION_UUID}" >/dev/null
)

echo
echo "Release package created:"
echo "${ZIP_PATH}"
echo
echo "Inspect with:"
echo "unzip -l ${ZIP_PATH}"
