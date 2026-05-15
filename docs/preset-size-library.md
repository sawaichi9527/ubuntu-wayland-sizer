# Preset Size Library

## Purpose

This document records the built-in preset size library used by Ubuntu Wayland Sizer.

The goal of this document is to provide a stable reference for future features such as:

- preset cycling
- popup preset selection
- command-style preset invocation
- user-configurable preset overrides
- monitor-aware preset selection

This document is intentionally a reference document. It describes the current built-in model and expected geometry behavior. It is not a user tutorial or a UI design document.

## Documentation Role

The project documentation should roughly separate content by purpose:

- `README.md` introduces the project and development setup.
- `docs/status.md` records the latest validated project state.
- `docs/test-matrix.md` records validation coverage.
- phase documents record implementation history and milestone notes.
- this document records the preset size model as a reusable reference.

For future documentation growth, prefer this pattern:

```text
docs/
├── status.md                  # current validated state
├── architecture.md            # design explanation
├── test-matrix.md             # validation reference
├── keybinding-policy.md       # shortcut policy reference
├── known-issues.md            # known behavior and limitations
├── preset-size-library.md     # built-in preset size reference
└── phase-*.md                 # milestone notes and development history
```

This keeps reference material separate from phase history. Future popup menu or cycling work should reference this document instead of duplicating the preset table in a phase note.

## Coordinate Philosophy

Preset geometry is calculated relative to the active monitor workarea, not raw monitor geometry.

This matters because GNOME Shell / Mutter workarea already excludes reserved shell UI areas such as panels, docks, or other compositor-managed screen regions.

Current behavior follows these rules:

1. Get the focused normal window.
2. Resolve the window's current monitor.
3. Read the active workspace workarea for that monitor.
4. Calculate the target geometry from the selected preset.
5. Clamp the target geometry to the workarea.
6. Apply the move/resize operation.
7. Read back the actual frame and correct alignment when Mutter or the app applies constraints.

Preset sizes are expressed in logical pixels. They are not physical monitor pixels.

This is important for mixed-scaling setups. A 1280x720 preset means 1280x720 logical pixels inside the current workarea, not a fixed physical pixel count.

## Built-in Size Groups

The current size library defines these groups:

| Group ID | Meaning | Notes |
|---|---|---|
| `basic` | Common legacy / utility sizes | Includes several 4:3-style sizes under a neutral group name. |
| `4:3` | Classic 4:3 display sizes | Kept as an explicit aspect-ratio group for future UI grouping. |
| `16:9` | Widescreen 16:9 sizes | Includes 720p, 1080p, and 2K/QHD-class sizes. |
| `16:10` | Widescreen 16:10 sizes | Useful for productivity-oriented layouts. |
| `large` | Project-specific large presets | Currently contains the large centered preset size. |

Some dimensions intentionally appear in more than one group. For example, `640x480`, `800x600`, and `1024x768` exist in both `basic` and `4:3` groups. The duplicate dimensions are acceptable because the preset ID and group carry different UI meaning.

## Built-in Size Library

| Size ID | Group | Label | Width | Height | Notes |
|---|---:|---:|---:|---:|---|
| `basic-640x480` | `basic` | `640x480` | 640 | 480 | Basic utility size. |
| `basic-800x600` | `basic` | `800x600` | 800 | 600 | Used by `center-compact`. |
| `basic-1024x768` | `basic` | `1024x768` | 1024 | 768 | Basic utility size. |
| `basic-1152x864` | `basic` | `1152x864` | 1152 | 864 | Basic utility size. |
| `basic-1280x960` | `basic` | `1280x960` | 1280 | 960 | Basic utility size. |
| `4-3-640x480` | `4:3` | `640x480` | 640 | 480 | Classic 4:3 size. |
| `4-3-800x600` | `4:3` | `800x600` | 800 | 600 | Classic 4:3 size. |
| `4-3-1024x768` | `4:3` | `1024x768` | 1024 | 768 | Classic 4:3 size. |
| `4-3-1152x864` | `4:3` | `1152x864` | 1152 | 864 | Classic 4:3 size. |
| `4-3-1280x960` | `4:3` | `1280x960` | 1280 | 960 | Classic 4:3 size. |
| `4-3-1400x1050` | `4:3` | `1400x1050` | 1400 | 1050 | Larger 4:3 size. |
| `4-3-1600x1200` | `4:3` | `1600x1200` | 1600 | 1200 | Larger 4:3 size. |
| `16-9-1280x720` | `16:9` | `1280x720` | 1280 | 720 | 720p-class 16:9 size. |
| `16-9-1366x768` | `16:9` | `1366x768` | 1366 | 768 | Common laptop 16:9 size. |
| `16-9-1600x900` | `16:9` | `1600x900` | 1600 | 900 | Intermediate 16:9 size. |
| `16-9-1920x1080` | `16:9` | `1920x1080` | 1920 | 1080 | 1080p / Full HD size. |
| `16-9-2560x1440` | `16:9` | `2560x1440` | 2560 | 1440 | 2K/QHD-class size. |
| `16-10-1280x800` | `16:10` | `1280x800` | 1280 | 800 | Common 16:10 size. |
| `16-10-1440x900` | `16:10` | `1440x900` | 1440 | 900 | Common 16:10 size. |
| `16-10-1680x1050` | `16:10` | `1680x1050` | 1680 | 1050 | Larger 16:10 size. |
| `16-10-1920x1200` | `16:10` | `1920x1200` | 1920 | 1200 | WUXGA-class 16:10 size. |
| `large-1440x768` | `large` | `1440x768` | 1440 | 768 | Used by `center-large`. |

