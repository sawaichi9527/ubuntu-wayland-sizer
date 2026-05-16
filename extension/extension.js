import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

const LOG_PREFIX = '[ubuntu-wayland-sizer]';
const LOG_LEVELS = Object.freeze({
    NORMAL: 'NORMAL',
    DEBUG: 'DEBUG',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
});
const POST_UNMAXIMIZE_RESIZE_DELAY_MS = 180;
const POST_RESIZE_CORRECTION_DELAY_MS = 90;
const FULL_WORKAREA_TOLERANCE_PX = 2;
const DEFAULT_CENTER_WIDTH = 1280;
const DEFAULT_CENTER_HEIGHT = 720;
const MIN_CENTER_SIZE = 100;
const UNKNOWN_CYCLE_INDEX = -1;
const UNKNOWN_MONITOR_INDEX = -1;
const CUSTOM_PRESETS_KEY = 'custom-presets-json';
const CUSTOM_PRESETS_VERSION = 1;
const CUSTOM_PRESET_KIND = 'relative-geometry';
const CUSTOM_PRESET_NAME_MAX_LENGTH = 80;
const POPUP_SCROLL_MAX_HEIGHT = 760;
const POPUP_REOPEN_DELAY_MS = 80;
const PRESET_FEEDBACK_OVERLAY_DURATION_MS = 1300;

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

const PRESET_DEFINITIONS = Object.freeze({
    [PRESETS.LEFT]: Object.freeze({ id: PRESETS.LEFT, type: PRESET_TYPES.LEFT_HALF, label: 'Left half' }),
    [PRESETS.RIGHT]: Object.freeze({ id: PRESETS.RIGHT, type: PRESET_TYPES.RIGHT_HALF, label: 'Right half' }),
    [PRESETS.FULL]: Object.freeze({ id: PRESETS.FULL, type: PRESET_TYPES.FULL_WORKAREA, label: 'Full workarea' }),
    [PRESETS.CENTER]: Object.freeze({ id: PRESETS.CENTER, type: PRESET_TYPES.CUSTOM_CENTER, label: 'Custom center' }),
    [PRESETS.CENTER_COMPACT]: Object.freeze({ id: PRESETS.CENTER_COMPACT, type: PRESET_TYPES.FIXED_CENTER, label: 'Compact center', size: Object.freeze({ width: 800, height: 600 }) }),
    [PRESETS.CENTER_LARGE]: Object.freeze({ id: PRESETS.CENTER_LARGE, type: PRESET_TYPES.FIXED_CENTER, label: 'Large center', size: Object.freeze({ width: 1440, height: 768 }) }),
});

const CENTER_CYCLE_PRESETS = Object.freeze([PRESETS.CENTER_COMPACT, PRESETS.CENTER, PRESETS.CENTER_LARGE]);
const CYCLE_DIRECTIONS = Object.freeze({ NEXT: 1, PREVIOUS: -1 });

const PRESET_KEYBINDINGS = Object.freeze([
    ['resize-left', PRESETS.LEFT],
    ['resize-right', PRESETS.RIGHT],
    ['resize-full', PRESETS.FULL],
    ['resize-center', PRESETS.CENTER],
    ['resize-center-compact', PRESETS.CENTER_COMPACT],
    ['resize-center-large', PRESETS.CENTER_LARGE],
]);

const CYCLE_KEYBINDINGS = Object.freeze([
    ['cycle-center-next', CYCLE_DIRECTIONS.NEXT],
    ['cycle-center-previous', CYCLE_DIRECTIONS.PREVIOUS],
]);

const POPUP_KEYBINDINGS = Object.freeze(['open-preset-popup']);

const POPUP_PRESET_GROUPS = Object.freeze([
    Object.freeze({ title: 'Center Presets', presets: Object.freeze([PRESETS.CENTER_COMPACT, PRESETS.CENTER, PRESETS.CENTER_LARGE]) }),
    Object.freeze({ title: 'Window Positions', presets: Object.freeze([PRESETS.LEFT, PRESETS.RIGHT, PRESETS.FULL]) }),
]);

const SavePresetDialog = GObject.registerClass(
class SavePresetDialog extends ModalDialog.ModalDialog {
    _init(extension, suggestedName) {
        super._init({ styleClass: 'ubuntu-wayland-sizer-save-dialog' });
        this._extension = extension;
        this._entry = null;
        this._errorLabel = null;
        this._buildLayout(suggestedName);
        this.setButtons([
            { label: 'Cancel', action: () => this._cancel() },
            { label: 'Save', action: () => this._save(), default: true },
        ]);
    }

    _buildLayout(suggestedName) {
        const content = new St.BoxLayout({ vertical: true, style: 'spacing: 12px; min-width: 420px;' });
        content.add_child(new St.Label({ text: 'Save Current Window As Preset', style: 'font-size: 18px; font-weight: bold;' }));
        content.add_child(new St.Label({ text: 'Preset name:' }));

        this._entry = new St.Entry({
            text: suggestedName,
            can_focus: true,
            hint_text: 'Preset name',
            style: 'min-width: 360px;',
        });
        content.add_child(this._entry);

        this._errorLabel = new St.Label({ text: '', style: 'color: #ff9b9b;' });
        content.add_child(this._errorLabel);
        this.contentLayout.add_child(content);
    }

    _cancel() {
        this.close();
        this._extension._reopenPresetPopupAfterDialogDecision('save', 'cancel');
    }

    _save() {
        const rawName = this._entry?.get_text ? this._entry.get_text() : this._entry?.clutter_text?.get_text();
        const result = this._extension._validateCustomPresetName(rawName ?? '');

        if (!result.ok) {
            this._errorLabel.set_text(result.message);
            this._extension._debugLog(`custom-preset: save rejected: ${result.reason}`);
            this._entry?.grab_key_focus?.();
            return;
        }

        this.close();
        this._extension._saveFocusedWindowGeometryAsCustomPreset(result.name);
        this._extension._reopenPresetPopupAfterDialogDecision('save', 'confirm');
    }
});

const DeletePresetDialog = GObject.registerClass(
class DeletePresetDialog extends ModalDialog.ModalDialog {
    _init(extension, preset) {
        super._init({ styleClass: 'ubuntu-wayland-sizer-delete-dialog' });
        this._extension = extension;
        this._preset = preset;
        this._buildLayout();
        this.setButtons([
            { label: 'Cancel', action: () => this._cancel() },
            { label: 'Delete', action: () => this._delete(), default: true },
        ]);
    }

    _buildLayout() {
        const content = new St.BoxLayout({ vertical: true, style: 'spacing: 12px; min-width: 460px;' });
        content.add_child(new St.Label({ text: 'Delete Saved Preset', style: 'font-size: 18px; font-weight: bold;' }));
        content.add_child(new St.Label({ text: 'Delete this saved preset?' }));
        content.add_child(new St.Label({ text: this._extension._formatCustomPresetButtonLabel(this._preset), style: 'font-weight: bold;' }));
        content.add_child(new St.Label({ text: 'This cannot be undone.', style: 'color: #ffb86c;' }));
        this.contentLayout.add_child(content);
    }

    _cancel() {
        this.close();
        this._extension._reopenPresetPopupAfterDialogDecision('delete', 'cancel');
    }

    _delete() {
        this.close();
        this._extension._deleteCustomPresetById(this._preset.id, { reopenPopup: true });
    }
});

