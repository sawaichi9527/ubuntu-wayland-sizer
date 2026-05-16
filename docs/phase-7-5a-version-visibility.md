# Phase 7.5a — Version Visibility

## Goal

Phase 7.5a starts the release-readiness track by making the running extension version visible from the lightweight popup UI.

The goal is simple:

```text
Ubuntu Wayland Sizer · v<metadata.version>
```

This helps validation runs confirm which deployed build is active without adding a settings app, D-Bus service, panel indicator, or any heavier UI layer.

## Scope

Included:

```text
- Show extension version in the popup title
- Read the value from extension metadata
- Keep the title usable when version metadata is missing
- Keep implementation extension-only
- Keep popup layout and runtime controls unchanged
```

Excluded:

```text
- GTK settings application
- D-Bus service
- Panel indicator
- Preferences window
- Localization framework
- Release packaging automation
```

## Intended UI Behavior

When `extension/metadata.json` contains:

```json
{
  "name": "Ubuntu Wayland Sizer",
  "version": 1
}
```

The popup title should render as:

```text
Ubuntu Wayland Sizer · v1
```

If the metadata version is unavailable, the popup should fall back to:

```text
Ubuntu Wayland Sizer
```

## Recommended Implementation

Add two small helpers to `UbuntuWaylandSizerExtension`:

```js
_getExtensionVersionLabel() {
    const version = this.metadata?.version;

    if (version === undefined || version === null)
        return '';

    const versionText = String(version).trim();
    return versionText ? `v${versionText}` : '';
}

_getPopupTitle() {
    const versionLabel = this._getExtensionVersionLabel();
    return versionLabel ? `Ubuntu Wayland Sizer · ${versionLabel}` : 'Ubuntu Wayland Sizer';
}
```

Then replace the popup title label text with:

```js
text: this._extension._getPopupTitle(),
```

This keeps version visibility sourced from the same metadata GNOME Shell already loads for the extension.

## Validation

After deployment and logout/login if needed:

```bash
./scripts/install-extension-dev.sh
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
sleep 1
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Open the popup:

```text
Super + Alt + Space
```

Expected result:

```text
Ubuntu Wayland Sizer · v1
```

Also confirm existing runtime controls still work:

```text
Log: Debug  -> Switch to Normal
Log: Normal -> Switch to Debug
```

## Phase Status

```text
Phase 7.5a target: version visibility
Status: implementation-ready
```