## Active Preset Definitions

The current extension exposes these active presets:

| Preset ID | Type | Label | Size Source | Geometry Behavior |
|---|---|---|---|---|
| `left` | `left-half` | Left half | workarea-derived | Left half of the active monitor workarea. |
| `right` | `right-half` | Right half | workarea-derived | Right half of the active monitor workarea. |
| `full` | `full-workarea` | Full workarea | workarea-derived | Entire active monitor workarea. |
| `center` | `custom-center` | Custom center | GSettings `center-width` / `center-height` | Centered custom size, clamped to workarea. |
| `center-compact` | `fixed-center` | Compact center | `basic-800x600` | Centered 800x600, clamped to workarea. |
| `center-large` | `fixed-center` | Large center | `large-1440x768` | Centered 1440x768, clamped to workarea. |

## Resolution Scaling Rules

Preset computation is workarea-relative and uses logical pixels.

Common display-class names should be written in user-facing documentation as:

| User-facing Name | Typical Resolution | Notes |
|---|---:|---|
| 720p | 1280x720 | Useful for compact centered windows. |
| 1080p / Full HD | 1920x1080 | Common desktop baseline. |
| 2K / QHD | 2560x1440 | Prefer this wording over plain `1440p` in project docs because it is more intuitive for users. |
| 4K / UHD | 3840x2160 | Future-facing reference only; not currently a special preset. |

The current implementation does not automatically scale a fixed preset up or down based on monitor class. For example:

- `center-compact` requests 800x600 logical pixels.
- `center-large` requests 1440x768 logical pixels.
- `center` requests the configured logical size.

If the requested size is larger than the current workarea, width and height are clamped independently to fit inside the workarea.

Example:

```text
requested: 1440x768
workarea:  1080x720
actual:    1080x720
```

This behavior is intentional. It keeps the preset model deterministic and avoids hidden scaling rules.

## Center Preset Rules

### Custom Center

The `center` preset reads:

```text
center-width
center-height
```

The current default is:

```text
1280x720
```

The minimum accepted configured size is:

```text
100x100
```

If the configured value is smaller than the minimum, the extension clamps it upward to the minimum. If the configured value is larger than the workarea, the calculated target is clamped downward to the workarea.

### Fixed Center Presets

Fixed center presets reference entries from `SIZE_LIBRARY`.

Current fixed center presets:

```text
center-compact -> basic-800x600
center-large   -> large-1440x768
```

These presets should be treated as stable built-in aliases. Future UI can display the preset label while internally invoking the preset ID.

## Workarea Clamping Rules

All target geometry is clamped to the active monitor workarea before being applied.

The clamp rules are:

1. `x` must not be left of `workarea.x`.
2. `y` must not be above `workarea.y`.
3. `width` must fit between `x` and the workarea right edge.
4. `height` must fit between `y` and the workarea bottom edge.
5. final `width` and `height` must be at least 1 logical pixel.

This protects the extension from producing invalid geometry on small workareas, portrait monitors, dock-reserved workareas, and mixed-scaling layouts.

## App Constraint Correction

Some applications may reject the requested size because of minimum width or minimum height constraints.

The extension handles this by reading the actual frame after resize and applying a correction pass:

- left-half presets keep the actual width and align to the workarea left edge.
- right-half presets keep the actual width and align to the workarea right edge.
- center presets keep the actual size and re-center within the workarea.

This means the final window may not always match the requested preset size exactly, but it should remain aligned according to the preset's intent.

## Future UI Usage

Future popup menu or cycling features should use this model:

```text
preset id -> preset definition -> optional size library entry -> calculated geometry
```

Recommended future display grouping:

```text
Basic
4:3
16:9
16:10
Large
```

Recommended future cycling order should be explicit and should not depend on object insertion order. A future cycling engine should define a separate ordered list such as:

```text
center-compact
center
center-large
```

or, for all fixed library sizes:

```text
basic-800x600
16-9-1280x720
large-1440x768
16-9-1920x1080
16-9-2560x1440
```

## Compatibility Notes

Current validation focus remains:

```text
Ubuntu 26.04
GNOME Shell 50
Wayland session
GNOME Shell extension only
```

The preset size library itself is backend-neutral, but geometry application is currently GNOME Shell / Mutter specific.

Do not treat this document as proof that every size has been manually validated on every monitor layout. It records the built-in size table and the expected geometry rules used by the extension.
