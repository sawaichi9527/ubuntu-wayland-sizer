import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const LOG_PREFIX = '[ubuntu-wayland-sizer]';
const POST_RESIZE_CORRECTION_DELAY_MS = 80;

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
            this._pendingCorrectionIds = [];
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
            console.error(`${LOG_PREFIX} enable failed: ${this._formatError(error)}`);
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
        if (this._pendingCorrectionIds) {
            for (const sourceId of this._pendingCorrectionIds) {
                try {
                    GLib.source_remove(sourceId);
                } catch (error) {
                    console.error(`${LOG_PREFIX} cleanup: failed to remove pending correction ${sourceId}: ${this._formatError(error)}`);
                }
            }
        }

        if (this._registeredKeybindings) {
            for (const keybindingName of this._registeredKeybindings) {
                try {
                    Main.wm.removeKeybinding(keybindingName);
                    console.log(`${LOG_PREFIX} cleanup: keybinding removed: ${keybindingName}`);
                } catch (error) {
                    console.error(`${LOG_PREFIX} cleanup: failed to remove keybinding ${keybindingName}: ${this._formatError(error)}`);
                }
            }
        }

        this._pendingCorrectionIds = [];
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

        console.log(
            `${LOG_PREFIX} action: geometry context: ` +
            `monitor=${monitorIndex}, ` +
            `workarea=${workArea.x},${workArea.y} ${workArea.width}x${workArea.height}, ` +
            `frame=${frameRect.x},${frameRect.y} ${frameRect.width}x${frameRect.height}`
        );

        if (!target) {
            console.log(`${LOG_PREFIX} action: unknown preset: ${presetName}`);
            return;
        }

        if (!this._isUsableGeometry(target)) {
            console.error(
                `${LOG_PREFIX} action: invalid target geometry for ${presetName}: ` +
                `${target.x},${target.y} ${target.width}x${target.height}`
            );
            return;
        }

        this._unmaximizeBestEffort(window);

        try {
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

            this._schedulePostResizeCorrection(window, presetName, workArea, target);
        } catch (error) {
            console.error(
                `${LOG_PREFIX} action: move_resize_frame failed for ${presetName}: ` +
                `${this._formatError(error)}`
            );
        }
    }

    _schedulePostResizeCorrection(window, presetName, workArea, target) {
        if (![PRESETS.LEFT, PRESETS.RIGHT, PRESETS.CENTER].includes(presetName))
            return;

        const sourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            POST_RESIZE_CORRECTION_DELAY_MS,
            () => {
                this._pendingCorrectionIds = this._pendingCorrectionIds.filter(id => id !== sourceId);
                this._postResizeCorrection(window, presetName, workArea, target);
                return GLib.SOURCE_REMOVE;
            }
        );

        this._pendingCorrectionIds.push(sourceId);
    }

    _postResizeCorrection(window, presetName, workArea, requestedTarget) {
        try {
            const actualFrame = window.get_frame_rect();
            const correctedTarget = this._calculateCorrectionGeometry(
                presetName,
                workArea,
                requestedTarget,
                actualFrame
            );

            if (!correctedTarget || !this._isUsableGeometry(correctedTarget))
                return;

            if (this._isNearlySameFrame(actualFrame, correctedTarget)) {
                console.log(
                    `${LOG_PREFIX} action: post-correction not needed for ${presetName}: ` +
                    `actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}`
                );
                return;
            }

            window.move_resize_frame(
                true,
                correctedTarget.x,
                correctedTarget.y,
                correctedTarget.width,
                correctedTarget.height
            );

            console.log(
                `${LOG_PREFIX} action: post-corrected preset ${presetName}: ` +
                `actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}, ` +
                `corrected=${correctedTarget.x},${correctedTarget.y} ${correctedTarget.width}x${correctedTarget.height}`
            );
        } catch (error) {
            console.error(`${LOG_PREFIX} action: post-correction failed for ${presetName}: ${this._formatError(error)}`);
        }
    }

    _calculateCorrectionGeometry(presetName, workArea, requestedTarget, actualFrame) {
        switch (presetName) {
        case PRESETS.LEFT:
            return this._clampGeometryToWorkArea({
                x: workArea.x,
                y: workArea.y,
                width: actualFrame.width,
                height: actualFrame.height,
            }, workArea);

        case PRESETS.RIGHT:
            return this._clampGeometryToWorkArea({
                x: workArea.x + workArea.width - actualFrame.width,
                y: workArea.y,
                width: actualFrame.width,
                height: actualFrame.height,
            }, workArea);

        case PRESETS.CENTER:
            return this._clampGeometryToWorkArea({
                x: workArea.x + Math.floor((workArea.width - actualFrame.width) / 2),
                y: workArea.y + Math.floor((workArea.height - actualFrame.height) / 2),
                width: actualFrame.width,
                height: actualFrame.height,
            }, workArea);

        default:
            return requestedTarget;
        }
    }

    _isNearlySameFrame(frameRect, target) {
        return Math.abs(frameRect.x - target.x) <= 1 &&
            Math.abs(frameRect.y - target.y) <= 1 &&
            Math.abs(frameRect.width - target.width) <= 1 &&
            Math.abs(frameRect.height - target.height) <= 1;
    }

    _unmaximizeBestEffort(window) {
        try {
            if (window.get_maximized && window.get_maximized() !== 0) {
                window.unmaximize();
                console.log(`${LOG_PREFIX} action: unmaximized target window`);
            }
        } catch (error) {
            console.error(`${LOG_PREFIX} action: unmaximize skipped/failed: ${this._formatError(error)}`);
        }
    }

    _calculatePresetGeometry(presetName, workArea, frameRect) {
        const halfWidth = Math.floor(workArea.width / 2);

        switch (presetName) {
        case PRESETS.LEFT:
            return this._clampGeometryToWorkArea({
                x: workArea.x,
                y: workArea.y,
                width: halfWidth,
                height: workArea.height,
            }, workArea);

        case PRESETS.RIGHT:
            return this._clampGeometryToWorkArea({
                x: workArea.x + halfWidth,
                y: workArea.y,
                width: workArea.width - halfWidth,
                height: workArea.height,
            }, workArea);

        case PRESETS.FULL:
            return this._clampGeometryToWorkArea({
                x: workArea.x,
                y: workArea.y,
                width: workArea.width,
                height: workArea.height,
            }, workArea);

        case PRESETS.CENTER: {
            const targetWidth = Math.min(1280, workArea.width);
            const targetHeight = Math.min(720, workArea.height);

            return this._clampGeometryToWorkArea({
                x: workArea.x + Math.floor((workArea.width - targetWidth) / 2),
                y: workArea.y + Math.floor((workArea.height - targetHeight) / 2),
                width: targetWidth,
                height: targetHeight,
            }, workArea);
        }

        default:
            return null;
        }
    }

    _clampGeometryToWorkArea(geometry, workArea) {
        const maxX = workArea.x + workArea.width;
        const maxY = workArea.y + workArea.height;

        const x = Math.max(workArea.x, Math.min(geometry.x, maxX - 1));
        const y = Math.max(workArea.y, Math.min(geometry.y, maxY - 1));
        const width = Math.max(1, Math.min(geometry.width, maxX - x));
        const height = Math.max(1, Math.min(geometry.height, maxY - y));

        return { x, y, width, height };
    }

    _isUsableGeometry(geometry) {
        return Number.isFinite(geometry.x) &&
            Number.isFinite(geometry.y) &&
            Number.isFinite(geometry.width) &&
            Number.isFinite(geometry.height) &&
            geometry.width > 0 &&
            geometry.height > 0;
    }

    _formatError(error) {
        if (!error)
            return 'unknown error';

        const message = error.message ? `${error.message}\n` : '';
        const stack = error.stack ?? String(error);
        return `${message}${stack}`;
    }
}
