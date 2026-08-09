# List UI Standards

## Regla principal

Si la tarea pide un listado, tabla, paginacion, total de registros, busqueda, filtros, sort o acciones por fila, usar `dinamic-table` y copiar el patron del listado existente mas cercano.

Referencias principales:
- Clientes: `src/app/admin/registros/registro-clientes/registro-clientes.component.ts`.
- Clientes HTML: `src/app/admin/registros/registro-clientes/registro-clientes.component.html`.
- Articulos: `src/app/admin/registros/articulos/registro-articulos.component.ts`.
- Articulos HTML: `src/app/admin/registros/articulos/registro-articulos.component.html`.

## Template

El listado debe renderizar la tabla dinamica asi:

```html
<dinamic-table
  [cardTabla]="cardTabla"
  [(data)]="lista"
  [seleccionado]="selected?.id"
  [(TablasComponent)]="tablaComponent"
  [config]="table_config"
  (table_events)="handle_table_events($event)">
</dinamic-table>
```

Mantener nombres reales del modulo (`listaClientes`, `clienteSelected`, `listaArticulos`, `articuloSelected`, etc.).

## Paginacion remota

Para listados backend paginados, configurar `table_config.obj_paginate` con este patron:

```ts
obj_paginate: {
  show: true,
  showTotal: true,
  page: 1,
  per_page: 20,
  per_page_options: default_per_page,
  search: ' ',
  is_local: false,
}
```

Tambien usar:

- `filtrar: { local: false }`.
- `padre_functions: { data_request: params => this.getItems(params) }`.
- `id_tabla` unico y estable, por ejemplo `lista_clientes` o `lista_articulos`.

## Total de registros

El total visible de la tabla dinamica se alimenta desde la respuesta backend.

Despues de asignar `res.data` al listado, llamar:

```ts
this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
```

No calcular el total con `lista.length` en listados remotos, porque solo representa la pagina actual.

## Request al backend

El metodo de carga debe recibir `params` desde la tabla:

```ts
async getItems(params?: { per_page?: number; page?: number; search?: string }) {
  const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

  this.itemClass.getAll({
    afterPath: `filtro/${palabra_a_buscar}`,
    parameters: {
      page: params.page,
      per_page: params.per_page,
      paginado: true,
    },
  }).then(res => {
    this.lista = res.data;
    this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
  });
}
```

Adaptar endpoint y clase al modulo. Articulos usa `getArticulosFiltrado({ buscar, page, per_page, fecha, paginado: true, mode: 'list' })`.

## Mantener paginacion actual

Cuando se refresca luego de editar, borrar, guardar o volver de una configuracion, recuperar la paginacion por `id_tabla`:

```ts
const actualPagination = this.tServ.getPaginationById('lista_articulos') || this.tServ.obj_paginate.default;
this.getArticulos(actualPagination);
```

Clientes usa `lista_clientes`; articulos usa `lista_articulos`.

## Sort remoto

Si el listado permite sort remoto:

- Definir `sort` en columnas de `info`.
- Usar `this.tServ.parseSort(this.table_config)`.
- Validar campos permitidos antes de enviarlos al backend.
- Enviar `order_by` junto a `page`, `per_page` y `paginado: true`.

## Acciones por fila

- Definir botones en `table_config.botones`.
- Mantener permisos existentes por accion.
- Procesar acciones desde `tableClick_action(params)` o `handle_table_events($event)` segun el componente vecino.
