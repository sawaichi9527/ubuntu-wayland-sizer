# Phase 7.3c Logging Implementation Plan

Implement unified logging helpers and runtime debug toggle.

Goals:
- NORMAL/DEBUG/WARNING/CRITICAL formatting
- runtime debug toggle
- reduce scattered console.log/console.error usage
- preserve lightweight journald behavior

Planned helpers:
- _log(level, message)
- _normalLog(message)
- _debugLog(message)
- _warningLog(message)
- _criticalLog(message)

Runtime popup control target:
- Log: Normal
- Log: Debug

No resize or geometry behavior changes.
