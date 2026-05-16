# Phase 7.2e-fix1 — I18N and Preset Name Validation Requirements

## Goal

Phase 7.2e-fix1 introduces user-defined saved presets. Because saved preset names are user-facing profile labels, the extension must support Unicode names and handle invalid names safely.

This document defines:

- preset name validation rules
- invalid-name rejection flow
- CJK naming support
- future localization/i18n architecture direction

---

# Part 1 — Preset Name Validation

## Requirement

User-provided preset names must support Unicode, including:

- Traditional Chinese
- Simplified Chinese
- Japanese
- Korean
- mixed CJK and English
- common punctuation
- spaces inside names

Valid examples:

```text
文字編輯器-主螢幕
筆記視窗 副螢幕
メイン画面-ブラウザ
開発メモ
작업노트
Research 視窗 1
```

---

# Invalid Name Cases

The extension should reject names that are unsafe or not useful.

## Reject empty names

Examples:

```text
""
"   "
"\t\n"
```

Reason:

```text
Saved Presets must have a visible user-facing label.
```

## Reject control-character-only names

Examples:

```text
"\u0000"
"\u0008"
"\u001b"
```

Reason:

```text
Control characters are not useful as visible preset names and may cause display/logging issues.
```

## Strip leading/trailing whitespace

Example:

```text
"  文字編輯器  " -> "文字編輯器"
```

## Preserve inner spaces

Example:

```text
"UpNote 工作區" -> "UpNote 工作區"
```

## Soft length limit

Use a soft max length to prevent oversized popup labels.

MVP value:

```text
80 JavaScript UTF-16 code units
```

Future improvement:

```text
grapheme-aware truncation
```

---

# MVP Validation Function

Recommended behavior:

```text
1. Convert input to string.
2. Trim leading/trailing whitespace.
3. Remove disallowed control characters.
4. Trim again.
5. Reject if empty.
6. Truncate to max length.
7. Store as visible name.
```

Pseudo logic:

```javascript
function normalizePresetName(input) {
    const normalized = String(input ?? '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, CUSTOM_PRESET_NAME_MAX_LENGTH);

    return normalized;
}
```

Do not:

- slugify
- force lowercase
- remove CJK characters
- replace spaces with dashes
- convert to ASCII

---

# Rejection Flow

## Current MVP popup limitation

The current save dialog is implemented with a GNOME Shell modal and simple `St.Entry`.

For 7.2e-fix1 MVP, invalid names should be rejected without closing the save dialog.

## Recommended UX

When the user clicks `Save` with an invalid name:

```text
1. Keep the save dialog open.
2. Show an inline error message below the input field.
3. Keep focus on the text entry.
4. Do not write anything to GSettings.
5. Log a debug message.
```

Example inline message:

```text
Please enter a preset name.
```

Future localized Traditional Chinese:

```text
請輸入 preset 名稱。
```

Future localized Japanese:

```text
プリセット名を入力してください。
```

Future localized Korean:

```text
프리셋 이름을 입력하세요.
```

---

# Rejection Categories

## Empty name

Message key:

```text
presetNameErrorEmpty
```

Default English text:

```text
Please enter a preset name.
```

## Invalid characters removed and name becomes empty

Message key:

```text
presetNameErrorInvalid
```

Default English text:

```text
Please use a visible preset name.
```

## Name too long

MVP behavior:

```text
soft truncate silently
```

Future behavior:

```text
show a warning or character counter
```

---

# Logging

Invalid-name rejection should not be treated as a GNOME Shell error.

Use debug log:

```text
[ubuntu-wayland-sizer] custom-preset: save rejected because preset name is empty
[ubuntu-wayland-sizer] custom-preset: save rejected because preset name has no visible characters
```

---

# Part 2 — Future Localization / I18N Architecture

## Problem

The popup currently contains English UI strings such as:

```text
Ubuntu Wayland Sizer
Focused Window
Center Presets
Window Positions
Saved Presets
Actions
Save Current Window As Preset
Cancel
Save
Close
```

