# Debug GNOME Shell Extension Startup

This document is the first debugging checklist for Ubuntu Wayland Sizer.

The project should not proceed to hotkeys, D-Bus, or GTK UI until this checklist passes.

## 1. Confirm GNOME Shell Version

```bash
gnome-shell --version
```

Expected target:

```text
GNOME Shell 50.x
```

If testing on a different shell version, update `extension/metadata.json` temporarily or use a separate compatibility branch.

## 2. Install Extension Manually During Development

Use the extension UUID from `metadata.json`.

```bash
UUID="ubuntu-wayland-sizer@sawaichi9527"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"

rm -rf "$DEST"
mkdir -p "$DEST"
cp extension/metadata.json extension/extension.js "$DEST/"
```

## 3. Restart or Reload GNOME Shell

On a Wayland session, the safest manual test path is to log out and log back in.

After logging back in, verify that GNOME Shell sees the extension:

```bash
gnome-extensions list | grep ubuntu-wayland-sizer
```

## 4. Inspect Extension Info

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Look for:

- Correct path
- Correct UUID
- No parse errors
- No incompatible shell-version error

## 5. Watch Logs

In a terminal:

```bash
journalctl --user -f -o cat /usr/bin/gnome-shell
```

If the command does not show useful logs on the target Ubuntu release, try:

```bash
journalctl --user -f | grep -i "ubuntu-wayland-sizer\|gnome-shell"
```

## 6. Enable the Extension

```bash
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Expected log:

```text
[ubuntu-wayland-sizer] enabled
```

## 7. Disable the Extension

```bash
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
```

Expected log:

```text
[ubuntu-wayland-sizer] disabled
```

## 8. Common Failure: default is not a constructor

If GNOME Shell reports:

```text
TypeError: extensionModule.default is not a constructor
```

Do not patch around it with prototype tricks.

Instead verify:

1. `extension.js` uses a standard default class export.
2. The class extends `Extension` from `resource:///org/gnome/shell/extensions/extension.js`.
3. `metadata.json` has the correct shell version.
4. No imported module throws during module load.
5. The installed files are the files you just edited.

The minimal valid shape should look like:

```js
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class UbuntuWaylandSizerExtension extends Extension {
    enable() {
        console.log('[ubuntu-wayland-sizer] enabled');
    }

    disable() {
        console.log('[ubuntu-wayland-sizer] disabled');
    }
}
```

## 9. Stop Rule

If the lifecycle baseline fails, do not add any of the following:

- Imports
- Managers
- D-Bus service
- Hotkeys
- UI actors
- Timers
- Signal handlers

Fix lifecycle first.
