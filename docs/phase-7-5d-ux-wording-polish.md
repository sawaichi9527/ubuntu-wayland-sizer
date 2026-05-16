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

## Pass Criteria

Phase 7.5d passes when:

```text
- UX wording policy is documented
- any runtime wording change is limited to low-risk popup labels
- no geometry behavior changes are introduced
- no schema changes are introduced
- no keybinding changes are introduced
- popup remains readable
```