const PresetPopupDialog = GObject.registerClass(
class PresetPopupDialog extends ModalDialog.ModalDialog {
    _init(extension, window, context) {
        super._init({ styleClass: 'ubuntu-wayland-sizer-dialog' });
        this._extension = extension;
        this._window = window;
        this._context = context;
        this._buildLayout();
        this.setButtons([{ label: 'Close', action: () => this.close() }]);
    }

    _buildLayout() {
        const outer = new St.BoxLayout({ vertical: true, style: 'spacing: 10px; min-width: 700px;' });
        outer.add_child(new St.Label({
            text: 'Ubuntu Wayland Sizer',
            x_align: Clutter.ActorAlign.CENTER,
            style: 'font-size: 20px; font-weight: bold; text-align: center;',
        }));

        const scrollView = new St.ScrollView({
            style: `max-height: ${POPUP_SCROLL_MAX_HEIGHT}px;`,
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            overlay_scrollbars: true,
        });
        const content = new St.BoxLayout({ vertical: true, style: 'spacing: 8px; min-width: 680px; padding-right: 6px;' });

        content.add_child(this._buildGeometrySection());
        content.add_child(this._buildCurrentDisplaysSection());

        for (const group of POPUP_PRESET_GROUPS)
            content.add_child(this._buildPresetGroup(group));

        const customPresets = this._extension._readCustomPresets();
        if (customPresets.length > 0)
            content.add_child(this._buildCustomPresetGroup(customPresets));

        content.add_child(this._buildActionsSection());
        scrollView.add_child(content);
        outer.add_child(scrollView);
        this.contentLayout.add_child(outer);
    }

    _buildGeometrySection() {
        const { monitorIndex, workArea, frameRect } = this._context;
        const relativeX = frameRect.x - workArea.x;
        const relativeY = frameRect.y - workArea.y;
        const currentPresetLabel = this._extension._getCurrentPresetLabel(this._context);
        const box = new St.BoxLayout({ vertical: true, style: 'spacing: 2px; padding: 8px 10px; border-radius: 8px; background-color: rgba(255,255,255,0.08);' });
        box.add_child(new St.Label({ text: 'Focused Window', style: 'font-weight: bold;' }));
        box.add_child(new St.Label({ text: `Current preset: ${currentPresetLabel}`, style: 'color: #3584e4; font-weight: bold;' }));
        box.add_child(new St.Label({ text: `Display ${monitorIndex + 1} · ${frameRect.width}x${frameRect.height} · frame ${frameRect.x},${frameRect.y}` }));
        box.add_child(new St.Label({ text: `Workarea ${workArea.x},${workArea.y} ${workArea.width}x${workArea.height} · relative ${relativeX},${relativeY}` }));
        return box;
    }

    _buildCurrentDisplaysSection() {
        const box = new St.BoxLayout({ vertical: true, style: 'spacing: 2px; padding: 8px 10px; border-radius: 8px; background-color: rgba(255,255,255,0.06);' });
        box.add_child(new St.Label({ text: 'Current Displays', style: 'font-weight: bold;' }));

        for (const display of this._extension._getDisplayInfos())
            box.add_child(new St.Label({ text: `${display.displayNumber}. ${display.label} · ${this._extension._formatOrientation(display.orientation)} · ${display.workArea.width}x${display.workArea.height}` }));

        return box;
    }

    _buildPresetGroup(group) {
        const box = new St.BoxLayout({ vertical: true, style: 'spacing: 4px;' });
        box.add_child(new St.Label({ text: group.title, style: 'font-weight: bold; padding-top: 4px;' }));

        for (const presetName of group.presets) {
            const definition = PRESET_DEFINITIONS[presetName];
            const button = new St.Button({
                label: this._formatPresetButtonLabel(presetName, definition),
                can_focus: true,
                style: 'padding: 6px 10px; border-radius: 6px; background-color: rgba(255,255,255,0.10); text-align: left;',
            });
            button.connect('clicked', () => {
                this.close();
                this._extension._debugLog(`popup: selected preset ${presetName}`);
                this._extension._applyPresetToFocusedWindow(presetName);
            });
            box.add_child(button);
        }

        return box;
    }

    _buildCustomPresetGroup(customPresets) {
        const box = new St.BoxLayout({ vertical: true, style: 'spacing: 4px;' });
        box.add_child(new St.Label({ text: 'Saved Presets', style: 'font-weight: bold; padding-top: 4px;' }));

        for (const preset of customPresets) {
            const row = new St.BoxLayout({ vertical: false, style: 'spacing: 6px;' });
            const applyButton = new St.Button({
                label: this._extension._formatCustomPresetButtonLabel(preset),
                can_focus: true,
                x_expand: true,
                style: 'padding: 6px 10px; border-radius: 6px; background-color: rgba(255,255,255,0.10); text-align: left;',
            });
            const deleteButton = new St.Button({
                label: 'Delete',
                can_focus: true,
                style: 'padding: 6px 10px; border-radius: 6px; background-color: rgba(255,120,120,0.16);',
            });

            applyButton.connect('clicked', () => {
                this.close();
                this._extension._applyCustomPresetToFocusedWindow(preset);
            });

            deleteButton.connect('clicked', () => {
                this.close();
                this._extension._openDeletePresetDialog(preset);
            });

            row.add_child(applyButton);
            row.add_child(deleteButton);
            box.add_child(row);
        }

        return box;
    }

    _buildActionsSection() {
        const box = new St.BoxLayout({ vertical: true, style: 'spacing: 4px;' });
        box.add_child(new St.Label({ text: 'Actions', style: 'font-weight: bold; padding-top: 4px;' }));

        const button = new St.Button({
            label: 'Save Current Window As Preset',
            can_focus: true,
            style: 'padding: 6px 10px; border-radius: 6px; background-color: rgba(255,255,255,0.10); text-align: left;',
        });
        button.connect('clicked', () => {
            this.close();
            this._extension._openSavePresetDialog();
        });

        box.add_child(button);
        return box;
    }

    _formatPresetButtonLabel(presetName, definition) {
        switch (definition?.type) {
        case PRESET_TYPES.LEFT_HALF:
            return `${definition.label} — current workarea left half`;
        case PRESET_TYPES.RIGHT_HALF:
            return `${definition.label} — current workarea right half`;
        case PRESET_TYPES.FULL_WORKAREA:
            return `${definition.label} — current workarea`;
        case PRESET_TYPES.CUSTOM_CENTER: {
            const size = this._extension._readCenterSize();
            return `${definition.label} — ${size.width}x${size.height}`;
        }
        case PRESET_TYPES.FIXED_CENTER:
            return `${definition.label} — ${definition.size.width}x${definition.size.height}`;
        default:
            return presetName;
        }
    }
});

export default class UbuntuWaylandSizerExtension extends Extension {
    enable() {
        this._normalLog('enable: start');

        try {
            this._settings = this.getSettings();
            this._registeredKeybindings = [];
            this._pendingTimeoutIds = [];
            this._centerCycleIndex = UNKNOWN_CYCLE_INDEX;
            this._presetPopupDialog = null;
            this._savePresetDialog = null;
            this._deletePresetDialog = null;
            this._lastPopupWindow = null;
            this._presetFeedbackOverlay = null;
            this._presetFeedbackTitleLabel = null;
            this._presetFeedbackSizeLabel = null;
            this._presetFeedbackTimeoutId = 0;
            this._debugLogging = this._readDebugLogging();
            this._debugLog(`enable: settings loaded from metadata settings-schema; debug-logging=${this._debugLogging}`);

            for (const [keybindingName, presetName] of PRESET_KEYBINDINGS) {
                Main.wm.addKeybinding(keybindingName, this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, () => this._applyPresetToFocusedWindow(presetName));
                this._registeredKeybindings.push(keybindingName);
                this._debugLog(`enable: keybinding registered: ${keybindingName} -> ${presetName}`);
            }

            for (const [keybindingName, direction] of CYCLE_KEYBINDINGS) {
                Main.wm.addKeybinding(keybindingName, this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, () => this._cycleCenterPreset(direction));
                this._registeredKeybindings.push(keybindingName);
                this._debugLog(`enable: keybinding registered: ${keybindingName} -> center-cycle(${direction})`);
            }

            for (const keybindingName of POPUP_KEYBINDINGS) {
                Main.wm.addKeybinding(keybindingName, this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, () => this._openPresetPopup());
                this._registeredKeybindings.push(keybindingName);
                this._debugLog(`enable: keybinding registered: ${keybindingName} -> preset-popup`);
            }

            this._normalLog('enabled');
        } catch (error) {
            this._criticalLog(`enable failed: ${this._formatError(error)}`);
            this._cleanup();
            throw error;
        }
    }

