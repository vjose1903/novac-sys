# Frontend Angular

## Configuracion base

- `src/app/app.config.ts` configura zoneless change detection, router, interceptor HTTP, `NgxPermissionsModule`, `NgxExtendedPdfViewerModule`, Toastr, tema PrimeNG Nora y Firebase/Firestore.
- El proyecto mezcla modulos Angular y componentes standalone. Antes de agregar imports, revisa el archivo vecino.
- `src/app/modules/primeng.module.ts` centraliza muchos imports de PrimeNG para modulos tradicionales.

## Routing

- Rutas raiz: `src/app/app.routing.ts`.
- Layout admin: `src/app/admin/layout/layout.routing.ts`.
- Registros: `src/app/admin/registros/registros.routing.ts`.
- Al crear una pantalla nueva, replica el patron del modulo funcional mas cercano y verifica guards/permisos existentes.

## Permisos

- `src/app/core/guards/auth.guard.ts` valida usuario/token antes de entrar al area protegida.
- `src/app/core/guards/permissions-guard.service.ts` espera usuario/permisos y redirige a dashboard si no hay permiso.
- `src/app/core/services/current-user.service.ts` carga permisos desde `currentUser.permisos.map(perm => perm.permiso)`.
- En templates se usa `*ngxPermissionsOnly="..."` para mostrar u ocultar acciones.

## Convenciones UI

- Las pantallas CRUD suelen combinar formulario + listado dentro del mismo componente.
- Los listados deben usar `dinamic-table` salvo que exista una razon concreta para no hacerlo.
- Los formularios deben seguir `docs/ai/06-form-ui-standards.md`.
- Los componentes reutilizables estan en `docs/ai/07-reusable-components.md`.
