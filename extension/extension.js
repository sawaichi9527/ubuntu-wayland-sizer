import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const LOG_PREFIX = '[ubuntu-wayland-sizer]';
const POST_UNMAXIMIZE_RESIZE_DELAY_MS = 180;
const POST_RESIZE_CORRECTION_DELAY_MS = 90;
const FULL_WORKAREA_TOLERANCE_PX = 2;
const DEFAULT_CENTER_WIDTH = 1280;
const DEFAULT_CENTER_HEIGHT = 720;
const MIN_CENTER_SIZE = 100;

const PRESETS = Object.freeze({
    LEFT: 'left',
    RIGHT: 'right',
    FULL: 'full',
    CENTER: 'center',
    CENTER_COMPACT: 'center-compact',
    CENTER_LARGE: 'center-large',
});

const PRESET_TYPES = Object.freeze({
    LEFT_HALF: 'left-half',
    RIGHT_HALF: 'right-half',
    FULL_WORKAREA: 'full-workarea',
    CUSTOM_CENTER: 'custom-center',
    FIXED_CENTER: 'fixed-center',
});

const SIZE_LIBRARY = Object.freeze({
    BASIC_640X480: Object.freeze({ id: 'basic-640x480', group: 'basic', label: '640x480', width: 640, height: 480 }),
    BASIC_800X600: Object.freeze({ id: 'basic-800x600', group: 'basic', label: '800x600', width: 800, height: 600 }),
    BASIC_1024X768: Object.freeze({ id: 'basic-1024x768', group: 'basic', label: '1024x768', width: 1024, height: 768 }),
    BASIC_1152X864: Object.freeze({ id: 'basic-1152x864', group: 'basic', label: '1152x864', width: 1152, height: 864 }),
    BASIC_1280X960: Object.freeze({ id: 'basic-1280x960', group: 'basic', label: '1280x960', width: 1280, height: 960 }),
    LARGE_1440X768: Object.freeze({ id: 'large-1440x768', group: 'large', label: '1440x768', width: 1440, height: 768 }),
});

const PRESET_DEFINITIONS = Object.freeze({
    [PRESETS.LEFT]: Object.freeze({
        id: PRESETS.LEFT,
        type: PRESET_TYPES.LEFT_HALF,
        label: 'Left half',
    }),
    [PRESETS.RIGHT]: Object.freeze({
        id: PRESETS.RIGHT,
        type: PRESET_TYPES.RIGHT_HALF,
        label: 'Right half',
    }),
    [PRESETS.FULL]: Object.freeze({
        id: PRESETS.FULL,
        type: PRESET_TYPES.FULL_WORKAREA,
        label: 'Full workarea',
    }),
    [PRESETS.CENTER]: Object.freeze({
        id: PRESETS.CENTER,
        type: PRESET_TYPES.CUSTOM_CENTER,
        label: 'Custom center',
    }),
    [PRESETS.CENTER_COMPACT]: Object.freeze({
        id: PRESETS.CENTER_COMPACT,
        type: PRESET_TYPES.FIXED_CENTER,
        label: 'Compact center',
        size: SIZE_LIBRARY.BASIC_800X600,
    }),
    [PRESETS.CENTER_LARGE]: Object.freeze({
        id: PRESETS.CENTER_LARGE,
        type: PRESET_TYPES.FIXED_CENTER,
        label: 'Large center',
        size: SIZE_LIBRARY.LARGE_1440X768,
    }),
});

const KEYBINDINGS = Object.freeze([
    ['resize-left', PRESETS.LEFT],
    ['resize-right', PRESETS.RIGHT],
    ['resize-full', PRESETS.FULL],
    ['resize-center', PRESETS.CENTER],
    ['resize-center-compact', PRESETS.CENTER_COMPACT],
    ['resize-center-large', PRESETS.CENTER_LARGE],
]);