    disable() {
        this._normalLog('disable: start');
        this._cleanup();
        this._normalLog('disabled');
    }

    _cleanup() {
        this._closePresetPopupDialog('cleanup');
        this._closeSavePresetDialog('cleanup');
        this._closeDeletePresetDialog('cleanup');
        this._destroyPresetFeedbackOverlay('cleanup');

        if (this._pendingTimeoutIds) {
            for (const sourceId of this._pendingTimeoutIds) {
                try {
                    GLib.source_remove(sourceId);
                } catch (error) {
                    this._warningLog(`cleanup: failed to remove pending timeout ${sourceId}: ${this._formatError(error)}`);
                }
            }
        }

        if (this._registeredKeybindings) {
            for (const keybindingName of this._registeredKeybindings) {
                try {
                    Main.wm.removeKeybinding(keybindingName);
                    this._debugLog(`cleanup: keybinding removed: ${keybindingName}`);
                } catch (error) {
                    this._warningLog(`cleanup: failed to remove keybinding ${keybindingName}: ${this._formatError(error)}`);
                }
            }
        }

        this._pendingTimeoutIds = [];
        this._registeredKeybindings = [];
        this._centerCycleIndex = UNKNOWN_CYCLE_INDEX;
        this._presetPopupDialog = null;
        this._savePresetDialog = null;
        this._deletePresetDialog = null;
        this._lastPopupWindow = null;
        this._presetFeedbackOverlay = null;
        this._presetFeedbackTitleLabel = null;
        this._presetFeedbackSizeLabel = null;
        this._presetFeedbackTimeoutId = 0;
        this._debugLogging = true;
        this._settings = null;
    }

    _openPresetPopup() {
        this._debugLog('popup: open requested');
        const window = global.display.get_focus_window();

        if (!this._isNormalWindow(window)) {
            this._debugLog(window ? 'popup: ignored non-normal window' : 'popup: no focused window');
            return;
        }

        this._showPresetPopupForWindow(window, 'open');
    }

    _showPresetPopupForWindow(window, reason) {
        if (!this._isNormalWindow(window)) {
            this._debugLog(`popup: cannot show popup because target window is invalid (${reason})`);
            return;
        }

        try {
            this._closePresetPopupDialog(reason);
            this._closeSavePresetDialog(reason);
            this._closeDeletePresetDialog(reason);
            const context = this._getWindowContext(window);
            this._lastPopupWindow = window;
            this._debugLog(`popup: context monitor=${context.monitorIndex}, workarea=${context.workArea.x},${context.workArea.y} ${context.workArea.width}x${context.workArea.height}, frame=${context.frameRect.x},${context.frameRect.y} ${context.frameRect.width}x${context.frameRect.height}`);
            this._presetPopupDialog = new PresetPopupDialog(this, window, context);
            this._presetPopupDialog.open();
        } catch (error) {
            this._criticalLog(`popup: failed to open preset popup: ${this._formatError(error)}`);
            this._presetPopupDialog = null;
        }
    }

    _reopenPresetPopupAfterDialogDecision(dialogName, reason) {
        this._scheduleTimeout(POPUP_REOPEN_DELAY_MS, () => {
            const window = this._isNormalWindow(this._lastPopupWindow) ? this._lastPopupWindow : global.display.get_focus_window();

            if (!this._isNormalWindow(window)) {
                this._debugLog(`popup: ${dialogName} ${reason} refresh skipped because no normal target window exists`);
                return;
            }

            this._debugLog(`popup: reopening after saved preset ${dialogName} ${reason}`);
            this._showPresetPopupForWindow(window, `${dialogName}-${reason}-refresh`);
        });
    }

    _closePresetPopupDialog(reason) {
        const dialog = this._presetPopupDialog;
        this._presetPopupDialog = null;
        if (!dialog)
            return;

        try {
            dialog.close();
            this._debugLog(`popup: closed previous dialog (${reason})`);
        } catch (error) {
            this._debugLog(`popup: previous dialog already closed/disposed (${reason})`);
        }
    }

    _openSavePresetDialog() {
        this._debugLog('custom-preset: save dialog requested');

        try {
            this._closeSavePresetDialog('replace');
            this._closeDeletePresetDialog('replace');
            const suggestedName = this._buildSuggestedCustomPresetName();
            this._savePresetDialog = new SavePresetDialog(this, suggestedName);
            this._savePresetDialog.open();
        } catch (error) {
            this._criticalLog(`custom-preset: failed to open save dialog: ${this._formatError(error)}`);
            this._savePresetDialog = null;
        }
    }

    _closeSavePresetDialog(reason) {
        const dialog = this._savePresetDialog;
        this._savePresetDialog = null;
        if (!dialog)
            return;

        try {
            dialog.close();
            this._debugLog(`custom-preset: closed previous save dialog (${reason})`);
        } catch (error) {
            this._debugLog(`custom-preset: previous save dialog already closed/disposed (${reason})`);
        }
    }

    _openDeletePresetDialog(preset) {
        const validPreset = this._validateCustomPreset(preset);

        if (!validPreset) {
            this._debugLog('custom-preset: delete dialog ignored because preset is invalid');
            return;
        }

        this._debugLog(`custom-preset: delete dialog requested id=${validPreset.id}, name=${validPreset.name}`);

        try {
            this._closePresetPopupDialog('delete-confirm');
            this._closeSavePresetDialog('delete-confirm');
            this._closeDeletePresetDialog('replace');
            this._deletePresetDialog = new DeletePresetDialog(this, validPreset);
            this._deletePresetDialog.open();
        } catch (error) {
            this._criticalLog(`custom-preset: failed to open delete dialog: ${this._formatError(error)}`);
            this._deletePresetDialog = null;
        }
    }

    _closeDeletePresetDialog(reason) {
        const dialog = this._deletePresetDialog;
        this._deletePresetDialog = null;
        if (!dialog)
            return;

        try {
            dialog.close();
            this._debugLog(`custom-preset: closed previous delete dialog (${reason})`);
        } catch (error) {
            this._debugLog(`custom-preset: previous delete dialog already closed/disposed (${reason})`);
        }
    }

    _deleteCustomPresetById(id, options = {}) {
        const targetId = String(id ?? '').trim();

        if (!targetId) {
            this._debugLog('custom-preset: delete ignored because preset id is empty');
            return false;
        }

        const presets = this._readCustomPresets();
        const targetPreset = presets.find(preset => preset.id === targetId);

        if (!targetPreset) {
            this._debugLog(`custom-preset: delete ignored because preset id was not found: ${targetId}`);
            return false;
        }

        const remainingPresets = presets.filter(preset => preset.id !== targetId);
        this._writeCustomPresets(remainingPresets);
        this._debugLog(`custom-preset: deleted preset id=${targetPreset.id}, name=${targetPreset.name}`);

        if (options.reopenPopup)
            this._reopenPresetPopupAfterDialogDecision('delete', 'confirm');

        return true;
    }

