# Project Map

## Stack actual

- Angular 21 con Electron 33.
- PrimeNG 21, Bootstrap 5, ngx-permissions, ngx-toastr, ngx-extended-pdf-viewer, Firebase/Firestore, ECharts/ngx-echarts, FullCalendar, ExcelJS y pdfmake.
- `README.md` esta desactualizado; no usarlo como fuente principal de arquitectura.

## Entradas principales

- Angular: `src/main.ts`, `src/app/app.config.ts`, `src/app/app.routing.ts`.
- Electron: `main.ts`.
- IPC compartido: `electron/shared-electron-angular.ts` y `src/electron/shared-electron-angular.ts`.
- Configuracion de entorno: `src/environments/`, `config_setup/`.

## Carpetas principales

- `src/app/admin/`: modulos funcionales del sistema.
- `src/app/core/`: servicios compartidos, componentes reutilizables, modelos, helpers y abstracciones de API.
- `src/app/login/`: autenticacion y configuracion inicial.
- `src/app/modules/`: modulos compartidos, incluido `PrimengModule`.
- `electron/`: utilidades desktop para config, Firebase, impresion, exportacion y actualizaciones.
- `config_setup/`: plantillas y assets por cliente para empaquetado/configuracion.
- `docs/`: documentacion del proyecto.

## Rutas funcionales

- `src/app/app.routing.ts` redirige a `auth/login`, carga `admin/layout/layout.module` y el modulo de login.
- `src/app/admin/layout/layout.routing.ts` define dashboard, factura, ecf, produccion, registros, manipular, recibos, inventario, conduce, reportes, cuadres y calendario.
- `src/app/admin/registros/registros.routing.ts` define clientes, suplidores, ncf, articulos, empleados, camiones, roles y divisa.

## Carpetas vacias o de baja senal

- `src/app/admin/contabilidad` esta vacia.
- `src/app/admin/reportes/diseños` esta vacia.

## Regla de exploracion

Para una tarea, ubica primero la ruta o modulo activo, luego inspecciona los componentes vecinos que ya resuelven un caso parecido. Evita analizar todo el repositorio salvo que la tarea lo pida.