The project should keep future localization flexible, especially for:

- Traditional Chinese
- Japanese
- Korean
- community-contributed translations

---

# Recommended Direction

Do not hard-code UI strings permanently.

Introduce a small localization abstraction later:

```javascript
this._t('savedPresets')
this._t('saveCurrentWindowAsPreset')
this._t('cancel')
this._t('save')
```

The MVP can keep English strings, but new UI strings should be easy to extract later.

---

# Language File Model

A Total Commander-like language file model is a good long-term option.

Recommended future structure:

```text
extension/locale/en.json
extension/locale/zh-TW.json
extension/locale/ja.json
extension/locale/ko.json
```

Example:

```json
{
  "savedPresets": "Saved Presets",
  "saveCurrentWindowAsPreset": "Save Current Window As Preset",
  "presetNameErrorEmpty": "Please enter a preset name."
}
```

Traditional Chinese example:

```json
{
  "savedPresets": "已儲存 Presets",
  "saveCurrentWindowAsPreset": "將目前視窗儲存為 Preset",
  "presetNameErrorEmpty": "請輸入 preset 名稱。"
}
```

Japanese example:

```json
{
  "savedPresets": "保存済みプリセット",
  "saveCurrentWindowAsPreset": "現在のウィンドウをプリセットとして保存",
  "presetNameErrorEmpty": "プリセット名を入力してください。"
}
```

Korean example:

```json
{
  "savedPresets": "저장된 프리셋",
  "saveCurrentWindowAsPreset": "현재 창을 프리셋으로 저장",
  "presetNameErrorEmpty": "프리셋 이름을 입력하세요."
}
```

---

# GNOME-Native Alternative

GNOME extensions commonly use gettext-based localization.

A future GNOME-native approach may use:

```text
po/
locale/
gettext
```

Pros:

- aligns with GNOME ecosystem
- good for packaging
- standard translator workflow

Cons:

- more setup complexity
- less approachable than simple JSON language files for casual contributors

---

# Recommendation for This Project

Use a two-step approach:

## Step 1 — 7.2e-fix1

Keep UI in English for now, but:

- ensure saved preset names support Unicode
- add invalid-name rejection flow
- avoid ASCII-only assumptions
- avoid slugifying visible names
- keep visible `name` separate from internal `id`

## Step 2 — Future localization phase

Add a lightweight translation layer.

Possible phase name:

```text
Phase 7.2i — Popup Localization Framework
```

Initial supported files:

```text
en.json
zh-TW.json
ja.json
ko.json
```

Future community translations can add more JSON files without changing extension logic.

---

# Translation Key Design

Use stable keys, not English text as keys.

Good:

```text
savedPresets
saveCurrentWindowAsPreset
presetNameErrorEmpty
```

Avoid:

```text
Save Current Window As Preset
Please enter a preset name.
```

Reason:

```text
English source text may change, but translation keys should remain stable.
```

---

# Acceptance Criteria for 7.2e-fix1

Name validation is acceptable when:

- Traditional Chinese preset names save correctly
- Japanese preset names save correctly
- Korean preset names save correctly
- mixed CJK/English names save correctly
- empty names are rejected
- control-character-only names are rejected
- invalid names do not close the save dialog
- invalid names do not write to GSettings
- popup displays Unicode preset names correctly

---

# Deferred Acceptance Criteria for Future I18N

Future localization support is acceptable when:

- popup UI strings are no longer hard-coded directly in layout code
- language files can be added without touching core geometry logic
- at least English and Traditional Chinese are supported
- Japanese and Korean can be added by translation file only
- missing translation keys fallback to English

---

# Status

```text
Phase 7.2e-fix1 Unicode preset names: REQUIRED
Phase 7.2e-fix1 invalid-name rejection: REQUIRED
Phase 7.2e-fix1 full popup localization: DEFERRED
Future Phase 7.2i popup localization framework: PROPOSED
```
