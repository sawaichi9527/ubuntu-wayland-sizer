#!/usr/bin/env bash
set -euo pipefail

EXTENSION_UUID="ubuntu-wayland-sizer@sawaichi9527"
SCHEMA_ID="org.gnome.shell.extensions.ubuntu-wayland-sizer"
SCHEMA_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXTENSION_UUID}/schemas"
DEFAULT_CENTER_WIDTH="1280"
DEFAULT_CENTER_HEIGHT="720"

run_gsettings() {
    GSETTINGS_SCHEMA_DIR="${SCHEMA_DIR}" gsettings "$@"
}

show_usage() {
    cat <<EOF
Usage:
  ./scripts/gsettings-local.sh list-keys

Center preset shortcuts:
  ./scripts/gsettings-local.sh get-center
  ./scripts/gsettings-local.sh set-center 1440x768
  ./scripts/gsettings-local.sh set-center 800x600
  ./scripts/gsettings-local.sh reset-center

Raw gsettings passthrough:
  ./scripts/gsettings-local.sh get center-width
  ./scripts/gsettings-local.sh set center-width 1440
  ./scripts/gsettings-local.sh set center-height 768
  ./scripts/gsettings-local.sh reset center-width

Debug logging:
  ./scripts/gsettings-local.sh get debug-logging
  ./scripts/gsettings-local.sh set debug-logging false

This helper runs gsettings with:
  GSETTINGS_SCHEMA_DIR=${SCHEMA_DIR}
EOF
}

validate_center_size() {
    local size="$1"

    if [[ ! "${size}" =~ ^[0-9]+x[0-9]+$ ]]; then
        echo "Invalid center size: ${size}" >&2
        echo "Expected format: WIDTHxHEIGHT, for example 1440x768" >&2
        exit 1
    fi

    local width="${size%x*}"
    local height="${size#*x}"

    if (( width < 100 || height < 100 )); then
        echo "Invalid center size: ${size}" >&2
        echo "Both width and height must be >= 100." >&2
        exit 1
    fi

    echo "${width} ${height}"
}

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
    show_usage
    exit 0
fi

case "$1" in
    list-keys)
        run_gsettings list-keys "${SCHEMA_ID}"
        ;;
    get-center)
        width="$(run_gsettings get "${SCHEMA_ID}" center-width)"
        height="$(run_gsettings get "${SCHEMA_ID}" center-height)"
        echo "${width}x${height}"
        ;;
    set-center)
        if [[ $# -ne 2 ]]; then
            echo "Usage: $0 set-center WIDTHxHEIGHT" >&2
            exit 1
        fi
        read -r width height < <(validate_center_size "$2")
        run_gsettings set "${SCHEMA_ID}" center-width "${width}"
        run_gsettings set "${SCHEMA_ID}" center-height "${height}"
        echo "center=${width}x${height}"
        ;;
    reset-center)
        run_gsettings reset "${SCHEMA_ID}" center-width
        run_gsettings reset "${SCHEMA_ID}" center-height
        echo "center=${DEFAULT_CENTER_WIDTH}x${DEFAULT_CENTER_HEIGHT}"
        ;;
    get)
        if [[ $# -ne 2 ]]; then
            echo "Usage: $0 get <key>" >&2
            exit 1
        fi
        run_gsettings get "${SCHEMA_ID}" "$2"
        ;;
    set)
        if [[ $# -ne 3 ]]; then
            echo "Usage: $0 set <key> <value>" >&2
            exit 1
        fi
        run_gsettings set "${SCHEMA_ID}" "$2" "$3"
        ;;
    reset)
        if [[ $# -ne 2 ]]; then
            echo "Usage: $0 reset <key>" >&2
            exit 1
        fi
        run_gsettings reset "${SCHEMA_ID}" "$2"
        ;;
    *)
        run_gsettings "$@"
        ;;
esac
