# Phase 7.5d — UX Wording Polish

## Purpose

Phase 7.5d polishes user-facing wording after the Phase 7.5a-c release-readiness work.

This phase is intentionally low-risk.

The goal is to improve clarity and consistency without changing layout behavior, interaction flow, preset semantics, or protected-core geometry logic.

## Scope

Included:

```text
- popup section wording review
- preset group naming consistency
- focused-window wording review
- display/workarea wording review
- runtime log-control wording review
- capitalization and style consistency
- extension metadata description wording
- Extension Manager local/dev display behavior notes
- documentation of preferred terminology
```

Excluded:

```text
- geometry behavior changes
- preset behavior changes
- keybinding changes
- popup layout redesign
- new controls
- GTK settings UI
- D-Bus service
- panel indicator
- i18n/gettext integration
- extensions.gnome.org publishing flow
```

## Guardrails

Do not change protected-core behavior.

Do not modify:

```text
- workarea-based geometry
- full-workarea / maximized-like breakout
- safe restore before resize
- delayed resize ordering
- post-resize correction
- Electron/minimum-width correction
- mixed-scaling handling
```

Do not rename internal preset IDs or GSettings keys during wording polish.

Internal names are implementation details and may remain stable even if UI wording improves.

## Extension Manager Display Notes

GNOME Extension Manager / Extensions app reads `extension/metadata.json` for local extension list display.

Phase 7.5d updates the metadata description from the early PoC-style wording:

```text
Minimal GNOME Shell Extension baseline for Wayland window sizing experiments.
```

to a more user-facing description:

```text
Resize and position the focused window with Sizer-style presets for GNOME Shell on Ubuntu Wayland.
```

### Version display

Extension Manager displays the integer metadata version:

```text
1
```

This is expected for the current development baseline.

The popup title formats the same metadata version as:

```text
Ubuntu Wayland Sizer · v1.0
```

This difference is intentional:

```text
- metadata.json keeps GNOME Shell extension version as an integer
- popup UI formats that integer as vN.0 for release-oriented visibility
```

### Detail-page error for local/dev extension

For an unpublished local development extension, clicking:

```text
View Details
```

may open an error page such as:

```text
發生錯誤
無擴充功能詳細資訊
```

This is currently treated as non-blocking and expected for the local/dev baseline.

Reason:

```text
The extension is installed locally and is not published on extensions.gnome.org, so Extension Manager may not have an online detail page to display.
```

This does not indicate that Ubuntu Wayland Sizer failed to load or that runtime behavior is broken.

Use the following checks instead:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
journalctl --user -f -o cat /usr/bin/gnome-shell | grep ubuntu-wayland-sizer
```

## Current Popup Wording Baseline

Current popup structure:

```text
Ubuntu Wayland Sizer · v1.0

Focused Window                         Log control
Current Displays
Center Presets
Window Positions
Saved Presets
Actions
```

Current built-in group names:

```text
Center Presets
Window Positions
```

Current runtime log control wording:

```text
Log: Debug
Switch to Normal

Log: Normal
Switch to Debug
```

## Preferred Terminology

### Preset groups

Preferred group names:

```text
Center Presets
Position Presets
Saved Presets
Actions
```

Reason:

```text
"Position Presets" matches "Center Presets" and makes the group sound like a set of selectable presets rather than a descriptive window state.
```

### Display section

Preferred display section name:

```text
Displays
```

Alternative acceptable wording:

```text
Current Displays
```

Recommendation:

```text
Keep Current Displays if changing it adds little value.
```

Reason:

```text
The section is already clear, and changing it is optional.
```

### Focused-window section

Preferred wording:

```text
Focused Window
Current preset: <preset>
Display <n> · <label> · <size> · frame <x>,<y>
Workarea <x>,<y> <w>x<h> · relative <x>,<y>
```

Recommendation:

```text
Keep the current focused-window wording for Phase 7.5d unless validation shows confusion.
```

Reason:

```text
The current text is compact and useful for development validation.
```

### Log control

Preferred wording stays:

```text
Log: Debug
Switch to Normal

Log: Normal
Switch to Debug
```

Reason:

```text
The control is small and clear. It is not a full settings UI.
```

## Proposed Minimal Runtime Change

The safest useful runtime wording change is:

```text
Window Positions
↓
Position Presets
```

This change only affects a popup group title.

It does not change:

```text
- preset IDs
- keybindings
- geometry calculations
- popup structure
- custom preset storage
- schemas
```

## Optional Runtime Change

Optional, if desired after review:

```text
Current Displays
↓
Displays
```

Recommendation:

```text
Do not apply this unless the shorter wording is clearly preferred.
```

## Suggested Implementation

Minimal patch:

```js
Object.freeze({ title: 'Window Positions', presets: Object.freeze([PRESETS.LEFT, PRESETS.RIGHT, PRESETS.FULL]) }),
```

becomes:

```js
Object.freeze({ title: 'Position Presets', presets: Object.freeze([PRESETS.LEFT, PRESETS.RIGHT, PRESETS.FULL]) }),
```

## Validation

After applying the wording change:

```bash
./scripts/install-extension-dev.sh
gnome-extensions disable ubuntu-wayland-sizer@sawaichi9527
sleep 1
gnome-extensions enable ubuntu-wayland-sizer@sawaichi9527
```

Open popup:

```text
Super + Alt + Space
```

Expected result:

```text
Center Presets
Position Presets
Saved Presets
Actions
```

Also confirm:

```text
- Left half still applies
- Right half still applies
- Full workarea still applies
- Center cycling still works
- no TypeError / ReferenceError appears in logs
```

## Future Release Checklist Note

Before a formal public release, revisit Extension Manager integration:

```text
- publish or prepare for publishing on extensions.gnome.org
- confirm View Details no longer shows the local/dev detail-page error
- confirm update-check Not Found warning is resolved or documented for release builds
```

This is intentionally deferred from Phase 7.5d because the current branch is still a local/dev release-readiness baseline.

## Pass Criteria

Phase 7.5d passes when:

```text
- UX wording policy is documented
- Extension Manager local/dev display behavior is documented
- metadata description is user-facing
- any runtime wording change is limited to low-risk popup labels
- no geometry behavior changes are introduced
- no schema changes are introduced
- no keybinding changes are introduced
- popup remains readable
```
