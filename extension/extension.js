import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const LOG_PREFIX = '[ubuntu-wayland-sizer]';
const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.ubuntu-wayland-sizer';
const KEYBINDING_RESIZE_LEFT = 'resize-left';

export default class UbuntuWaylandSizerExtension extends Extension {
    enable() {
        console.log(`${LOG_PREFIX} enable: start`);

        try {
            this._settings = this.getSettings(SETTINGS_SCHEMA);
            console.log(`${LOG_PREFIX} enable: settings loaded: ${SETTINGS_SCHEMA}`);

            Main.wm.addKeybinding(
                KEYBINDING_RESIZE_LEFT,
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                this._resizeFocusedWindowLeft.bind(this)
            );
            this._keybindingRegistered = true;
            console.log(`${LOG_PREFIX} enable: keybinding registered: ${KEYBINDING_RESIZE_LEFT}`);

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
        if (this._keybindingRegistered) {
            try {
                Main.wm.removeKeybinding(KEYBINDING_RESIZE_LEFT);
                console.log(`${LOG_PREFIX} cleanup: keybinding removed: ${KEYBINDING_RESIZE_LEFT}`);
            } catch (error) {
                console.error(`${LOG_PREFIX} cleanup: failed to remove keybinding: ${error?.stack ?? error}`);
            }
        }

        this._keybindingRegistered = false;
        this._settings = null;
    }

    _resizeFocusedWindowLeft() {
        console.log(`${LOG_PREFIX} action: resize-left triggered`);

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

        const targetX = workArea.x;
        const targetY = workArea.y;
        const targetWidth = Math.floor(workArea.width / 2);
        const targetHeight = workArea.height;

        try {
            window.unmaximize(Meta.MaximizeFlags.BOTH);

            window.move_resize_frame(
                true,
                targetX,
                targetY,
                targetWidth,
                targetHeight
            );

            console.log(
                `${LOG_PREFIX} action: resized focused window to left half: ` +
                `${targetX},${targetY} ${targetWidth}x${targetHeight}`
            );
        } catch (error) {
            console.error(`${LOG_PREFIX} action: resize-left failed: ${error?.stack ?? error}`);
        }
    }
}
