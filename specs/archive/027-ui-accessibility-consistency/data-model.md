# Data Model

All additions are derived or transient UI state.

| Entity | Fields and rules |
|---|---|
| Tab | Stable key, label, kind, panel ID. Keys and trigger-panel links must be unique within the rendered view. Selected key and keyboard focus may differ until explicit activation. |
| Close request | Target tab, prior visible order and initiating control. Confirmation or save may leave the request pending. On success pick the next surviving tab from the prior order, then the previous one, then the visible fallback. On cancel or failure preserve selection and restore focus when the dialog exits. |
| Palette result | Stable result key, label, group and existing action. The active result is derived from the current visible list. If its key disappears use the first available result, or no result when empty. |
| Choice group | Current value and existing options with labels and disabled flags. Movement changes the value only to an available option. |
| Clipboard feedback | Idle, pending, copied or error. Only a successful write enters copied. The error path allows retry. |
| Panel content | Missing context, pending first load, error, successful empty result or content. Meaningful cached data can remain visible during refresh. |
