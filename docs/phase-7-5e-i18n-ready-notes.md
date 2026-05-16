# Phase 7.5e — i18n-ready Notes

## Purpose

Phase 7.5e records future internationalization (i18n) considerations for Ubuntu Wayland Sizer.

This phase is intentionally documentation-only.

No gettext integration, translation catalog generation, runtime locale switching, or user-visible translation behavior is introduced during Phase 7.5e.

## Scope

Included:

```text
- identify user-facing strings
- identify implementation/internal strings
- record future gettext direction
- define low-risk i18n boundaries
- document why gettext is deferred
```

Excluded:

```text
- gettext integration
- locale detection
- runtime translation loading
- .po/.pot generation
- translation infrastructure
- translated UI strings
- schema localization
- extensions.gnome.org localization work
```

## Why gettext Is Deferred

Current project priority:

```text
- stabilize GNOME Shell 50 + Wayland behavior
- preserve protected-core resize logic
- maintain low operational complexity
- complete release-readiness documentation
```

Introducing gettext during the current baseline would increase:

```text
- runtime complexity
- packaging complexity
- validation scope
- UI regression surface
- translator workflow requirements
```

The current release-readiness branch is intentionally optimized for:

```text
small surface area
predictable runtime behavior
minimal moving parts
```

## Current UI Language Policy

Current baseline language:

```text
English-only UI strings inside the extension runtime
```

Examples:

```text
Center Presets
Position Presets
Saved Presets
Actions
Focused Window
Log: Debug
Switch to Normal
```

Reason:

```text
The current extension baseline is primarily development-oriented and validation-oriented.
```

## User-facing Strings

The following areas are considered future i18n candidates:

```text
- popup titles
- popup section names
- preset labels
- popup action labels
- save/delete dialog labels
- validation and warning messages
- runtime status labels
- metadata description
```

Examples:

```text
Ubuntu Wayland Sizer · v1.0
Center Presets
Position Presets
Saved Presets
Actions
Close
Cancel
Save
Delete
Log: Debug
Switch to Normal
```

## Strings That Should Remain Stable or Untranslated

The following should generally remain stable implementation identifiers:

```text
- preset internal IDs
- GSettings keys
- schema IDs
- extension UUID
- log prefixes
- debug categories
- internal enum names
```

Examples:

```text
PRESETS.LEFT
PRESETS.RIGHT
PRESETS.FULL
debug-logging
ubuntu-wayland-sizer@sawaichi9527
[ubuntu-wayland-sizer][DEBUG]
```

These are implementation-oriented identifiers, not user-facing UI labels.

## Future gettext Direction

If gettext is introduced later, preferred approach:

```text
- translate only user-facing UI strings
- keep implementation identifiers unchanged
- avoid translating debug-log categories
- avoid translating schema IDs and keys
```

Potential future structure:

```text
locale/
po/
```

Potential future helper usage:

```js
import Gettext from 'gettext';
```

or GNOME Shell extension gettext helpers appropriate for the target GNOME Shell version.

## Popup Layout Considerations

Future translations may change text width.

Areas potentially affected:

```text
- popup section alignment
- button width
- log-control width
- saved-preset row spacing
```

Therefore future i18n work should validate:

```text
- narrow displays
- portrait monitor layout
- mixed scaling
- translated long strings
```

## Current Recommendation

For the current release-readiness baseline:

```text
- keep runtime UI English-only
- keep wording concise
- keep labels short and stable
- avoid introducing gettext now
```

## Future Release Consideration

Potential future milestone:

```text
Post-1.0 usability and localization track
```

Possible future goals:

```text
- Traditional Chinese support
- Japanese support
- gettext infrastructure
- translator workflow
- localized screenshots/docs
```

These are intentionally deferred from Phase 7.5e.

## Pass Criteria

Phase 7.5e passes when:

```text
- i18n direction is documented
- gettext deferral rationale is documented
- user-facing vs implementation strings are distinguished
- no runtime gettext integration is introduced
- no translation infrastructure is introduced
```
