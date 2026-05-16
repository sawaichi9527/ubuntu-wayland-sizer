#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const extensionPath = path.join(repoRoot, 'extension', 'extension.js');
let source = fs.readFileSync(extensionPath, 'utf8');

function replaceOnce(before, after) {
  if (!source.includes(before)) {
    throw new Error(`Pattern not found: ${before.slice(0, 80)}`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  "const LOG_PREFIX = '[ubuntu-wayland-sizer]';\n",
  "const LOG_PREFIX = '[ubuntu-wayland-sizer]';\nconst LOG_LEVELS = Object.freeze({\n    NORMAL: 'NORMAL',\n    DEBUG: 'DEBUG',\n    WARNING: 'WARNING',\n    CRITICAL: 'CRITICAL',\n});\n"
);

replaceOnce(
  "        console.log(`${LOG_PREFIX} enable: start`);",
  "        this._normalLog('enable: start');"
);

replaceOnce(
  "            console.log(`${LOG_PREFIX} enabled`);",
  "            this._normalLog('enabled');"
);

replaceOnce(
  "            console.error(`${LOG_PREFIX} enable failed: ${this._formatError(error)}`);",
  "            this._criticalLog(`enable failed: ${this._formatError(error)}`);"
);

replaceOnce(
  "        console.log(`${LOG_PREFIX} disable: start`);",
  "        this._normalLog('disable: start');"
);

replaceOnce(
  "        console.log(`${LOG_PREFIX} disabled`);",
  "        this._normalLog('disabled');"
);

replaceOnce(
  "    _debugLog(message) {\n        this._debugLogging = this._readDebugLogging();\n        if (this._debugLogging)\n            console.log(`${LOG_PREFIX} ${message}`);\n    }",
  "    _log(level, message) {\n        const formatted = `${LOG_PREFIX}[${level}] ${message}`;\n\n        if (level === LOG_LEVELS.CRITICAL)\n            console.error(formatted);\n        else\n            console.log(formatted);\n    }\n\n    _normalLog(message) {\n        this._log(LOG_LEVELS.NORMAL, message);\n    }\n\n    _warningLog(message) {\n        this._log(LOG_LEVELS.WARNING, message);\n    }\n\n    _criticalLog(message) {\n        this._log(LOG_LEVELS.CRITICAL, message);\n    }\n\n    _debugLog(message) {\n        this._debugLogging = this._readDebugLogging();\n        if (this._debugLogging)\n            this._log(LOG_LEVELS.DEBUG, message);\n    }"
);

fs.writeFileSync(extensionPath, source);
console.log('Applied Phase 7.3c logging helper migration to extension/extension.js');
