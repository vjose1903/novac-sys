# Backend Contracts

## Regla principal

No cambiar nombres de campos, parametros, endpoints ni forma de respuesta sin rastrear consumidores y productores. El frontend depende de contratos REST existentes.

## REST

- Abstraccion principal: `src/app/core/typescript/crud-g.ts`.
- Forma frecuente de respuesta: `{ data, msg, total_paginas, total_registros }`.
- Muchos modelos definen `base`, endpoints o metodos especificos. Revisar el modelo antes de tocar el componente.

## Auth y permisos

- Auth usa headers tipo Devise Token Auth desde `localStorage`.
- Permisos cargan desde `CurrentUserService` y se aplican con `ngx-permissions`.
- No cambiar nombres de permisos sin revisar guards, templates y backend.

## DGII

- Contrato documentado en `docs/consulta-dgii.md`.
- Si se toca consulta DGII, leer ese documento antes de modificar codigo.

## Divisas y cuadres

- Divisas tienen componentes y servicios reutilizables; revisar `docs/ai/07-reusable-components.md`.
- Cuadres usa patrones mas nuevos; revisar su componente/modelo antes de asumir el contrato legacy.

## Dashboard y reportes

- Dashboard, reportes y facturacion suelen depender de endpoints con agregaciones.
- Antes de cambiar filtros, fechas o totales, rastrear todos los lugares donde se consume el mismo dato.
