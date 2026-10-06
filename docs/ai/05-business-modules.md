# Business Modules

## Admin layout

- Rutas principales en `src/app/admin/layout/layout.routing.ts`.
- Cada modulo funcional suele tener routing propio, componentes de pantalla y modelos/servicios relacionados.

## Registros

- Rutas en `src/app/admin/registros/registros.routing.ts`.
- Formularios representativos:
  - Clientes: `src/app/admin/registros/registro-clientes/`.
  - Suplidores: `src/app/admin/registros/registro-suplidores/`.
  - Articulos: `src/app/admin/registros/articulos/`.
  - Divisa: `src/app/admin/registros/divisa/`.
  - NCF: `src/app/admin/registros/ncf/`.
  - Roles: `src/app/admin/registros/roles/`.
- Para formularios nuevos, copiar patrones de estos modulos y aplicar `docs/ai/06-form-ui-standards.md`.

## Facturacion y ECF

- Modulos bajo `src/app/admin/facturacion/` y `src/app/admin/facturacion-electronica/`.
- Mantienen flujos sensibles de factura, cliente casual, pagos, reportes y contratos con backend.
- Antes de cambiar comportamiento, rastrear componente, modelo y servicio.

## Recibos, cuadres y reportes

- Recibos: `src/app/admin/recibos/`.
- Cuadres: `src/app/admin/cuadres/`, usa patrones mas nuevos con recursos.
- Reportes: `src/app/admin/reportes/`.
- Cambios de PDF, impresion o Excel tambien requieren `docs/ai/09-reports-printing-export.md`.

## Calendario, inventario, conduce y produccion

- Calendario: `src/app/admin/calendario/`.
- Inventario: `src/app/admin/inventario/`.
- Conduce: `src/app/admin/conduce/`.
- Produccion: `src/app/admin/produccion/`.
- Revisar rutas/componentes vecinos antes de agregar pantallas o acciones.
