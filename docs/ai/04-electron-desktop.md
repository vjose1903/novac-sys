# Electron Desktop

## Entrada

- El proceso principal esta en `main.ts` en la raiz.
- Utilidades desktop estan en `electron/`.
- Si existen `.js` generados junto a `.ts`, prefiere modificar fuente `.ts` y entiende el flujo antes de tocar generados.

## Flujo principal

- `main.ts` crea splash, inicializa machine id, config local, Firebase config, posible base local Docker y ventana principal.
- Usa preload y canal compartido `DESKTOP_INVOKE_CHANNEL`.
- Maneja cierre con confirmacion y foco de ventana.

## IPC y comandos

- Nombres compartidos en `electron/shared-electron-angular.ts` y `src/electron/shared-electron-angular.ts`.
- Comandos relevantes: reload, abrir enlace externo, imprimir PDF base64, exportar CSV/XLSX, get/set config, confirmar cierre, foco de ventana, update check/download/state.

## Config local

- `electron/handler-config-file.ts` lee defaults, logos y `app_config.config`.
- `electron/firebase-config-handler.ts` lee config Firebase cifrada, `actual_cliente.json`, config general y config de maquina.

## Impresion y exportacion

- `electron/pdf-printer.ts` valida PDF base64, escribe archivo temporal e imprime con `lp` en macOS o `gsprint`/Ghostscript en Windows.
- `electron/export-to-excel.ts` usa ExcelJS y escribe en Documents/NovacSystem.
