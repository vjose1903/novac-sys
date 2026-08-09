# Reports Printing Export

## PDF y visor

- El proyecto usa `ngx-extended-pdf-viewer` configurado globalmente.
- Reportes y documentos pueden usar flujos Angular, pdfmake o endpoints backend segun modulo.
- Antes de cambiar PDF, rastrear desde boton/UI hasta generacion/descarga/impresion.

## Impresion desktop

- `electron/pdf-printer.ts` imprime PDFs base64.
- macOS usa `lp`; Windows usa `gsprint`/Ghostscript.
- El archivo valida base64/PDF y devuelve codigos de error estructurados.

## Exportacion Excel/CSV

- `electron/export-to-excel.ts` usa ExcelJS para generar archivos en Documents/NovacSystem.
- Listados tambien pueden tener acciones de exportacion desde `dinamic-table` o servicios del modulo.

## Reportes

- Modulo principal: `src/app/admin/reportes/`.
- Si el cambio toca datos del backend, revisar tambien `docs/ai/10-backend-contracts.md`.
- Si el cambio toca UI/listados, revisar `docs/ai/06-form-ui-standards.md` y `docs/ai/07-reusable-components.md`.
