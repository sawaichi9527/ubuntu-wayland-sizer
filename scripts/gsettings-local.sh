#!/usr/bin/env bash
set -euo pipefail

EXTENSION_UUID="ubuntu-wayland-sizer@sawaichi9527"
SCHEMA_ID="org.gnome.shell.extensions.ubuntu-wayland-sizer"
SCHEMA_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXTENSION_UUID}/schemas"

if [[ ! -d "${SCHEMA_DIR}" ]]; then
    echo "Schema directory not found: ${SCHEMA_DIR}" >&2
    echo "Run ./scripts/install-extension-dev.sh first." >&2
    exit 1
fi

if [[ ! -f "${SCHEMA_DIR}/gschemas.compiled" ]]; then
    echo "Compiled schema not found. Compiling schemas..." >&2
    glib-compile-schemas "${SCHEMA_DIR}"
fi

if [[ $# -eq 0 ]]; then
    cat <<EOF
Usage:
  ./scripts/gsettings-local.sh list-keys
  ./scripts/gsettings-local.sh get center-width
  ./scripts/gsettings-local.sh set center-width 1440
  ./scripts/gsettings-local.sh set center-height 768
  ./scripts/gsettings-local.sh reset center-width
  ./scripts/gsettings-local.sh reset center-height

This helper runs gsettings with:
  GSETTINGS_SCHEMA_DIR=${SCHEMA_DIR}
EOF
    exit 0
fi

case "$1" in
    list-keys)
        GSETTINGS_SCHEMA_DIR="${SCHEMA_DIR}" \
            gsettings list-keys "${SCHEMA_ID}"
        ;;
    get)
        if [[ $# -ne 2 ]]; then
            echo "Usage: $0 get <key>" >&2
            exit 1
        fi
        GSETTINGS_SCHEMA_DIR="${SCHEMA_DIR}" \
            gsettings get "${SCHEMA_ID}" "$2"
        ;;
    set)
        if [[ $# -ne 3 ]]; then
            echo "Usage: $0 set <key> <value>" >&2
            exit 1
        fi
        GSETTINGS_SCHEMA_DIR="${SCHEMA_DIR}" \
            gsettings set "${SCHEMA_ID}" "$2" "$3"
        ;;
    reset)
        if [[ $# -ne 2 ]]; then
            echo "Usage: $0 reset <key>" >&2
            exit 1
        fi
        GSETTINGS_SCHEMA_DIR="${SCHEMA_DIR}" \
            gsettings reset "${SCHEMA_ID}" "$2"
        ;;
    *)
        GSETTINGS_SCHEMA_DIR="${SCHEMA_DIR}" \
            gsettings "$@"
        ;;
esac
