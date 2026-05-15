# Keybinding Policy

## User Preference

The preferred physical key gesture for development testing is:

```text
Right Super + Right Alt + selected action key
```

This is intended to reduce accidental activation during normal desktop use.

## Current Technical Binding

The current GNOME Shell/GSettings accelerator format uses logical modifier masks.

Current defaults:

```text
<Super><Alt>H      -> Left half
<Super><Alt>L      -> Right half
<Super><Alt>F      -> Full workarea
<Super><Alt>C      -> Center 1280x720
```

Arrow-key defaults are intentionally avoided because GNOME/Ubuntu may reserve `Super+Alt+Arrow` combinations for window switching or window-management behavior. This was observed on Ubuntu 26.04, especially with a secondary monitor configured as portrait-right.

In practice, these bindings usually mean:

```text
Any Super + Any Alt + action key
```

They do not reliably distinguish left/right modifier keys.

## Decision

For the MVP and early development phases, Ubuntu Wayland Sizer will keep the GNOME-native keybinding path:

```text
Main.wm.addKeybinding() + GSettings accelerator arrays
```

This keeps the implementation stable and avoids low-level key event interception while the core resize logic is still being validated.

## Deferred Right-side-only Binding

A true right-side-only binding would likely require lower-level key event tracking, such as:

```text
global.stage captured-event
→ track Super_R press/release
→ track Alt_R / ISO_Level3_Shift press/release
→ dispatch on action key press
```

This is intentionally deferred because it may be affected by:

- Keyboard layout differences
- AltGr handling
- Input method behavior
- Remote desktop or VM key mapping
- GNOME Shell internal shortcut handling

## Future Requirement

The project should keep all shortcuts configurable.

Future settings should allow users to change:

```text
resize-left
resize-right
resize-full
resize-center
show-menu
cycle-presets
```

The default binding may remain `<Super><Alt>...`, while documentation can recommend physically pressing the right-side modifier keys when available.
