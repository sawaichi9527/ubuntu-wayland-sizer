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
- refresh/reopen popup after canceling a delete confirmation
- refresh/reopen popup after canceling the save-preset dialog
- refresh/reopen popup after a successful save-preset operation
- keep invalid save-preset names inside the save dialog
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
Save dialog Cancel exits the popup flow
```

## After

When many saved presets exist:

```text
popup remains within a sane screen height
Saved Presets area is scrollable
rows are compact
Delete confirmation returns to an updated popup automatically
Delete Cancel returns to popup automatically
Save Cancel returns to popup automatically
Save success returns to updated popup automatically
Invalid save names remain in the save dialog
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

GNOME Shell 50 compatibility note:

```text
Use scrollView.add_child(content), not scrollView.add_actor(content).
```

`St.ScrollView.add_actor()` is not available in the tested GNOME Shell 50 environment and caused popup construction failure.

---

# Compact Display Rules

## Focused Window

Keep the existing debug-level geometry for now, but reduce spacing.

Current compact summary:

```text
Display <n> · <width>x<height> · frame <x>,<y>
Workarea <x>,<y> <width>x<height> · relative <x>,<y>
```

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

# Dialog Return Behavior

Any second-level dialog opened from the popup should return to the popup when the user makes a non-terminal decision.

## Delete Dialog

Delete confirmation flow:

```text
Delete button
  -> confirmation dialog
      Cancel -> close confirmation -> reopen popup, no data change
      Delete -> remove one preset by id -> reopen updated popup
```

Representative logs:

```text
popup: reopening after saved preset delete cancel
popup: reopening after saved preset delete confirm
```

## Save Dialog

Save dialog flow:

```text
Save Current Window As Preset
  -> save dialog
      Cancel -> close save dialog -> reopen popup, no data change
      Save valid name -> write preset -> reopen updated popup
      Save invalid/empty name -> keep save dialog open and show error
```

Representative logs:

```text
popup: reopening after saved preset save cancel
popup: reopening after saved preset save confirm
custom-preset: save rejected: preset name is empty
```

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

# Deployment / Validation Flow

GNOME Shell Wayland can keep old GJS module instances alive across simple extension disable/enable cycles. Also, `rsync --delete` removes generated schema files if they are not in the source tree.

For development validation, use this fixed flow after each `git pull`:

```bash
cd ~/workspace/ubuntu-wayland-sizer

git pull

rsync -a --delete \
  ~/workspace/ubuntu-wayland-sizer/extension/ \
  ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527/

cd ~/.local/share/gnome-shell/extensions/ubuntu-wayland-sizer@sawaichi9527

glib-compile-schemas schemas

ls schemas
```

Expected schema files:

```text
gschemas.compiled
org.gnome.shell.extensions.ubuntu-wayland-sizer.gschema.xml
```

Then log out of the GNOME Wayland session and log back in.

After login:

```bash
gnome-extensions info ubuntu-wayland-sizer@sawaichi9527
```

Expected status:

```text
已啟用: 是
狀態: ACTIVE
```

Only start functional validation after the extension is ACTIVE.

---

# Safety Requirements

- scrolling must not break keyboard focus
- delete confirmation must still prevent accidental deletion
- deleting a preset must still remove by id, not by name
- Unicode preset names must still display correctly
- apply behavior for saved presets must not change
- built-in presets must not change
- invalid save-preset names must not close the save dialog
- development deployment must compile schemas after rsync
- validation after JS class/method changes should use a full GNOME logout/login to avoid GJS module-cache confusion

---

# Validation Results

## Manual validation — PASS

Environment:

```text
Ubuntu 26.04 development environment
GNOME Shell 50 / Mutter 50.1
Wayland session
```

Confirmed extension state:

```text
已啟用: 是
狀態: ACTIVE
```

Validated behavior:

- popup opens with `Super+Alt+Space`
- popup content uses scrollable layout
- layout is more compact than the previous debug-heavy popup
- delete confirmation opens from Saved Presets rows
- Delete Cancel returns to the popup
- Delete Confirm deletes the selected preset by id and returns to the updated popup
- Save Current Window As Preset opens the save dialog
- Save Cancel returns to the popup
- Save valid name writes the preset and returns to the updated popup
- Save empty name is rejected and remains in the save dialog
- remaining saved presets still apply normally
- built-in presets are unaffected
- Unicode preset names remain supported

Representative logs:

```text
popup: reopening after saved preset save cancel
custom-preset: save rejected: preset name is empty
popup: reopening after saved preset delete cancel
```

Non-blocking warning observed:

```text
clutter_input_focus_set_cursor_location: assertion 'clutter_input_focus_is_focused (focus)' failed
clutter_input_focus_set_surrounding: assertion 'clutter_input_focus_is_focused (focus)' failed
```

Current assessment:

```text
This appears to be a GNOME Shell/St.Entry focus warning during modal text-entry handling.
It does not currently block save/cancel/delete popup behavior.
Track as non-blocking unless it causes real input failure later.
```

---

# Acceptance Criteria

Phase 7.2f passes when:

- popup opens normally with current saved presets
- popup remains usable when saved preset count grows
- the content area is scrollable if needed
- rows are more compact than Phase 7.2e
- Delete confirmation still appears
- Delete Cancel reopens popup without data changes
- Delete Confirm removes one record and automatically reopens/refreshes the popup
- Save Cancel reopens popup without data changes
- Save Confirm writes one preset and automatically reopens/refreshes the popup
- Save invalid/empty name remains in save dialog
- Unicode names still display correctly
- saved preset apply still works
- built-in preset apply still works
- no disposed dialog warning appears
- extension status is ACTIVE after clean deployment and GNOME re-login

---

# Status

```text
Phase 7.2e-fix2 single saved preset delete: PASS
Phase 7.2f popup scrolling/compactness: PASS
Phase 7.2f delete auto-refresh: PASS
Phase 7.2f delete cancel return-to-popup: PASS
Phase 7.2f save cancel return-to-popup: PASS
Phase 7.2f save confirm return-to-popup: PASS
Phase 7.2f invalid save name stays in dialog: PASS
```
