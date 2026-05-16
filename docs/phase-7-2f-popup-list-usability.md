# Phase 7.2f — Popup List Usability

## Goal

Phase 7.2f improves the popup usability after Phase 7.2e added saved presets, monitor affinity, Unicode names, and per-record deletion.

The problem is no longer geometry capability. The problem is list usability as saved presets accumulate.

---

# Scope

Included:

- make popup content scrollable when the list grows
- make popup layout more compact
- reduce vertical spacing in Saved Presets rows
- refresh/reopen popup after deleting a saved preset
- keep built-in preset behavior unchanged
- keep saved preset apply/delete behavior unchanged

Excluded:

- rename saved preset
- grouping/reordering
- import/export
- configure dialog
- panel indicator
- full i18n framework

---

# UX Goals

## Before

When many saved presets exist:

```text
popup grows too tall
Saved Presets list pushes Actions/Close downward
Delete requires reopening popup manually to confirm the updated list
```

## After

When many saved presets exist:

```text
popup remains within a sane screen height
Saved Presets area is scrollable
rows are compact
Delete confirmation returns to an updated popup automatically
```

---

# Popup Layout Strategy

Use a scroll container around the main content area.

Recommended layout:

```text
Ubuntu Wayland Sizer

[scrollable content]
  Focused Window compact summary
  Current Displays compact summary
  Center Presets
  Window Positions
  Saved Presets
  Actions

Close
```

The modal itself should not grow without bound.

---

# Compact Display Rules

## Focused Window

Keep the existing debug-level geometry for now, but reduce spacing.

Future compact mode may reduce this to:

```text
Focused Window: Display 1 · 1080x720
```

For Phase 7.2f, avoid changing too much at once.

## Current Displays

Keep the current display list, but compact row spacing.

## Saved Presets

Each row keeps:

```text
[ preset label ] [ Delete ]
```

The label remains the Apply action.

---

# Delete Auto-Refresh Behavior

After a saved preset is deleted:

```text
1. delete confirmation dialog closes
2. selected preset is removed from GSettings JSON
3. popup reopens automatically for the focused window
4. updated Saved Presets list is visible
```

If there is no normal focused window after deletion, do not reopen popup.

Reason:

```text
avoid opening an empty or stale popup context
```

---

# Safety Requirements

- scrolling must not break keyboard focus
- delete confirmation must still prevent accidental deletion
- deleting a preset must still remove by id, not by name
- Unicode preset names must still display correctly
- apply behavior for saved presets must not change
- built-in presets must not change

---

# Acceptance Criteria

Phase 7.2f passes when:

- popup opens normally with current saved presets
- popup remains usable when saved preset count grows
- the content area is scrollable if needed
- Delete confirmation still appears
- Cancel still does not delete
- Delete removes one record and automatically reopens/refreshes the popup
- Unicode names still display correctly
- saved preset apply still works
- no disposed dialog warning appears

---

# Status

```text
Phase 7.2e-fix2 single saved preset delete: PASS
Phase 7.2f popup scrolling/compactness: REQUIRED
Phase 7.2f delete auto-refresh: REQUIRED
```