export default class UbuntuWaylandSizerExtension extends Extension {
    enable() {
        console.log(`${LOG_PREFIX} enable: start`);

        try {
            this._settings = this.getSettings();
            this._registeredKeybindings = [];
            this._pendingTimeoutIds = [];
            this._debugLogging = this._readDebugLogging();
            this._debugLog(`enable: settings loaded from metadata settings-schema; debug-logging=${this._debugLogging}`);

            for (const [keybindingName, presetName] of KEYBINDINGS) {
                Main.wm.addKeybinding(
                    keybindingName,
                    this._settings,
                    Meta.KeyBindingFlags.NONE,
                    Shell.ActionMode.NORMAL,
                    () => this._applyPresetToFocusedWindow(presetName)
                );

                this._registeredKeybindings.push(keybindingName);
                this._debugLog(`enable: keybinding registered: ${keybindingName} -> ${presetName}`);
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
        if (this._pendingTimeoutIds) {
            for (const sourceId of this._pendingTimeoutIds) {
                try {
                    GLib.source_remove(sourceId);
                } catch (error) {
                    console.error(`${LOG_PREFIX} cleanup: failed to remove pending timeout ${sourceId}: ${this._formatError(error)}`);
                }
            }
        }

        if (this._registeredKeybindings) {
            for (const keybindingName of this._registeredKeybindings) {
                try {
                    Main.wm.removeKeybinding(keybindingName);
                    this._debugLog(`cleanup: keybinding removed: ${keybindingName}`);
                } catch (error) {
                    console.error(`${LOG_PREFIX} cleanup: failed to remove keybinding ${keybindingName}: ${this._formatError(error)}`);
                }
            }
        }

        this._pendingTimeoutIds = [];
        this._registeredKeybindings = [];
        this._debugLogging = true;
        this._settings = null;
    }

    _applyPresetToFocusedWindow(presetName) {
        this._debugLog(`action: preset triggered: ${presetName}`);

        const window = global.display.get_focus_window();

        if (!window) {
            this._debugLog('action: no focused window');
            return;
        }

        if (window.window_type !== Meta.WindowType.NORMAL) {
            this._debugLog('action: ignored non-normal window');
            return;
        }

        const context = this._getWindowContext(window);

        if (presetName !== PRESETS.FULL && this._isEffectivelyFullWorkarea(window, context.workArea, context.frameRect)) {
            this._breakOutFromFullWorkarea(window, presetName, context);
            return;
        }

        this._applyPresetToWindow(window, presetName, 'direct');
    }

    _breakOutFromFullWorkarea(window, presetName, context) {
        this._debugLog(
            `action: full-workarea state detected; ` +
            `breaking out before preset ${presetName}: ` +
            `monitor=${context.monitorIndex}, ` +
            `workarea=${context.workArea.x},${context.workArea.y} ${context.workArea.width}x${context.workArea.height}, ` +
            `frame=${context.frameRect.x},${context.frameRect.y} ${context.frameRect.width}x${context.frameRect.height}`
        );

        try {
            this._unmakeFullscreenBestEffort(window);
            this._unmaximizeBestEffort(window);
            this._moveToMonitorBestEffort(window, context.monitorIndex);

            const safeRect = this._calculateSafeRestoreGeometry(context.workArea);
            window.move_frame(true, safeRect.x, safeRect.y);
            window.move_resize_frame(true, safeRect.x, safeRect.y, safeRect.width, safeRect.height);

            this._debugLog(
                `action: applied safe restore before preset ${presetName}: ` +
                `${safeRect.x},${safeRect.y} ${safeRect.width}x${safeRect.height}`
            );
        } catch (error) {
            console.error(`${LOG_PREFIX} action: safe restore failed before preset ${presetName}: ${this._formatError(error)}`);
        }

        this._scheduleTimeout(POST_UNMAXIMIZE_RESIZE_DELAY_MS, () => {
            this._applyPresetToWindow(window, presetName, 'after-full-workarea-breakout');
        });
    }

    _applyPresetToWindow(window, presetName, reason) {
        const context = this._getWindowContext(window);
        const target = this._calculatePresetGeometry(presetName, context.workArea, context.frameRect);

        this._debugLog(
            `action: geometry context (${reason}): ` +
            `monitor=${context.monitorIndex}, ` +
            `workarea=${context.workArea.x},${context.workArea.y} ${context.workArea.width}x${context.workArea.height}, ` +
            `frame=${context.frameRect.x},${context.frameRect.y} ${context.frameRect.width}x${context.frameRect.height}`
        );

        if (!target) {
            this._debugLog(`action: unknown preset: ${presetName}`);
            return;
        }

        if (!this._isUsableGeometry(target)) {
            console.error(
                `${LOG_PREFIX} action: invalid target geometry for ${presetName}: ` +
                `${target.x},${target.y} ${target.width}x${target.height}`
            );
            return;
        }

        try {
            this._moveToMonitorBestEffort(window, context.monitorIndex);
            window.move_frame(true, target.x, target.y);
            window.move_resize_frame(true, target.x, target.y, target.width, target.height);

            this._debugLog(
                `action: applied preset ${presetName}: ` +
                `${target.x},${target.y} ${target.width}x${target.height}`
            );

            this._schedulePostResizeCorrection(window, presetName, context.workArea, target);
        } catch (error) {
            console.error(
                `${LOG_PREFIX} action: move_resize_frame failed for ${presetName}: ` +
                `${this._formatError(error)}`
            );
        }
    }

    _getWindowContext(window) {
        const monitorIndex = window.get_monitor();
        const workspace = global.workspace_manager.get_active_workspace();
        const workArea = workspace.get_work_area_for_monitor(monitorIndex);
        const frameRect = window.get_frame_rect();

        return { monitorIndex, workspace, workArea, frameRect };
    }

    _schedulePostResizeCorrection(window, presetName, workArea, target) {
        if (![PRESETS.LEFT, PRESETS.RIGHT, PRESETS.CENTER, PRESETS.CENTER_COMPACT, PRESETS.CENTER_LARGE].includes(presetName))
            return;

        this._scheduleTimeout(POST_RESIZE_CORRECTION_DELAY_MS, () => {
            this._postResizeCorrection(window, presetName, workArea, target, 1);
        });
    }

    _scheduleTimeout(delayMs, callback) {
        const sourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            delayMs,
            () => {
                this._pendingTimeoutIds = this._pendingTimeoutIds.filter(id => id !== sourceId);
                callback();
                return GLib.SOURCE_REMOVE;
            }
        );

        this._pendingTimeoutIds.push(sourceId);
        return sourceId;
    }

    _postResizeCorrection(window, presetName, workArea, requestedTarget, attempt) {
        try {
            const actualFrame = window.get_frame_rect();

            if (this._isFrameNearlyEqualToWorkArea(actualFrame, workArea) && !this._isFrameNearlySameGeometry(actualFrame, requestedTarget)) {
                this._debugLog(
                    `action: resize rejected for ${presetName}; retrying requested target ` +
                    `(attempt=${attempt}): actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}, ` +
                    `requested=${requestedTarget.x},${requestedTarget.y} ${requestedTarget.width}x${requestedTarget.height}`
                );

                if (attempt <= 2) {
                    window.move_frame(true, requestedTarget.x, requestedTarget.y);
                    window.move_resize_frame(true, requestedTarget.x, requestedTarget.y, requestedTarget.width, requestedTarget.height);

                    this._scheduleTimeout(POST_RESIZE_CORRECTION_DELAY_MS, () => {
                        this._postResizeCorrection(window, presetName, workArea, requestedTarget, attempt + 1);
                    });
                }
                return;
            }

            const correctedTarget = this._calculateCorrectionGeometry(
                presetName,
                workArea,
                requestedTarget,
                actualFrame
            );

            if (!correctedTarget || !this._isUsableGeometry(correctedTarget))
                return;

            if (this._isNearlySameFrame(actualFrame, correctedTarget)) {
                this._debugLog(
                    `action: post-correction not needed for ${presetName}: ` +
                    `actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}`
                );
                return;
            }

            window.move_frame(true, correctedTarget.x, correctedTarget.y);
            window.move_resize_frame(
                true,
                correctedTarget.x,
                correctedTarget.y,
                correctedTarget.width,
                correctedTarget.height
            );

            this._debugLog(
                `action: post-corrected preset ${presetName}: ` +
                `actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}, ` +
                `corrected=${correctedTarget.x},${correctedTarget.y} ${correctedTarget.width}x${correctedTarget.height}`
            );
        } catch (error) {
            console.error(`${LOG_PREFIX} action: post-correction failed for ${presetName}: ${this._formatError(error)}`);
        }
    }

    _calculateCorrectionGeometry(presetName, workArea, requestedTarget, actualFrame) {
        const definition = PRESET_DEFINITIONS[presetName];

        switch (definition?.type) {
        case PRESET_TYPES.LEFT_HALF:
            return this._clampGeometryToWorkArea({
                x: workArea.x,
                y: workArea.y,
                width: actualFrame.width,
                height: actualFrame.height,
            }, workArea);

        case PRESET_TYPES.RIGHT_HALF:
            return this._clampGeometryToWorkArea({
                x: workArea.x + workArea.width - actualFrame.width,
                y: workArea.y,
                width: actualFrame.width,
                height: actualFrame.height,
            }, workArea);

        case PRESET_TYPES.CUSTOM_CENTER:
        case PRESET_TYPES.FIXED_CENTER:
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

    _isFrameNearlySameGeometry(frameRect, geometry) {
        return Math.abs(frameRect.x - geometry.x) <= FULL_WORKAREA_TOLERANCE_PX &&
            Math.abs(frameRect.y - geometry.y) <= FULL_WORKAREA_TOLERANCE_PX &&
            Math.abs(frameRect.width - geometry.width) <= FULL_WORKAREA_TOLERANCE_PX &&
            Math.abs(frameRect.height - geometry.height) <= FULL_WORKAREA_TOLERANCE_PX;
    }

    _isFrameNearlyEqualToWorkArea(frameRect, workArea) {
        return Math.abs(frameRect.x - workArea.x) <= FULL_WORKAREA_TOLERANCE_PX &&
            Math.abs(frameRect.y - workArea.y) <= FULL_WORKAREA_TOLERANCE_PX &&
            Math.abs(frameRect.width - workArea.width) <= FULL_WORKAREA_TOLERANCE_PX &&
            Math.abs(frameRect.height - workArea.height) <= FULL_WORKAREA_TOLERANCE_PX;
    }

    _isEffectivelyFullWorkarea(window, workArea, frameRect) {
        return this._isWindowMaximized(window) || this._isFrameNearlyEqualToWorkArea(frameRect, workArea);
    }

    _isWindowMaximized(window) {
        try {
            if (window.get_maximized && window.get_maximized() !== 0)
                return true;

            return Boolean(window.maximizedHorizontally && window.maximizedVertically);
        } catch (error) {
            console.error(`${LOG_PREFIX} action: failed to check maximized state: ${this._formatError(error)}`);
            return false;
        }
    }

    _unmakeFullscreenBestEffort(window) {
        try {
            if (window.unmake_fullscreen)
                window.unmake_fullscreen();
        } catch (error) {
            console.error(`${LOG_PREFIX} action: unmake_fullscreen skipped/failed: ${this._formatError(error)}`);
        }
    }

    _unmaximizeBestEffort(window) {
        try {
            if (!window.unmaximize)
                return;

            if (window.unmaximize.length === 0) {
                window.unmaximize();
            } else if (window.get_maximized) {
                window.unmaximize(window.get_maximized());
            } else {
                window.unmaximize(Meta.MaximizeFlags.BOTH);
            }
        } catch (error) {
            console.error(`${LOG_PREFIX} action: unmaximize skipped/failed: ${this._formatError(error)}`);
        }
    }

    _moveToMonitorBestEffort(window, monitorIndex) {
        try {
            if (window.move_to_monitor)
                window.move_to_monitor(monitorIndex);
        } catch (error) {
            console.error(`${LOG_PREFIX} action: move_to_monitor skipped/failed: ${this._formatError(error)}`);
        }
    }

    _calculateSafeRestoreGeometry(workArea) {
        const width = Math.max(1, Math.floor(workArea.width * 0.72));
        const height = Math.max(1, Math.floor(workArea.height * 0.72));

        return this._clampGeometryToWorkArea({
            x: workArea.x + Math.floor((workArea.width - width) / 2),
            y: workArea.y + Math.floor((workArea.height - height) / 2),
            width,
            height,
        }, workArea);
    }

    _calculatePresetGeometry(presetName, workArea, frameRect) {
        const definition = PRESET_DEFINITIONS[presetName];

        if (!definition)
            return null;

        const halfWidth = Math.floor(workArea.width / 2);

        switch (definition.type) {
        case PRESET_TYPES.LEFT_HALF:
            return this._clampGeometryToWorkArea({
                x: workArea.x,
                y: workArea.y,
                width: halfWidth,
                height: workArea.height,
            }, workArea);

        case PRESET_TYPES.RIGHT_HALF:
            return this._clampGeometryToWorkArea({
                x: workArea.x + halfWidth,
                y: workArea.y,
                width: workArea.width - halfWidth,
                height: workArea.height,
            }, workArea);

        case PRESET_TYPES.FULL_WORKAREA:
            return this._clampGeometryToWorkArea({
                x: workArea.x,
                y: workArea.y,
                width: workArea.width,
                height: workArea.height,
            }, workArea);

        case PRESET_TYPES.CUSTOM_CENTER:
            return this._calculateCenterPresetGeometry(definition, workArea, this._readCenterSize());

        case PRESET_TYPES.FIXED_CENTER:
            return this._calculateCenterPresetGeometry(definition, workArea, definition.size);

        default:
            return null;
        }
    }

    _calculateCenterPresetGeometry(definition, workArea, centerSize) {
        const targetWidth = Math.min(centerSize.width, workArea.width);
        const targetHeight = Math.min(centerSize.height, workArea.height);

        this._debugLog(
            `action: ${definition.id} preset size: configured=${centerSize.width}x${centerSize.height}, ` +
            `target=${targetWidth}x${targetHeight}`
        );

        return this._clampGeometryToWorkArea({
            x: workArea.x + Math.floor((workArea.width - targetWidth) / 2),
            y: workArea.y + Math.floor((workArea.height - targetHeight) / 2),
            width: targetWidth,
            height: targetHeight,
        }, workArea);
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

    _readCenterSize() {
        try {
            const width = this._settings?.get_int('center-width') ?? DEFAULT_CENTER_WIDTH;
            const height = this._settings?.get_int('center-height') ?? DEFAULT_CENTER_HEIGHT;

            return {
                width: Math.max(MIN_CENTER_SIZE, width),
                height: Math.max(MIN_CENTER_SIZE, height),
            };
        } catch (error) {
            console.error(`${LOG_PREFIX} failed to read center size settings: ${this._formatError(error)}`);
            return {
                width: DEFAULT_CENTER_WIDTH,
                height: DEFAULT_CENTER_HEIGHT,
            };
        }
    }

    _readDebugLogging() {
        try {
            return this._settings?.get_boolean('debug-logging') ?? true;
        } catch (error) {
            console.error(`${LOG_PREFIX} failed to read debug-logging setting: ${this._formatError(error)}`);
            return true;
        }
    }

    _debugLog(message) {
        this._debugLogging = this._readDebugLogging();

        if (this._debugLogging)
            console.log(`${LOG_PREFIX} ${message}`);
    }

    _formatError(error) {
        if (!error)
            return 'unknown error';

        const message = error.message ? `${error.message}\n` : '';
        const stack = error.stack ?? String(error);
        return `${message}${stack}`;
    }
}
