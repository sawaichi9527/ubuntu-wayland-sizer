# Phase 7.2e-fix1 — Unicode Preset Naming Requirements

## Goal

Saved Presets must support user-provided Unicode names.

The user may name presets in:

- Traditional Chinese
- Simplified Chinese
- Japanese
- Korean
- mixed CJK and English
- symbols commonly used in profile names

Examples:

```text
文字編輯器-主螢幕
筆記視窗-副螢幕
UpNote 工作區
開発メモ
メイン画面-ブラウザ
작업노트
研究ノート 1
```

## Requirement

Preset names are user-facing labels and must be stored and displayed as UTF-8 / Unicode strings.

The extension must not restrict names to ASCII.

## Storage

Custom presets are stored in the `custom-presets-json` GSettings string.

JSON string storage can represent Unicode names safely when the extension reads and writes the complete JSON payload as a string.

Recommended preset field:

```json
{
  "id": "custom-...",
  "name": "文字編輯器-主螢幕",
  "kind": "relative-geometry"
}
```

## Display

The popup should render the user-provided name directly.

Recommended display:

```text
文字編輯器-主螢幕 — 1. Dell 24" · Landscape · 1080x720
メイン画面-ブラウザ — 1. Dell 24" · Landscape · 1440x768
작업노트 — 2. ViewSonic 15" · Portrait · 800x600
```

## Normalization Rules

MVP rules:

- trim leading and trailing whitespace
- reject empty names
- keep Unicode characters as-is
- do not slugify the visible name
- do not force lowercase
- do not replace spaces
- do not remove CJK characters

Internal IDs can remain ASCII-only and generated separately:

```text
custom-1778898280-80900
```

The visible `name` and internal `id` must be treated as separate fields.

## Length Limit

The existing soft length limit can remain, but it should be based on JavaScript string length for MVP.

Future improvement may use grapheme-aware truncation to avoid cutting combined emoji or complex scripts in the middle.

MVP recommendation:

```text
name.trim().slice(0, CUSTOM_PRESET_NAME_MAX_LENGTH)
```

Known limitation:

- This is acceptable for CJK text in the MVP.
- Grapheme-aware handling can be added later if needed.

## Font and Rendering

GNOME Shell / St.Label should render CJK text correctly if the desktop environment has suitable fonts installed.

The extension should avoid custom font assumptions.

## Logging

Debug logs should preserve Unicode names:

```text
[ubuntu-wayland-sizer] custom-preset: saved preset id=..., name=文字編輯器-主螢幕
```

## Acceptance Criteria

Unicode naming support passes when:

- a preset can be saved with a Traditional Chinese name
- a preset can be saved with a Japanese name
- a preset can be saved with a Korean name
- the saved name appears correctly in the popup
- the saved name survives extension reload
- the saved name survives logout/login
- applying the preset works regardless of the script used in the name

## Relationship to Monitor Affinity

Unicode naming is independent from monitor affinity.

The display label should still compose:

```text
<user-provided Unicode name> — <display number>. <display label> · <orientation> · <window size>
```

Example:

```text
文字編輯器-副螢幕 — 2. ViewSonic 15" · Portrait · 800x600
```
