# Phase 7.5a — Roadmap and Guardrails

## Purpose

Phase 7.5a starts the release-readiness polish track after the Phase 7.4a preset library expansion baseline.

This phase does not add new window-management behavior.

The purpose is to protect the behaviors that already make Ubuntu Wayland Sizer work reliably on:

```text
GNOME Shell 50 + Wayland + Mutter
```

while documenting which tempting follow-up ideas are intentionally deferred.

## Phase 7.4a Baseline

Phase 7.4a expanded the built-in Center Presets library and clarified popup grouping around standard center presets.

The Phase 7.5 track starts from that baseline.

Phase 7.5 should treat Phase 7.4a behavior as the current stable foundation unless validation shows a concrete regression.

## Phase 7.5 Scope

Phase 7.5 is a release-readiness and polish phase.

Included:

```text
- roadmap cleanup
- protected-core documentation
- deployment documentation
- version visibility
- wording polish
- i18n-ready notes
```

Excluded:

```text
- new tiling-manager behavior
- auto-tiling
- snap-assistant UI
- multi-window layout orchestration
- workspace/session restore
- background daemon
- D-Bus service
- GTK settings application
- panel indicator
```

## Protected Core Guardrails

The following behavior is protected core.

Do not remove, simplify, or refactor these paths unless a replacement is validated on the same GNOME Shell 50 + Wayland + Mutter baseline.

### Workarea-based geometry

The extension must continue using monitor workarea geometry, not raw monitor geometry, for preset calculations.

Reason:

```text
Ubuntu Dock, top bar, panel/workarea reservations, mixed scaling, and portrait layouts all depend on workarea-aware positioning.
```

### Full-workarea / maximized-like breakout

The extension must keep detecting full-workarea or maximized-like window states before applying non-full presets.

Protected behavior:

```text
- detect windows that visually occupy the full workarea
- treat them as maximized-like even if Mutter state alone is not enough
- break them out before applying left/right/center presets
```

Reason:

```text
Sizer-like behavior on Wayland requires moving a window out of maximized/full-workarea-like state before Mutter will reliably accept a new frame size.
```

### Safe restore before resize

The safe restore step before applying a target preset is protected.

Protected behavior:

```text
- unmake fullscreen best-effort
- unmaximize best-effort
- optionally move to the target monitor
- apply a safe intermediate restore rectangle
- apply the final preset after a short delay
```

Reason:

```text
This ordering avoids Mutter rejecting or ignoring resize requests during state transitions.
```

### Post-resize correction

The delayed post-resize correction flow is protected.

Protected behavior:

```text
- read back the actual frame after Mutter/app constraints are applied
- retry if the resize was rejected into full-workarea geometry
- correct edge alignment for constrained windows
- keep center presets centered after app-side size adjustment
```

Reason:

```text
Wayland and Mutter do not guarantee that the requested frame is the final accepted frame.
```

### Electron / minimum-width constrained app handling

The constrained-app correction path is protected.

Protected behavior:

```text
- accept the actual size chosen by the application/toolkit
- correct position to the intended edge or center
- do not assume narrow portrait half-width requests will always be accepted
```

Reason:

```text
Electron apps such as UpNote can reject narrow target widths, especially on portrait or mixed-scaling displays.
```

### Mixed-scaling and multi-monitor behavior

The monitor-aware and mixed-scaling-aware geometry path is protected.

Protected behavior:

```text
- resolve the focused window monitor
- calculate presets against that monitor workarea
- preserve portrait-right monitor behavior
- preserve primary/secondary display labeling used by the popup
```

Reason:

```text
Phase 7 validation depends on stable behavior across primary landscape and secondary portrait-right monitors with 100%, 125%, 150%, and mixed scaling.
```

### Mutter / Wayland workaround provenance

Some protected behaviors were informed by practical GNOME Shell / Mutter tiling behavior observed in open-source tiling/window-management projects.

These workarounds are not cosmetic.

They are part of the reason a Sizer-like tool can work within GNOME Shell 50 + Wayland + Mutter constraints.

When editing these areas, treat them as compatibility-critical unless proven otherwise by validation.

## Panel Indicator Decision

A panel indicator is deferred and is not part of Phase 7.5.

Reason:

```text
The extension status can already be checked from GNOME Extensions / Extension Manager.
```

Avoiding a panel indicator keeps the project aligned with the lightweight tool goal:

```text
- less Shell UI surface area
- fewer lifecycle risks
- fewer compatibility risks across GNOME Shell changes
- simpler release baseline
```

## Phase 7.5 Roadmap

Recommended order:

```text
7.5a — Roadmap and guardrail docs
7.5b — Version visibility
7.5c — Deployment docs
7.5d — UX wording polish
7.5e — i18n-ready note only
```

### 7.5a — Roadmap and guardrail docs

Status target:

```text
- record Phase 7.4a as PASS after local validation
- define protected core behavior
- mark panel indicator as deferred / non-goal
- keep the extension behavior unchanged
```

### 7.5b — Version visibility

Planned scope:

```text
- show metadata version in the popup title
- define the version source rule
- avoid adding a panel indicator or settings UI
```

### 7.5c — Deployment docs

Planned scope:

```text
- development install
- user-local install
- install on another machine
- rollback / troubleshooting
```

### 7.5d — UX wording polish

Planned scope:

```text
- popup wording consistency
- workarea/display wording cleanup
- preset label readability
```

### 7.5e — i18n-ready note only

Planned scope:

```text
- document future multilingual direction
- do not introduce gettext yet
- keep strings simple and centralized enough for future extraction
```

## Validation Rule for 7.5a

Phase 7.5a passes when:

```text
- the release-readiness roadmap is documented
- protected core geometry behavior is explicitly marked
- panel indicator is documented as deferred / non-goal
- no extension runtime behavior changes are introduced
```

## Non-Goals

Phase 7.5a intentionally does not modify:

```text
- extension/extension.js
- extension schemas
- preset behavior
- popup runtime controls
- keybindings
```

This keeps 7.5a safe as a documentation and guardrail checkpoint before further release-readiness polish.
