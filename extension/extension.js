import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const LOG_PREFIX = '[ubuntu-wayland-sizer]';

const PRESETS = Object.freeze({
    LEFT: 'left',
    RIGHT: 'right',
    FULL: 'full',
    CENTER: 'center',
});

const KEYBINDINGS = Object.freeze([
    ['resize-left', PRESETS.LEFT],
    ['resize-right', PRESETS.RIGHT],
    ['resize-full', PRESETS.FULL],
    ['resize-center', PRESETS.CENTER],
]);

export default class UbuntuWaylandSizerExtension extends Extension {
    enable() {
        console.log(`${LOG_PREFIX} enable: start`);

        try {
            this._settings = this.getSettings();
            this._registeredKeybindings = [];
            console.log(`${LOG_PREFIX} enable: settings loaded from metadata settings-schema`);

            for (const [keybindingName, presetName] of KEYBINDINGS) {
                Main.wm.addKeybinding(
                    keybindingName,
                    this._settings,
                    Meta.KeyBindingFlags.NONE,
                    Shell.ActionMode.NORMAL,
                    () => this._applyPresetToFocusedWindow(presetName)
                );

                this._registeredKeybindings.push(keybindingName);
                console.log(`${LOG_PREFIX} enable: keybinding registered: ${keybindingName} -> ${presetName}`);
            }

            console.log(`${LOG_PREFIX} enabled`);
        } catch (error) {
            console.error(`${LOG_PREFIX} enable failed: ${error?.stack ?? error}`);
            this._cleanup();
            throw error;
        }
    }

    disable() {
        console.log(`${LOG_PREFIX} disable: start`);
        this._cleanup();
        console.log(`${LOG_PREFIX} disabled`);
    }

    _cleanup() {
        if (this._registeredKeybindings) {
            for (const keybindingName of this._registeredKeybindings) {
                try {
                    Main.wm.removeKeybinding(keybindingName);
                    console.log(`${LOG_PREFIX} cleanup: keybinding removed: ${keybindingName}`);
                } catch (error) {
                    console.error(`${LOG_PREFIX} cleanup: failed to remove keybinding ${keybindingName}: ${error?.stack ?? error}`);
                }
            }
        }

        this._registeredKeybindings = [];
        this._settings = null;
    }

    _applyPresetToFocusedWindow(presetName) {
        console.log(`${LOG_PREFIX} action: preset triggered: ${presetName}`);

        const window = global.display.get_focus_window();

        if (!window) {
            console.log(`${LOG_PREFIX} action: no focused window`);
            return;
        }

        if (window.window_type !== Meta.WindowType.NORMAL) {
            console.log(`${LOG_PREFIX} action: ignored non-normal window`);
            return;
        }

        const monitorIndex = window.get_monitor();
        const workspace = global.workspace_manager.get_active_workspace();
        const workArea = workspace.get_work_area_for_monitor(monitorIndex);
        const frameRect = window.get_frame_rect();
        const target = this._calculatePresetGeometry(presetName, workArea, frameRect);

        if (!target) {
            console.log(`${LOG_PREFIX} action: unknown preset: ${presetName}`);
            return;
        }

        try {
            window.unmaximize(Meta.MaximizeFlags.BOTH);

            window.move_resize_frame(
                true,
                target.x,
                target.y,
                target.width,
                target.height
            );

            console.log(
                `${LOG_PREFIX} action: applied preset ${presetName}: ` +
                `${target.x},${target.y} ${target.width}x${target.height}`
            );
        } catch (error) {
            console.error(`${LOG_PREFIX} action: preset ${presetName} failed: ${error?.stack ?? error}`);
        }
    }

    _calculatePresetGeometry(presetName, workArea, frameRect) {
        const halfWidth = Math.floor(workArea.width / 2);

        switch (presetName) {
        case PRESETS.LEFT:
            return {
                x: workArea.x,
                y: workArea.y,
                width: halfWidth,
                height: workArea.height,
            };

        case PRESETS.RIGHT:
            return {
                x: workArea.x + halfWidth,
                y: workArea.y,
                width: workArea.width - halfWidth,
                height: workArea.height,
            };

        case PRESETS.FULL:
            return {
                x: workArea.x,
                y: workArea.y,
                width: workArea.width,
                height: workArea.height,
            };

        case PRESETS.CENTER: {
            const targetWidth = Math.min(1280, workArea.width);
            const targetHeight = Math.min(720, workArea.height);

            return {
                x: workArea.x + Math.floor((workArea.width - targetWidth) / 2),
                y: workArea.y + Math.floor((workArea.height - targetHeight) / 2),
                width: targetWidth,
                height: targetHeight,
            };
        }

        default:
            return null;
        }
    }
}
