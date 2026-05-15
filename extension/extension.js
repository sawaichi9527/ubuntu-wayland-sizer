import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const LOG_PREFIX = '[ubuntu-wayland-sizer]';
const KEYBINDING_RESIZE_LEFT = 'resize-left';

export default class UbuntuWaylandSizerExtension extends Extension {
    enable() {
        this._settings = this.getSettings('org.gnome.shell.extensions.ubuntu-wayland-sizer');

        Main.wm.addKeybinding(
            KEYBINDING_RESIZE_LEFT,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL,
            this._resizeFocusedWindowLeft.bind(this)
        );

        console.log(`${LOG_PREFIX} enabled`);
        console.log(`${LOG_PREFIX} registered keybinding: ${KEYBINDING_RESIZE_LEFT}`);
    }

    disable() {
        Main.wm.removeKeybinding(KEYBINDING_RESIZE_LEFT);

        this._settings = null;

        console.log(`${LOG_PREFIX} removed keybinding: ${KEYBINDING_RESIZE_LEFT}`);
        console.log(`${LOG_PREFIX} disabled`);
    }

    _resizeFocusedWindowLeft() {
        const window = global.display.get_focus_window();

        if (!window) {
            console.log(`${LOG_PREFIX} no focused window`);
            return;
        }

        if (window.window_type !== Meta.WindowType.NORMAL) {
            console.log(`${LOG_PREFIX} ignored non-normal window`);
            return;
        }

        const monitorIndex = window.get_monitor();
        const workArea = global.workspace_manager
            .get_active_workspace()
            .get_work_area_for_monitor(monitorIndex);

        const targetX = workArea.x;
        const targetY = workArea.y;
        const targetWidth = Math.floor(workArea.width / 2);
        const targetHeight = workArea.height;

        window.unmaximize(Meta.MaximizeFlags.BOTH);

        window.move_resize_frame(
            true,
            targetX,
            targetY,
            targetWidth,
            targetHeight
        );

        console.log(
            `${LOG_PREFIX} resized focused window to left half: ` +
            `${targetX},${targetY} ${targetWidth}x${targetHeight}`
        );
    }
}
