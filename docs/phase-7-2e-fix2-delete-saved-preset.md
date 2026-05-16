# Phase 7.2e-fix2 — Delete Saved Preset Flow

## Goal

As saved custom presets accumulate, the popup must provide a safe way to delete a single saved preset record.

This phase adds single-record deletion for the `Saved Presets` section.

---

# Background

Phase 7.2e-fix1 validation confirmed:

- saved presets can apply across monitors
- monitor affinity works
- Unicode preset names work
- empty names are rejected
- CJK names display and apply correctly

As the list grows, users need a way to remove obsolete records.

---

# UX Requirement

Each saved preset row should provide two actions:

```text
Apply
Delete
```

The normal preset label remains the primary Apply action.

Recommended row layout:

```text
[ texteditor2 — 2. Display 2 · Portrait · 800x600 ] [ Delete ]
```

Clicking the preset label applies it.

Clicking `Delete` opens a confirmation dialog.

---

# Confirmation Flow

Deletion must not happen immediately on first click.

Recommended flow:

```text
1. User opens popup.
2. User clicks Delete next to a saved preset.
3. Popup closes or is replaced by a confirm dialog.
4. Confirm dialog shows the preset name and summary.
5. User clicks Cancel or Delete.
6. Delete removes only that preset id from custom-presets-json.
```

---

# Confirm Dialog Text

MVP English UI:

```text
Delete Saved Preset

Delete this saved preset?

<name> — <display/context> · <size>

Cancel
Delete
```

Example:

```text
Delete Saved Preset

Delete this saved preset?

測試位置 — 1. Display 1 · Landscape · 800x600
```

---

# Data Handling

Deletion should remove by stable internal `id`, not by display name.

Reason:

- duplicate names are currently allowed
- Unicode names may repeat
- display labels may change
- monitor metadata may change

Pseudo logic:

```javascript
_deleteCustomPresetById(id) {
    const presets = this._readCustomPresets();
    const filtered = presets.filter(preset => preset.id !== id);

    if (filtered.length === presets.length)
        return false;

    this._writeCustomPresets(filtered);
    return true;
}
```

---

# Unicode Requirement

The delete confirmation dialog must display Unicode preset names correctly.

Examples:

```text
測試位置
メモ-副画面
작업노트
```

---

# Safety Rules

- Delete by `id`, not by `name`.
- Do not delete if the id is missing or invalid.
- Do not delete all presets by accident.
- Do not hide or rewrite other presets.
- Keep debug logs for successful and failed deletion attempts.

---

# Logging

Expected successful deletion log:

```text
[ubuntu-wayland-sizer] custom-preset: deleted preset id=..., name=...
```

Expected not-found log:

```text
[ubuntu-wayland-sizer] custom-preset: delete ignored because preset id was not found: ...
```

---

# Popup Refresh Strategy

MVP recommendation:

```text
Close confirm dialog after deletion.
User can reopen popup to see the updated list.
```

Optional later improvement:

```text
Automatically reopen/refresh the popup after deletion.
```

MVP should prefer stability over complex live-refresh behavior.

---

# Acceptance Criteria

Phase 7.2e-fix2 passes when:

- each Saved Presets row has a Delete control
- Delete opens a confirmation dialog
- Cancel does not modify custom-presets-json
- Delete removes only the selected preset id
- duplicate names are handled safely
- Unicode names display correctly in the confirm dialog
- popup list no longer shows the deleted preset after reopening
- built-in presets are unaffected
- apply behavior is unaffected for remaining saved presets

---

# Status

```text
Phase 7.2e-fix1 monitor affinity: VALIDATED
Phase 7.2e-fix1 Unicode names: VALIDATED
Phase 7.2e-fix2 single saved preset delete: REQUIRED
```