    _buildSuggestedCustomPresetName() {
        const now = GLib.DateTime.new_now_local();
        return `preset-${now.format('%Y%m%d-%H%M%S')}`;
    }

    _normalizeCustomPresetName(name) {
        return String(name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, CUSTOM_PRESET_NAME_MAX_LENGTH);
    }

    _validateCustomPresetName(name) {
        const raw = String(name ?? '');
        const withoutControlCharacters = raw.replace(/[\u0000-\u001f\u007f]/g, '');
        const normalized = withoutControlCharacters.trim().slice(0, CUSTOM_PRESET_NAME_MAX_LENGTH);

        if (!normalized) {
            if (raw.trim())
                return { ok: false, reason: 'preset name has no visible characters', message: 'Please use a visible preset name.' };

            return { ok: false, reason: 'preset name is empty', message: 'Please enter a preset name.' };
        }

        return { ok: true, name: normalized };
    }

    _readCustomPresets() {
        let rawJson = '';

        try {
            rawJson = this._settings?.get_string(CUSTOM_PRESETS_KEY) ?? '';
        } catch (error) {
            this._criticalLog(`custom-preset: failed to read ${CUSTOM_PRESETS_KEY}: ${this._formatError(error)}`);
            return [];
        }

        try {
            const parsed = JSON.parse(rawJson || '{"version":1,"presets":[]}');
            if (parsed?.version !== CUSTOM_PRESETS_VERSION || !Array.isArray(parsed.presets))
                return [];

            return parsed.presets.map(preset => this._validateCustomPreset(preset)).filter(preset => preset !== null);
        } catch (error) {
            this._criticalLog(`custom-preset: failed to parse ${CUSTOM_PRESETS_KEY}: ${this._formatError(error)}`);
            return [];
        }
    }

    _writeCustomPresets(presets) {
        try {
            this._settings?.set_string(CUSTOM_PRESETS_KEY, JSON.stringify({ version: CUSTOM_PRESETS_VERSION, presets }));
        } catch (error) {
            this._criticalLog(`custom-preset: failed to write ${CUSTOM_PRESETS_KEY}: ${this._formatError(error)}`);
        }
    }

    _validateCustomPreset(preset) {
        if (!preset || typeof preset !== 'object')
            return null;

        const id = String(preset.id ?? '').trim();
        const name = this._normalizeCustomPresetName(preset.name ?? preset.label ?? '');
        const kind = String(preset.kind ?? '').trim();
        const x = Number.parseInt(preset.x, 10);
        const y = Number.parseInt(preset.y, 10);
        const width = Number.parseInt(preset.width, 10);
        const height = Number.parseInt(preset.height, 10);
        const legacyWorkareaWidth = Number.parseInt(preset.workareaWidth, 10);
        const legacyWorkareaHeight = Number.parseInt(preset.workareaHeight, 10);
        const originMonitorIndex = Number.parseInt(preset.originMonitorIndex, 10);
        const originDisplayNumber = Number.parseInt(preset.originDisplayNumber, 10);
        const originWorkareaX = Number.parseInt(preset.originWorkareaX, 10);
        const originWorkareaY = Number.parseInt(preset.originWorkareaY, 10);
        const originWorkareaWidth = Number.parseInt(preset.originWorkareaWidth, 10);
        const originWorkareaHeight = Number.parseInt(preset.originWorkareaHeight, 10);
        const createdAt = Number.parseInt(preset.createdAt, 10) || 0;

        if (!id || !name || kind !== CUSTOM_PRESET_KIND)
            return null;

        if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0)
            return null;

        const resolvedOriginWidth = Number.isFinite(originWorkareaWidth) && originWorkareaWidth > 0
            ? originWorkareaWidth
            : (Number.isFinite(legacyWorkareaWidth) && legacyWorkareaWidth > 0 ? legacyWorkareaWidth : width);
        const resolvedOriginHeight = Number.isFinite(originWorkareaHeight) && originWorkareaHeight > 0
            ? originWorkareaHeight
            : (Number.isFinite(legacyWorkareaHeight) && legacyWorkareaHeight > 0 ? legacyWorkareaHeight : height);

