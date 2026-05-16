#!/usr/bin/env bash
set -euo pipefail

UUID="ubuntu-wayland-sizer@sawaichi9527"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
SCHEMA_FILE="org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml"
SCHEMA_SRC="$SRC_DIR/extension/schemas/$SCHEMA_FILE"
SCHEMA_DEST="$DEST/schemas"

if [[ ! -f "$SRC_DIR/extension/metadata.json" ]]; then
  echo "ERROR: missing extension/metadata.json" >&2
  exit 1
fi

if [[ ! -f "$SRC_DIR/extension/extension.js" ]]; then
  echo "ERROR: missing extension/extension.js" >&2
  exit 1
fi

if [[ ! -f "$SCHEMA_SRC" ]]; then
  echo "ERROR: missing $SCHEMA_SRC" >&2
  echo "Run: git pull" >&2
  exit 1
fi

echo "Installing development extension to: $DEST"
rm -rf "$DEST"
mkdir -p "$SCHEMA_DEST"

cp "$SRC_DIR/extension/metadata.json" "$DEST/"
cp "$SRC_DIR/extension/extension.js" "$DEST/"
cp "$SCHEMA_SRC" "$SCHEMA_DEST/"

glib-compile-schemas "$SCHEMA_DEST"

if [[ ! -f "$SCHEMA_DEST/gschemas.compiled" ]]; then
  echo "ERROR: schema compilation did not produce gschemas.compiled" >&2
  exit 1
fi

echo "Installed files:"
find "$DEST" -maxdepth 3 -type f -print | sort

echo
echo "metadata settings-schema:"
grep -n 'settings-schema' "$DEST/metadata.json" || true

echo
echo "Schema compiled successfully."
echo "Next: log out/in or restart GNOME Shell, then run:"
echo "  gnome-extensions enable $UUID"
