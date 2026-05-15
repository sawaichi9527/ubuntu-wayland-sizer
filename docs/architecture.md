# Architecture

## Design Principle

Ubuntu Wayland Sizer must treat the GNOME Shell Extension as the authority for window manipulation.

On Wayland, a normal desktop application should not directly resize or reposition arbitrary third-party windows. Therefore, the project uses a GNOME Shell Extension to operate inside the shell/compositor context, where Mutter `MetaWindow` objects are available.

A future GTK4 companion app may provide configuration UI, but it should call the extension through D-Bus instead of attempting to control windows directly.

## Minimal Architecture

```text
User
 └─ Hotkey / Extension UI
     └─ GNOME Shell Extension
         ├─ extension.js
         ├─ keybinding manager      future
         ├─ window manager          future
         ├─ preset engine           future
         └─ D-Bus service           future
              └─ GTK4 companion app future
```

## Baseline Extension

The first baseline contains only:

```text
extension/
├── metadata.json
└── extension.js
```

This is intentional. The initial goal is to prove that GNOME Shell can load, enable, disable, and unload the extension cleanly.

## Future Components

### Window Manager

Responsible for:

- Detecting the focused window
- Reading monitor and workarea geometry
- Moving and resizing windows
- Avoiding unsupported or special windows

### Keybinding Manager

Responsible for:

- Registering global shortcuts through GNOME Shell APIs
- Dispatching actions to the preset engine
- Cleaning up all keybindings on disable

### Preset Engine

Responsible for:

- Built-in presets in early MVP
- JSON presets in later phases
- Macro expressions after core behavior is stable

### D-Bus Service

Responsible for external control from the companion app.

Initial candidate methods:

```text
Ping() -> s
ListWindows() -> aa{sv}
ResizeWindow(u window_id, i x, i y, u width, u height) -> b
ApplyPreset(s preset_id, u window_id) -> b
```

D-Bus should not be introduced until direct hotkey-based resize works reliably.

### GTK4 Companion App

The companion app should be a settings and testing tool, not the primary window-control engine.

Initial future pages:

- Status page
- Preset page
- Test page

Tray icons, border triggers, floating menus, and titlebar menu integration are deferred until the core resize path is stable.
