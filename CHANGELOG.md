# Changelog

## v0.1-baseline

Initial validated Wayland baseline.

### Core functionality

- GNOME Shell extension lifecycle
- Focused-window resize presets
- Workarea-based geometry
- Left / right / full / center presets
- Keybinding registration and cleanup
- User-local install workflow
- GSettings schema integration

### Geometry handling

- Multi-monitor support
- Portrait-right monitor support
- Mixed-scaling support
- Fractional scaling validation
- Full-workarea/maximized-like breakout
- Safe restore geometry flow
- Post-resize correction flow
- Retry flow for resize rejection

### Application compatibility

Validated applications:

- Firefox
- GNOME Terminal
- Ubuntu Text Editor
- LibreOffice
- VSCode (.deb)
- UpNote (.deb)

### Electron handling

- Minimum-width constraint detection
- Edge correction after app-side resize adjustment

### Documentation

Added:

- status tracking
- test matrix
- known issues
- GNOME reference implementation notes
- installation workflow
- development workflow

### Reference implementation

The project references Ubuntu/Tiling Assistant for practical GNOME Shell / Mutter resize behavior patterns.