        return {
            id,
            name,
            kind,
            x,
            y,
            width,
            height,
            originMonitorIndex: Number.isFinite(originMonitorIndex) && originMonitorIndex >= 0 ? originMonitorIndex : UNKNOWN_MONITOR_INDEX,
            originDisplayNumber: Number.isFinite(originDisplayNumber) && originDisplayNumber > 0 ? originDisplayNumber : null,
            originDisplayLabel: this._normalizeDisplayLabel(preset.originDisplayLabel ?? ''),
            originWorkareaX: Number.isFinite(originWorkareaX) ? originWorkareaX : 0,
            originWorkareaY: Number.isFinite(originWorkareaY) ? originWorkareaY : 0,
            originWorkareaWidth: resolvedOriginWidth,
            originWorkareaHeight: resolvedOriginHeight,
            originOrientation: this._normalizeOrientation(preset.originOrientation, resolvedOriginWidth, resolvedOriginHeight),
            createdAt,
        };
    }

    _saveFocusedWindowGeometryAsCustomPreset(name) {
        const window = global.display.get_focus_window();

        if (!this._isNormalWindow(window)) {
            this._debugLog('custom-preset: save ignored because no normal focused window exists');
            return;
        }

        const context = this._getWindowContext(window);
        const preset = this._createCustomPresetFromContext(name, context);
        const presets = this._readCustomPresets();
        presets.push(preset);
        this._writeCustomPresets(presets);
        this._debugLog(`custom-preset: saved preset id=${preset.id}, name=${preset.name}, display=${preset.originDisplayNumber}, geometry=${preset.x},${preset.y} ${preset.width}x${preset.height}`);
    }

    _createCustomPresetFromContext(name, context) {
        const { monitorIndex, workArea, frameRect } = context;
        const nowSeconds = Math.floor(Date.now() / 1000);
        const displayInfo = this._getDisplayInfoForMonitor(monitorIndex);
        const visibleRect = this._intersectGeometryWithWorkArea(frameRect, workArea);

        return {
            id: `custom-${nowSeconds}-${Math.floor(Math.random() * 100000)}`,
            name,
            kind: CUSTOM_PRESET_KIND,
            x: visibleRect.x - workArea.x,
            y: visibleRect.y - workArea.y,
            width: visibleRect.width,
            height: visibleRect.height,
            originMonitorIndex: monitorIndex,
            originDisplayNumber: displayInfo.displayNumber,
            originDisplayLabel: displayInfo.label,
            originWorkareaX: workArea.x,
            originWorkareaY: workArea.y,
            originWorkareaWidth: workArea.width,
            originWorkareaHeight: workArea.height,
            originOrientation: this._getOrientation(workArea.width, workArea.height),
            createdAt: nowSeconds,
        };
    }

    _applyCustomPresetToFocusedWindow(preset) {
        const validPreset = this._validateCustomPreset(preset);
        if (!validPreset) {
            this._debugLog('custom-preset: apply ignored because preset is invalid');
            return;
        }

        this._debugLog(`custom-preset: applying preset id=${validPreset.id}, name=${validPreset.name}`);
        const window = global.display.get_focus_window();

        if (!this._isNormalWindow(window)) {
            this._debugLog('custom-preset: apply ignored because no normal focused window exists');
            return;
        }

        const targetContext = this._resolveCustomPresetTargetContext(window, validPreset);
        const currentContext = this._getWindowContext(window);

        if (this._isEffectivelyFullWorkarea(window, currentContext.workArea, currentContext.frameRect)) {
            this._breakOutFromFullWorkareaForCustomPreset(window, validPreset, targetContext);
            return;
        }

        this._applyCustomPresetToWindow(window, validPreset, targetContext, 'direct');
    }

    _breakOutFromFullWorkareaForCustomPreset(window, preset, targetContext) {
        this._debugLog(`custom-preset: full-workarea state detected; breaking out before preset ${preset.name}: targetMonitor=${targetContext.monitorIndex}`);

        try {
            this._unmakeFullscreenBestEffort(window);
            this._unmaximizeBestEffort(window);
            this._moveToMonitorBestEffort(window, targetContext.monitorIndex);
            const safeRect = this._calculateSafeRestoreGeometry(targetContext.workArea);
            window.move_frame(true, safeRect.x, safeRect.y);
            window.move_resize_frame(true, safeRect.x, safeRect.y, safeRect.width, safeRect.height);
        } catch (error) {
            this._warningLog(`custom-preset: safe restore failed before preset ${preset.name}: ${this._formatError(error)}`);
        }

        this._scheduleTimeout(POST_UNMAXIMIZE_RESIZE_DELAY_MS, () => {
            const refreshedTargetContext = this._resolveCustomPresetTargetContext(window, preset);
            this._applyCustomPresetToWindow(window, preset, refreshedTargetContext, 'after-full-workarea-breakout');
        });
    }

    _applyCustomPresetToWindow(window, preset, targetContext, reason) {
        const target = this._calculateCustomPresetGeometry(preset, targetContext.workArea);
        const currentContext = this._getWindowContext(window);
        this._debugLog(`custom-preset: geometry context (${reason}): currentMonitor=${currentContext.monitorIndex}, targetMonitor=${targetContext.monitorIndex}, originAvailable=${targetContext.originAvailable}, targetWorkarea=${targetContext.workArea.x},${targetContext.workArea.y} ${targetContext.workArea.width}x${targetContext.workArea.height}, frame=${currentContext.frameRect.x},${currentContext.frameRect.y} ${currentContext.frameRect.width}x${currentContext.frameRect.height}`);

        if (!this._isUsableGeometry(target)) {
            this._warningLog(`custom-preset: invalid target geometry for ${preset.name}: ${target.x},${target.y} ${target.width}x${target.height}`);
            return;
        }

        try {
            this._moveToMonitorBestEffort(window, targetContext.monitorIndex);
            window.move_frame(true, target.x, target.y);
            window.move_resize_frame(true, target.x, target.y, target.width, target.height);
            this._debugLog(`custom-preset: applied preset ${preset.name}: ${target.x},${target.y} ${target.width}x${target.height}`);
        } catch (error) {
            this._criticalLog(`custom-preset: move_resize_frame failed for ${preset.name}: ${this._formatError(error)}`);
        }
    }

    _resolveCustomPresetTargetContext(window, preset) {
        const currentContext = this._getWindowContext(window);
        const displayInfos = this._getDisplayInfos();

        if (displayInfos.length <= 1)
            return { monitorIndex: currentContext.monitorIndex, workArea: currentContext.workArea, originAvailable: true, reason: 'single-logical-display' };

        const originByIndex = displayInfos.find(display => display.monitorIndex === preset.originMonitorIndex);
        if (originByIndex)
            return { monitorIndex: originByIndex.monitorIndex, workArea: originByIndex.workArea, originAvailable: true, reason: 'origin-monitor-index' };

        const originByShape = displayInfos.find(display =>
            display.workArea.width === preset.originWorkareaWidth &&
            display.workArea.height === preset.originWorkareaHeight &&
            display.orientation === preset.originOrientation
        );

        if (originByShape)
            return { monitorIndex: originByShape.monitorIndex, workArea: originByShape.workArea, originAvailable: true, reason: 'origin-workarea-shape' };

        return { monitorIndex: currentContext.monitorIndex, workArea: currentContext.workArea, originAvailable: false, reason: 'origin-unavailable-fallback-current' };
    }

    _calculateCustomPresetGeometry(preset, workArea) {
        const targetWidth = Math.min(preset.width, workArea.width);
        const targetHeight = Math.min(preset.height, workArea.height);
        const originRangeX = Math.max(1, preset.originWorkareaWidth - preset.width);
        const originRangeY = Math.max(1, preset.originWorkareaHeight - preset.height);
        const targetRangeX = Math.max(0, workArea.width - targetWidth);
        const targetRangeY = Math.max(0, workArea.height - targetHeight);
        const xRatio = this._clampNumber(preset.x / originRangeX, 0, 1);
        const yRatio = this._clampNumber(preset.y / originRangeY, 0, 1);

        return this._clampGeometryToWorkArea({
            x: workArea.x + Math.round(targetRangeX * xRatio),
            y: workArea.y + Math.round(targetRangeY * yRatio),
            width: targetWidth,
            height: targetHeight,
        }, workArea);
    }

    _formatCustomPresetButtonLabel(preset) {
        const displayInfos = this._getDisplayInfos();

        if (displayInfos.length <= 1)
            return `${preset.name} — Current Display · ${preset.width}x${preset.height}`;

        const origin = this._resolveDisplayInfoForPreset(preset, displayInfos);
        const unavailable = origin.available ? '' : ' · unavailable';
        return `${preset.name} — ${origin.displayNumber}. ${origin.label} · ${this._formatOrientation(origin.orientation)}${unavailable} · ${preset.width}x${preset.height}`;
    }

    _resolveDisplayInfoForPreset(preset, displayInfos) {
        const byIndex = displayInfos.find(display => display.monitorIndex === preset.originMonitorIndex);
        if (byIndex)
            return { ...byIndex, available: true };

        const byShape = displayInfos.find(display =>
            display.workArea.width === preset.originWorkareaWidth &&
            display.workArea.height === preset.originWorkareaHeight &&
            display.orientation === preset.originOrientation
        );
        if (byShape)
            return { ...byShape, available: true };

        return {
            displayNumber: preset.originDisplayNumber ?? (preset.originMonitorIndex >= 0 ? preset.originMonitorIndex + 1 : 1),
            label: preset.originDisplayLabel || `Display ${preset.originMonitorIndex >= 0 ? preset.originMonitorIndex + 1 : '?'}`,
            orientation: preset.originOrientation,
            workArea: { width: preset.originWorkareaWidth, height: preset.originWorkareaHeight },
            monitorIndex: preset.originMonitorIndex,
            available: false,
        };
    }

    _getCurrentPresetLabel(context) {
        const orderedPresetNames = [
            PRESETS.LEFT,
            PRESETS.RIGHT,
            PRESETS.FULL,
            PRESETS.CENTER_COMPACT,
            PRESETS.CENTER,
            PRESETS.CENTER_LARGE,
        ];

        for (const presetName of orderedPresetNames) {
            const target = this._calculatePresetGeometry(presetName, context.workArea);
            if (target && this._isFrameNearlySameGeometry(context.frameRect, target))
                return PRESET_DEFINITIONS[presetName]?.label ?? presetName;
        }

        return 'Custom / Manual size';
    }

    _getDisplayInfos() {
        const workspace = global.workspace_manager.get_active_workspace();
        const monitors = Main.layoutManager?.monitors ?? [];
        const count = monitors.length || global.display.get_n_monitors?.() || 1;
        const infos = [];

        for (let monitorIndex = 0; monitorIndex < count; monitorIndex++) {
            try {
                const workArea = workspace.get_work_area_for_monitor(monitorIndex);
                const monitor = monitors[monitorIndex] ?? {};
                const label = this._extractMonitorLabel(monitor, monitorIndex);
                infos.push({ monitorIndex, displayNumber: monitorIndex + 1, label, workArea, orientation: this._getOrientation(workArea.width, workArea.height) });
            } catch (error) {
                this._debugLog(`display: failed to inspect monitor ${monitorIndex}: ${this._formatError(error)}`);
            }
        }

        return infos.length ? infos : [{
            monitorIndex: 0,
            displayNumber: 1,
            label: 'Display 1',
            workArea: workspace.get_work_area_for_monitor(0),
            orientation: 'landscape',
        }];
    }

    _getDisplayInfoForMonitor(monitorIndex) {
        return this._getDisplayInfos().find(display => display.monitorIndex === monitorIndex) ?? {
            monitorIndex,
            displayNumber: monitorIndex + 1,
            label: `Display ${monitorIndex + 1}`,
            workArea: { width: 1, height: 1 },
            orientation: 'landscape',
        };
    }

    _extractMonitorLabel(monitor, monitorIndex) {
        const candidates = [monitor?.displayName, monitor?.display_name, monitor?.name, monitor?.product, monitor?.vendor, monitor?.connector];

        for (const candidate of candidates) {
            const label = this._normalizeDisplayLabel(candidate ?? '');
            if (label)
                return label;
        }

        return `Display ${monitorIndex + 1}`;
    }

    _normalizeDisplayLabel(label) {
        return String(label ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
    }

    _normalizeOrientation(orientation, width, height) {
        const value = String(orientation ?? '').toLowerCase();
        if (value === 'portrait' || value === 'landscape')
            return value;

        return this._getOrientation(width, height);
    }

    _getOrientation(width, height) {
        return height > width ? 'portrait' : 'landscape';
    }

    _formatOrientation(orientation) {
        return orientation === 'portrait' ? 'Portrait' : 'Landscape';
    }

    _intersectGeometryWithWorkArea(geometry, workArea) {
        const x1 = Math.max(geometry.x, workArea.x);
        const y1 = Math.max(geometry.y, workArea.y);
        const x2 = Math.min(geometry.x + geometry.width, workArea.x + workArea.width);
        const y2 = Math.min(geometry.y + geometry.height, workArea.y + workArea.height);

        if (x2 <= x1 || y2 <= y1)
            return this._calculateSafeRestoreGeometry(workArea);

        return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    }

    _clampNumber(value, min, max) {
        if (!Number.isFinite(value))
            return min;

        return Math.max(min, Math.min(value, max));
    }

    _cycleCenterPreset(direction) {
        if (!CENTER_CYCLE_PRESETS.length) {
            this._debugLog('action: center cycle ignored because preset list is empty');
            return;
        }

        const currentIndex = this._resolveCenterCycleIndex();
        const nextIndex = this._wrapCycleIndex(currentIndex + direction, CENTER_CYCLE_PRESETS.length);
        const nextPreset = CENTER_CYCLE_PRESETS[nextIndex];
        this._centerCycleIndex = nextIndex;
        this._debugLog(`action: center cycle ${direction > 0 ? 'next' : 'previous'}: index=${nextIndex}, preset=${nextPreset}`);
        this._applyPresetToFocusedWindow(nextPreset);
    }

    _resolveCenterCycleIndex() {
        const inferredIndex = this._inferCenterCycleIndexFromFocusedWindow();
        if (inferredIndex !== UNKNOWN_CYCLE_INDEX)
            return inferredIndex;
        if (this._isValidCenterCycleIndex(this._centerCycleIndex))
            return this._centerCycleIndex;
        return this._wrapCycleIndex(UNKNOWN_CYCLE_INDEX, CENTER_CYCLE_PRESETS.length);
    }

    _inferCenterCycleIndexFromFocusedWindow() {
        const window = global.display.get_focus_window();
        if (!this._isNormalWindow(window))
            return UNKNOWN_CYCLE_INDEX;

        try {
            const context = this._getWindowContext(window);
            const frameRect = window.get_frame_rect();

            for (let index = 0; index < CENTER_CYCLE_PRESETS.length; index++) {
                const presetName = CENTER_CYCLE_PRESETS[index];
                const target = this._calculatePresetGeometry(presetName, context.workArea);
                if (target && this._isNearlySameFrame(frameRect, target)) {
                    this._debugLog(`action: inferred center cycle index=${index}, preset=${presetName}`);
                    return index;
                }
            }
        } catch (error) {
            this._warningLog(`action: failed to infer center cycle index: ${this._formatError(error)}`);
        }

        return UNKNOWN_CYCLE_INDEX;
    }

    _wrapCycleIndex(index, length) {
        return ((index % length) + length) % length;
    }

    _isValidCenterCycleIndex(index) {
        return Number.isInteger(index) && index >= 0 && index < CENTER_CYCLE_PRESETS.length;
    }

    _rememberCenterCyclePreset(presetName) {
        const index = CENTER_CYCLE_PRESETS.indexOf(presetName);
        if (index === -1)
            return;
        this._centerCycleIndex = index;
        this._debugLog(`action: remembered center cycle index=${index}, preset=${presetName}`);
    }

    _applyPresetToFocusedWindow(presetName) {
        this._debugLog(`action: preset triggered: ${presetName}`);
        const window = global.display.get_focus_window();

        if (!this._isNormalWindow(window)) {
            this._debugLog(window ? 'action: ignored non-normal window' : 'action: no focused window');
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
        this._debugLog(`action: full-workarea state detected; breaking out before preset ${presetName}: monitor=${context.monitorIndex}, workarea=${context.workArea.x},${context.workArea.y} ${context.workArea.width}x${context.workArea.height}, frame=${context.frameRect.x},${context.frameRect.y} ${context.frameRect.width}x${context.frameRect.height}`);

        try {
            this._unmakeFullscreenBestEffort(window);
            this._unmaximizeBestEffort(window);
            this._moveToMonitorBestEffort(window, context.monitorIndex);
            const safeRect = this._calculateSafeRestoreGeometry(context.workArea);
            window.move_frame(true, safeRect.x, safeRect.y);
            window.move_resize_frame(true, safeRect.x, safeRect.y, safeRect.width, safeRect.height);
            this._debugLog(`action: applied safe restore before preset ${presetName}: ${safeRect.x},${safeRect.y} ${safeRect.width}x${safeRect.height}`);
        } catch (error) {
            this._warningLog(`action: safe restore failed before preset ${presetName}: ${this._formatError(error)}`);
        }

        this._scheduleTimeout(POST_UNMAXIMIZE_RESIZE_DELAY_MS, () => {
            this._applyPresetToWindow(window, presetName, 'after-full-workarea-breakout');
        });
    }

    _applyPresetToWindow(window, presetName, reason) {
        const context = this._getWindowContext(window);
        const target = this._calculatePresetGeometry(presetName, context.workArea);
        this._debugLog(`action: geometry context (${reason}): monitor=${context.monitorIndex}, workarea=${context.workArea.x},${context.workArea.y} ${context.workArea.width}x${context.workArea.height}, frame=${context.frameRect.x},${context.frameRect.y} ${context.frameRect.width}x${context.frameRect.height}`);

        if (!target) {
            this._debugLog(`action: unknown preset: ${presetName}`);
            return;
        }

        if (!this._isUsableGeometry(target)) {
            this._warningLog(`action: invalid target geometry for ${presetName}: ${target.x},${target.y} ${target.width}x${target.height}`);
            return;
        }

        try {
            this._moveToMonitorBestEffort(window, context.monitorIndex);
            window.move_frame(true, target.x, target.y);
            window.move_resize_frame(true, target.x, target.y, target.width, target.height);
            this._rememberCenterCyclePreset(presetName);
            this._debugLog(`action: applied preset ${presetName}: ${target.x},${target.y} ${target.width}x${target.height}`);
            this._showPresetFeedbackOverlay(presetName, target, context.workArea);
            this._schedulePostResizeCorrection(window, presetName, context.workArea, target);
        } catch (error) {
            this._criticalLog(`action: move_resize_frame failed for ${presetName}: ${this._formatError(error)}`);
        }
    }

    _getWindowContext(window) {
        const monitorIndex = window.get_monitor();
        const workspace = global.workspace_manager.get_active_workspace();
        const workArea = workspace.get_work_area_for_monitor(monitorIndex);
        const frameRect = window.get_frame_rect();
        return { monitorIndex, workspace, workArea, frameRect };
    }

    _showPresetFeedbackOverlay(presetName, target, workArea) {
        const definition = PRESET_DEFINITIONS[presetName];
        if (!definition || !target)
            return;

        const overlay = this._ensurePresetFeedbackOverlay();
        if (!overlay)
            return;

        this._presetFeedbackTitleLabel.set_text(definition.label ?? presetName);
        this._presetFeedbackSizeLabel.set_text(`${target.width} × ${target.height}`);
        this._positionPresetFeedbackOverlay(overlay, workArea);
        overlay.opacity = 255;
        overlay.show();
        this._resetPresetFeedbackTimeout();
    }

    _ensurePresetFeedbackOverlay() {
        if (this._presetFeedbackOverlay)
            return this._presetFeedbackOverlay;

        try {
            const overlay = new St.BoxLayout({
                vertical: true,
                style: 'spacing: 2px; min-width: 220px; padding: 12px 18px; border-radius: 12px; background-color: rgba(0,0,0,0.72); color: white; text-align: center;',
            });
            this._presetFeedbackTitleLabel = new St.Label({
                text: '',
                x_align: Clutter.ActorAlign.CENTER,
                style: 'font-size: 18px; font-weight: bold; text-align: center;',
            });
            this._presetFeedbackSizeLabel = new St.Label({
                text: '',
                x_align: Clutter.ActorAlign.CENTER,
                style: 'font-size: 14px; text-align: center;',
            });
            overlay.add_child(this._presetFeedbackTitleLabel);
            overlay.add_child(this._presetFeedbackSizeLabel);
            overlay.hide();
            Main.uiGroup.add_child(overlay);
            this._presetFeedbackOverlay = overlay;
            return overlay;
        } catch (error) {
            this._warningLog(`feedback: failed to create preset overlay: ${this._formatError(error)}`);
            this._presetFeedbackOverlay = null;
            this._presetFeedbackTitleLabel = null;
            this._presetFeedbackSizeLabel = null;
            return null;
        }
    }

    _positionPresetFeedbackOverlay(overlay, workArea) {
        try {
            const area = workArea ?? Main.layoutManager?.primaryMonitor ?? { x: 0, y: 0, width: global.stage.width, height: global.stage.height };
            const [, naturalWidth] = overlay.get_preferred_width(-1);
            const [, naturalHeight] = overlay.get_preferred_height(-1);
            const width = Math.max(220, naturalWidth);
            const height = Math.max(56, naturalHeight);
            const x = area.x + Math.floor((area.width - width) / 2);
            const y = area.y + Math.floor((area.height - height) * 0.22);
            overlay.set_position(x, y);
        } catch (error) {
            this._debugLog(`feedback: failed to position preset overlay: ${this._formatError(error)}`);
        }
    }

    _resetPresetFeedbackTimeout() {
        this._clearPresetFeedbackTimeout();
        const sourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, PRESET_FEEDBACK_OVERLAY_DURATION_MS, () => {
            this._pendingTimeoutIds = this._pendingTimeoutIds.filter(id => id !== sourceId);
            this._presetFeedbackTimeoutId = 0;
            this._presetFeedbackOverlay?.hide();
            return GLib.SOURCE_REMOVE;
        });

        this._presetFeedbackTimeoutId = sourceId;
        this._pendingTimeoutIds.push(sourceId);
    }

    _clearPresetFeedbackTimeout() {
        if (!this._presetFeedbackTimeoutId)
            return;

        try {
            GLib.source_remove(this._presetFeedbackTimeoutId);
        } catch (error) {
            this._debugLog(`feedback: failed to remove overlay timeout: ${this._formatError(error)}`);
        }

        this._pendingTimeoutIds = this._pendingTimeoutIds.filter(id => id !== this._presetFeedbackTimeoutId);
        this._presetFeedbackTimeoutId = 0;
    }

    _destroyPresetFeedbackOverlay(reason) {
        this._clearPresetFeedbackTimeout();

        if (!this._presetFeedbackOverlay)
            return;

        try {
            this._presetFeedbackOverlay.destroy();
            this._debugLog(`feedback: destroyed preset overlay (${reason})`);
        } catch (error) {
            this._debugLog(`feedback: preset overlay already destroyed/disposed (${reason})`);
        }

        this._presetFeedbackOverlay = null;
        this._presetFeedbackTitleLabel = null;
        this._presetFeedbackSizeLabel = null;
    }

    _schedulePostResizeCorrection(window, presetName, workArea, target) {
        if (![PRESETS.LEFT, PRESETS.RIGHT, PRESETS.CENTER, PRESETS.CENTER_COMPACT, PRESETS.CENTER_LARGE].includes(presetName))
            return;

        this._scheduleTimeout(POST_RESIZE_CORRECTION_DELAY_MS, () => {
            this._postResizeCorrection(window, presetName, workArea, target, 1);
        });
    }

    _scheduleTimeout(delayMs, callback) {
        const sourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delayMs, () => {
            this._pendingTimeoutIds = this._pendingTimeoutIds.filter(id => id !== sourceId);
            callback();
            return GLib.SOURCE_REMOVE;
        });

        this._pendingTimeoutIds.push(sourceId);
        return sourceId;
    }

    _postResizeCorrection(window, presetName, workArea, requestedTarget, attempt) {
        try {
            const actualFrame = window.get_frame_rect();

            if (this._isFrameNearlyEqualToWorkArea(actualFrame, workArea) && !this._isFrameNearlySameGeometry(actualFrame, requestedTarget)) {
                this._debugLog(`action: resize rejected for ${presetName}; retrying requested target (attempt=${attempt}): actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}, requested=${requestedTarget.x},${requestedTarget.y} ${requestedTarget.width}x${requestedTarget.height}`);

                if (attempt <= 2) {
                    window.move_frame(true, requestedTarget.x, requestedTarget.y);
                    window.move_resize_frame(true, requestedTarget.x, requestedTarget.y, requestedTarget.width, requestedTarget.height);
                    this._scheduleTimeout(POST_RESIZE_CORRECTION_DELAY_MS, () => {
                        this._postResizeCorrection(window, presetName, workArea, requestedTarget, attempt + 1);
                    });
                }
                return;
            }

            const correctedTarget = this._calculateCorrectionGeometry(presetName, workArea, requestedTarget, actualFrame);
            if (!correctedTarget || !this._isUsableGeometry(correctedTarget))
                return;

            if (this._isNearlySameFrame(actualFrame, correctedTarget)) {
                this._debugLog(`action: post-correction not needed for ${presetName}: actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}`);
                return;
            }

            window.move_frame(true, correctedTarget.x, correctedTarget.y);
            window.move_resize_frame(true, correctedTarget.x, correctedTarget.y, correctedTarget.width, correctedTarget.height);
            this._debugLog(`action: post-corrected preset ${presetName}: actual=${actualFrame.x},${actualFrame.y} ${actualFrame.width}x${actualFrame.height}, corrected=${correctedTarget.x},${correctedTarget.y} ${correctedTarget.width}x${correctedTarget.height}`);
        } catch (error) {
            this._warningLog(`action: post-correction failed for ${presetName}: ${this._formatError(error)}`);
        }
    }

    _calculateCorrectionGeometry(presetName, workArea, requestedTarget, actualFrame) {
        const definition = PRESET_DEFINITIONS[presetName];

        switch (definition?.type) {
        case PRESET_TYPES.LEFT_HALF:
            return this._clampGeometryToWorkArea({ x: workArea.x, y: workArea.y, width: actualFrame.width, height: actualFrame.height }, workArea);
        case PRESET_TYPES.RIGHT_HALF:
            return this._clampGeometryToWorkArea({ x: workArea.x + workArea.width - actualFrame.width, y: workArea.y, width: actualFrame.width, height: actualFrame.height }, workArea);
        case PRESET_TYPES.CUSTOM_CENTER:
        case PRESET_TYPES.FIXED_CENTER:
            return this._clampGeometryToWorkArea({ x: workArea.x + Math.floor((workArea.width - actualFrame.width) / 2), y: workArea.y + Math.floor((workArea.height - actualFrame.height) / 2), width: actualFrame.width, height: actualFrame.height }, workArea);
        default:
            return requestedTarget;
        }
    }

    _calculatePresetGeometry(presetName, workArea) {
        const definition = PRESET_DEFINITIONS[presetName];
        if (!definition)
            return null;

        const halfWidth = Math.floor(workArea.width / 2);

        switch (definition.type) {
        case PRESET_TYPES.LEFT_HALF:
            return this._clampGeometryToWorkArea({ x: workArea.x, y: workArea.y, width: halfWidth, height: workArea.height }, workArea);
        case PRESET_TYPES.RIGHT_HALF:
            return this._clampGeometryToWorkArea({ x: workArea.x + halfWidth, y: workArea.y, width: workArea.width - halfWidth, height: workArea.height }, workArea);
        case PRESET_TYPES.FULL_WORKAREA:
            return this._clampGeometryToWorkArea({ x: workArea.x, y: workArea.y, width: workArea.width, height: workArea.height }, workArea);
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
        this._debugLog(`action: ${definition.id} preset size: configured=${centerSize.width}x${centerSize.height}, target=${targetWidth}x${targetHeight}`);
        return this._clampGeometryToWorkArea({ x: workArea.x + Math.floor((workArea.width - targetWidth) / 2), y: workArea.y + Math.floor((workArea.height - targetHeight) / 2), width: targetWidth, height: targetHeight }, workArea);
    }

    _calculateSafeRestoreGeometry(workArea) {
        const width = Math.max(1, Math.floor(workArea.width * 0.72));
        const height = Math.max(1, Math.floor(workArea.height * 0.72));
        return this._clampGeometryToWorkArea({ x: workArea.x + Math.floor((workArea.width - width) / 2), y: workArea.y + Math.floor((workArea.height - height) / 2), width, height }, workArea);
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

    _isNormalWindow(window) {
        return Boolean(window && window.window_type === Meta.WindowType.NORMAL);
    }

    _isUsableGeometry(geometry) {
        return Number.isFinite(geometry.x) && Number.isFinite(geometry.y) && Number.isFinite(geometry.width) && Number.isFinite(geometry.height) && geometry.width > 0 && geometry.height > 0;
    }

    _isNearlySameFrame(frameRect, target) {
        return Math.abs(frameRect.x - target.x) <= 1 && Math.abs(frameRect.y - target.y) <= 1 && Math.abs(frameRect.width - target.width) <= 1 && Math.abs(frameRect.height - target.height) <= 1;
    }

    _isFrameNearlySameGeometry(frameRect, geometry) {
        return Math.abs(frameRect.x - geometry.x) <= FULL_WORKAREA_TOLERANCE_PX && Math.abs(frameRect.y - geometry.y) <= FULL_WORKAREA_TOLERANCE_PX && Math.abs(frameRect.width - geometry.width) <= FULL_WORKAREA_TOLERANCE_PX && Math.abs(frameRect.height - geometry.height) <= FULL_WORKAREA_TOLERANCE_PX;
    }

    _isFrameNearlyEqualToWorkArea(frameRect, workArea) {
        return Math.abs(frameRect.x - workArea.x) <= FULL_WORKAREA_TOLERANCE_PX && Math.abs(frameRect.y - workArea.y) <= FULL_WORKAREA_TOLERANCE_PX && Math.abs(frameRect.width - workArea.width) <= FULL_WORKAREA_TOLERANCE_PX && Math.abs(frameRect.height - workArea.height) <= FULL_WORKAREA_TOLERANCE_PX;
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
            this._warningLog(`action: failed to check maximized state: ${this._formatError(error)}`);
            return false;
        }
    }

    _unmakeFullscreenBestEffort(window) {
        try {
            if (window.unmake_fullscreen)
                window.unmake_fullscreen();
        } catch (error) {
            this._warningLog(`action: unmake_fullscreen skipped/failed: ${this._formatError(error)}`);
        }
    }

    _unmaximizeBestEffort(window) {
        try {
            if (!window.unmaximize)
                return;
            if (window.unmaximize.length === 0)
                window.unmaximize();
            else if (window.get_maximized)
                window.unmaximize(window.get_maximized());
            else
                window.unmaximize(Meta.MaximizeFlags.BOTH);
        } catch (error) {
            this._warningLog(`action: unmaximize skipped/failed: ${this._formatError(error)}`);
        }
    }

    _moveToMonitorBestEffort(window, monitorIndex) {
        try {
            if (window.move_to_monitor)
                window.move_to_monitor(monitorIndex);
        } catch (error) {
            this._warningLog(`action: move_to_monitor skipped/failed: ${this._formatError(error)}`);
        }
    }

    _readCenterSize() {
        try {
            const width = this._settings?.get_int('center-width') ?? DEFAULT_CENTER_WIDTH;
            const height = this._settings?.get_int('center-height') ?? DEFAULT_CENTER_HEIGHT;
            return { width: Math.max(MIN_CENTER_SIZE, width), height: Math.max(MIN_CENTER_SIZE, height) };
        } catch (error) {
            this._criticalLog(`failed to read center size settings: ${this._formatError(error)}`);
            return { width: DEFAULT_CENTER_WIDTH, height: DEFAULT_CENTER_HEIGHT };
        }
    }

    _readDebugLogging() {
        try {
            return this._settings?.get_boolean('debug-logging') ?? true;
        } catch (error) {
            this._criticalLog(`failed to read debug-logging setting: ${this._formatError(error)}`);
            return true;
        }
    }

    _log(level, message) {
        const formatted = `${LOG_PREFIX}[${level}] ${message}`;

        if (level === LOG_LEVELS.CRITICAL)
            console.error(formatted);
        else
            console.log(formatted);
    }

    _normalLog(message) {
        this._log(LOG_LEVELS.NORMAL, message);
    }

    _warningLog(message) {
        this._log(LOG_LEVELS.WARNING, message);
    }

    _criticalLog(message) {
        this._log(LOG_LEVELS.CRITICAL, message);
    }

    _debugLog(message) {
        this._debugLogging = this._readDebugLogging();
        if (this._debugLogging)
            this._log(LOG_LEVELS.DEBUG, message);
    }

    _formatError(error) {
        if (!error)
            return 'unknown error';
        const message = error.message ? `${error.message}\n` : '';
        const stack = error.stack ?? String(error);
        return `${message}${stack}`;
    }
}
