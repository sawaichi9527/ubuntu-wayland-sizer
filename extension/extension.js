import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const LOG_PREFIX = '[ubuntu-wayland-sizer]';

export default class UbuntuWaylandSizerExtension extends Extension {
    enable() {
        console.log(`${LOG_PREFIX} enabled`);
    }

    disable() {
        console.log(`${LOG_PREFIX} disabled`);
    }
}
