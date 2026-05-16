# Phase 7.5b — Version Visibility

## Purpose

Phase 7.5b adds lightweight version visibility to the existing popup title.

This helps local validation confirm which deployed build is running without adding a panel indicator, GTK settings UI, D-Bus service, or background daemon.

## Scope

Included:

```text
- show the extension metadata version in the popup title
- keep the version source as extension/metadata.json
- keep the popup layout unchanged
- keep runtime controls unchanged
- keep panel indicator deferred
```

Excluded:

```text
- panel indicator
- preferences window
- GTK settings application
- D-Bus service
- release packaging automation
- schema changes
```

## Version Source Rule

The displayed version comes from GNOME Shell extension metadata:

```json
{
  "version": 1
}
```

The popup should render:

```text
Ubuntu Wayland Sizer · v1
```

If the metadata version is missing or empty, the popup should fall back to:

```text
Ubuntu Wayland Sizer
```

## Implementation

The implementation is intentionally small:

```text
- replace the hard-coded popup title with _getPopupTitle()
- add _getExtensionVersionLabel()
- add _getPopupTitle()
```

No preset geometry logic is changed.

No protected-core workaround is touched.

## Validation

After applying the patch and deploying:

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

Expected popup title:

```text
Ubuntu Wayland Sizer · v1
```

Also verify the existing popup runtime controls still work:

```text
Log: Debug  -> Switch to Normal
Log: Normal -> Switch to Debug
```

## Pass Criteria

Phase 7.5b passes when:

```text
- popup title shows metadata version
- missing/empty metadata version falls back safely to the plain title
- no schema changes are required
- no protected-core geometry behavior changes
- existing popup runtime controls still work
```
