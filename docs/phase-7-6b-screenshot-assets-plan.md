# Phase 7.6b — Screenshot Assets Plan

## Purpose

Phase 7.6b defines the screenshot and visual-asset plan for Ubuntu Wayland Sizer release packaging.

This phase prepares the project for a more public-facing README and future release presentation.

It does not require runtime changes.

## Scope

Included:

- define screenshot list
- define asset directory layout
- define naming convention
- define privacy / masking rules
- define README usage plan
- define optional GIF capture direction

Excluded:

- runtime UI changes
- popup layout redesign
- image editing requirement
- publishing to extensions.gnome.org
- release ZIP packaging

## Asset Directory

Planned asset path:

    assets/screenshots/

Suggested files:

    assets/screenshots/popup-overview.png
    assets/screenshots/popup-center-presets.png
    assets/screenshots/popup-position-presets.png
    assets/screenshots/popup-saved-presets.png
    assets/screenshots/extension-manager-entry.png

Optional future files:

    assets/screenshots/center-cycle-demo.gif
    assets/screenshots/multi-monitor-demo.png

## Required Screenshots

### 1. Popup overview

Purpose:

- show the main popup
- show version title
- show major sections

Expected visible items:

- Ubuntu Wayland Sizer · v1.0
- Focused Window
- Current Displays
- Center Presets
- Position Presets
- Saved Presets
- Actions

Suggested filename:

    popup-overview.png

### 2. Center Presets

Purpose:

- show the expanded center preset library

Expected visible items:

- Tiny Center
- Compact Center
- Medium Center
- Wide-medium Center
- Large Center
- Ultra-wide Center

Suggested filename:

    popup-center-presets.png

### 3. Position Presets

Purpose:

- show the renamed Phase 7.5d wording

Expected visible items:

- Position Presets
- Left half
- Right half
- Full workarea

Suggested filename:

    popup-position-presets.png

### 4. Saved Presets

Purpose:

- show saved preset capability

Expected visible items:

- Saved Presets section
- example saved preset rows
- apply/delete controls if visible

Suggested filename:

    popup-saved-presets.png

Privacy note:

- Avoid showing real project names, customer names, private window titles, private paths, or private saved preset names.
- Use generic saved preset names where possible.

### 5. Extension Manager entry

Purpose:

- show the extension as listed in GNOME Extension Manager / Extensions app

Expected visible items:

- Ubuntu Wayland Sizer
- improved metadata description
- enabled / active state

Suggested filename:

    extension-manager-entry.png

Known limitation:

- View Details may still show an error for local/dev installs because the extension is not yet published on extensions.gnome.org.
- Do not use the error page as a main README screenshot.

## Screenshot Style Guidelines

Use:

- clean desktop background
- non-private window title
- neutral sample application
- readable popup size
- no unnecessary terminal noise
- no private file paths or company/customer names

Avoid:

- private Telegram / browser / email content
- internal customer names
- private workspace paths
- excessive debug log windows in main screenshots
- cluttered multi-window desktop unless the screenshot is specifically for multi-monitor behavior

## Recommended Capture Environment

Preferred baseline:

- Ubuntu 26.04
- GNOME Shell 50
- Wayland
- primary landscape monitor
- optional secondary portrait-right monitor for multi-monitor screenshot

Recommended scale:

- 100% or 125% for primary README screenshots
- mixed scaling screenshot can be optional and documented separately

## README Usage Plan

Initial README screenshot section can reference:

    assets/screenshots/popup-overview.png
    assets/screenshots/extension-manager-entry.png

Optional later additions:

    assets/screenshots/popup-center-presets.png
    assets/screenshots/popup-position-presets.png
    assets/screenshots/popup-saved-presets.png

## Optional GIF Direction

A short GIF may be useful later for:

- center preset cycling
- left/right/full preset switching
- popup preset selection

Suggested future filename:

    assets/screenshots/center-cycle-demo.gif

GIF should be optional because it increases repository size and may need compression.

## Pass Criteria

Phase 7.6b passes when:

- screenshot asset plan is documented
- asset directory policy is defined
- screenshot filenames are defined
- privacy rules are documented
- README usage plan is documented
- no runtime behavior changes are introduced
