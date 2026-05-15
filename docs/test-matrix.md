# Test Matrix

## Platform Matrix

| Component | Validated |
|---|---|
| Ubuntu 26.04 | PASS |
| GNOME Shell 50 | PASS |
| Wayland session | PASS |
| User-local extension install | PASS |

## Monitor Layout Matrix

| Layout | Result |
|---|---|
| Single monitor landscape | PASS |
| Dual monitor landscape | PASS |
| Secondary monitor portrait-right | PASS |
| Primary + secondary mixed scaling | PASS |

## Scaling Matrix

| Primary | Secondary | Result |
|---|---|---|
| 100% | 100% | PASS |
| 125% | 125% | PASS |
| 150% | 150% | PASS |
| 100% | 125% | PASS |
| 100% | 150% | PASS |

## Preset Matrix

| Preset | Description | Result |
|---|---|---|
| H | Left half | PASS |
| L | Right half | PASS |
| F | Full workarea | PASS |
| C | Center 1280x720 | PASS |

## Full-workarea / Maximized-like Matrix

| Scenario | Result |
|---|---|
| Maximized -> Left | PASS |
| Maximized -> Right | PASS |
| Maximized -> Center | PASS |
| Portrait-right maximize breakout | PASS |
| Mixed-scaling maximize breakout | PASS |

## Application Matrix

| Application | Package Type | Result |
|---|---|---|
| Firefox | apt | PASS |
| GNOME Terminal | apt | PASS |
| Ubuntu Text Editor | apt | PASS |
| LibreOffice | apt | PASS |
| VSCode | .deb | PASS |
| UpNote | .deb | PASS |

## Electron / Constrained-width Matrix

| App | Scenario | Result |
|---|---|---|
| UpNote | portrait-right left/right | PASS |
| UpNote | mixed scaling | PASS |
| UpNote | maximize breakout | PASS |
| VSCode | portrait-right | PASS |
| VSCode | mixed scaling | PASS |

## Expected Constraint Behavior

Some Electron applications may refuse very narrow widths on portrait monitors.

Example:

```text
portrait-right monitor width = 720
half-width request = 360
app minimum width = 400~600
```

Expected behavior:

```text
extension accepts actual app width
extension corrects edge alignment
window may not visually occupy exactly 50%
```

This is currently considered expected behavior, not a blocker.

## Current Non-blocking Warnings

Observed but not currently treated as extension blockers:

```text
Invalid sequence for VSYNC frame info
Error in size change accounting.
Can't update stage views actor unnamed [...] is on because it needs an allocation.
cogl_framebuffer_set_viewport: assertion 'width > 0 && height > 0' failed
```

Most of these warnings were observed after monitor scaling or monitor layout changes.
