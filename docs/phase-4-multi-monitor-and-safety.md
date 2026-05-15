# Phase 4 — Multi-monitor and Resize Safety

Phase 4 focuses on stabilizing geometry behavior before introducing D-Bus or GTK4 UI.

The project should continue prioritizing:

- Predictable workarea calculations
- Safe resize behavior
- Multi-monitor correctness
- GNOME Shell stability

## Current Geometry Model

The current implementation:

1. Detects the focused window.
2. Gets the monitor containing that window.
3. Uses the active workspace workarea for that monitor.
4. Calculates preset geometry.
5. Calls `move_resize_frame()`.

This is intentionally workarea-based rather than monitor-geometry-based.

## Why Workarea Matters

Using raw monitor geometry may overlap:

- GNOME top bar
- Docks
- Panels
- Reserved shell UI areas

Using workarea avoids these problems.

## Multi-monitor Expectations

The project should not assume:

```text
monitor index 0
single monitor
positive monitor coordinates only
```

The implementation must tolerate:

- Side-by-side monitors
- Vertical monitor layouts
- Negative coordinates
- Different monitor resolutions
- Different scale factors

## Current Preset Rules

### Left / Right Half

Split the current monitor workarea horizontally.

### Full

Fill the current monitor workarea.

### Center 1280x720

Clamp to workarea if the monitor is smaller.

## Resize Safety Rules

The extension should:

- Ignore non-normal windows
- Avoid shell internal windows
- Unmaximize before resize
- Clamp geometry to workarea
- Avoid recursive resize loops

## Observed Warnings

The following warnings were observed during testing:

```text
Error in size change accounting.
```

Current status:

```text
Non-blocking
```

The warning did not:

- Crash GNOME Shell
- Disable the extension
- Prevent repeated resize operations

However, future work should monitor whether specific applications trigger this more frequently.

## Candidate Future Improvements

Potential future improvements after Phase 4:

### Geometry Clamp Layer

Explicitly clamp:

```text
x
y
width
height
```

before calling `move_resize_frame()`.

### Window Capability Checks

Potential checks:

```text
can_resize()
allows_move()
```

if future Mutter APIs expose better capability queries.

### Delayed Resize

Some windows may behave better with:

```text
unmaximize()
→ short defer
→ move_resize_frame()
```

This should only be introduced if needed.

### Per-application Rules

Some apps may need special handling for:

- minimum size hints
- client-side decorations
- toolkit-specific geometry behavior

This is deferred.

## Still Deferred

The following remain intentionally out of scope:

- D-Bus API
- GTK4 settings app
- Floating resize menu
- Border triggers
- System tray integration
- Complex macro expression grammar
