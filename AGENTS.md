# AGENTS.md

## Prioridad

Trabaja como desarrollador senior practico y eficiente. Haz cambios minimos, consistentes con la arquitectura actual y con bajo gasto de tokens.

## Regla inicial

Antes de editar, ejecuta `git status --short` y lee solo los documentos necesarios de `docs/ai`.

Para tareas no triviales, lee `docs/ai/00-project-map.md`.
Para cualquier cambio, aplica `docs/ai/01-workflow-rules.md`.

## Routing de contexto

- Crear o modificar formularios, campos, pantallas CRUD, botones, layout de formulario/listado: lee `docs/ai/06-form-ui-standards.md` y `docs/ai/07-reusable-components.md`.
- Tablas, listados, paginacion, total de registros, filtros, sort o acciones por fila: lee `docs/ai/11-list-ui-standards.md`, `docs/ai/07-reusable-components.md` y `docs/ai/03-core-data-api.md`.
- Modales, confirmaciones o popups: lee `docs/ai/07-reusable-components.md`.
- Inputs de divisa, hora, imagenes o mensajes de error: lee `docs/ai/07-reusable-components.md` y `docs/ai/06-form-ui-standards.md`.
- Rutas, guards, permisos, modulos Angular o wiring standalone/module: lee `docs/ai/02-frontend-angular.md`.
- API REST, `CrudG`, `httpResource`, auth, permisos o Firebase: lee `docs/ai/03-core-data-api.md`.
- Electron, IPC, config local, splash, impresion desktop o updates: lee `docs/ai/04-electron-desktop.md`.
- Facturacion, registros, recibos, cuadres, calendario, reportes, inventario, conduce o produccion: lee `docs/ai/05-business-modules.md`.
- Configuracion por cliente, logos, environments, build o packaging: lee `docs/ai/08-config-clients-build.md`.
- PDF, reportes, Excel, exportacion o impresion: lee `docs/ai/09-reports-printing-export.md`.
- Contratos con backend, DGII, dashboard, divisas o cuadres: lee `docs/ai/10-backend-contracts.md`.

## Reglas de implementacion

- No ejecutes lint, tests, typecheck, formatters, builds ni validaciones automaticas salvo peticion explicita.
- No instales ni actualices dependencias sin autorizacion.
- No uses `README.md` como fuente principal: esta desactualizado respecto al stack actual.
- No edites dependencias ni archivos generados salvo que sea imprescindible y lo expliques.
- Si tocas Electron, prefiere los `.ts` fuente y revisa si existen `.js` compilados relacionados antes de decidir.
- Respeta cambios locales ajenos. No reviertas trabajo no propio.
- Respuesta final: resumen corto y validaciones no ejecutadas.
