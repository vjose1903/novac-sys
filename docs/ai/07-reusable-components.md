# Reusable Components

## Regla principal

Antes de crear un componente nuevo, revisar si alguno de estos ya cubre el caso. Reutilizar el componente existente salvo que falte una capacidad clara.

## Tabla dinamica

- Selector: `dinamic-table`.
- Codigo: `src/app/core/components/new_tablas/`.
- Modulo: `TablasModule`.
- Configuracion: `Tabla`, `Info`, `Boton`, `Obj_Paginate`, `Filtro`, `Filtrar`, `Icons` en `tabla-class.ts`.
- Servicio: `TablasService` en `tablas.service.ts`.
- Uso tipico:
  - `[cardTabla]="cardTabla"`.
  - `[(data)]="data"`.
  - `[(TablasComponent)]="tablaComponent"`.
  - `[config]="table_config"`.
  - `(table_events)="handle_table_events($event)"`.
- Soporta paginacion, busqueda local/remota, sort, botones por fila, colores, transformaciones de fila, iconos, imagenes, switches, inputs y dropdowns.
- Tipos de celda frecuentes: `text`, `date`, `formatoNumero`, `tag`, `color`, `switch`, `inputSwitch`, `dropDown`, `input`, `img`, `icon`, `index`.
- Para listados remotos con total de registros, configurar `obj_paginate.show = true`, `obj_paginate.showTotal = true`, `is_local = false` y actualizar la tabla con `tablaComponent.changeTableConfig([{ total_count: res.total_registros }])`.

## Modal dinamico

- Render global: componente `dynamic-modal`.
- Codigo: `src/app/core/components/dynamic-modal/`.
- Servicio: `DynamicModalService`.
- Config: `DynamicModalClass`.
- Para abrir modal: crear `new DynamicModalClass()`, definir `id`, `header`, `width`, `component`, `inputs`, `botones`, callback y llamar `.show()`.
- Para confirmaciones: usar `DynamicModalService.confirmationModal(...)` y botones de confirmacion existentes.
- Componentes embebidos deben seguir `IDynamicModal` cuando aplique.

## Inputs reutilizables

- Divisa:
  - Selector: `form-divisa-input`.
  - Codigo: `src/app/core/components/form-fields/form-divisa-input/`.
  - Usa `DivisaService`, `p-select` e imagenes con `img-component`.
  - Inputs relevantes: `inputId`, `label`, `showLabel`, `isDisabled`, `options`, `selectedCodeVariant`.
  - Eventos: `keydownEnter`, `onChangeValue`.
- Hora:
  - Selector: `form-time-picker-input`.
  - Codigo: `src/app/core/components/form-fields/time-picker-input/`.
  - Soporta `min`, `max`, `minuteStep`, `disabled`, `readonly` y eventos de cambio.
- Errores:
  - Selector: `form-error-msg`.
  - Codigo: `src/app/core/components/form-error-msg/`.
  - Soporta controles Angular y componentes PrimeNG como `InputMask`, `InputNumber`, `Select`, `DatePicker`, `MultiSelect`.

## Imagenes

- `app-upload-img`: carga/seleccion de imagen y emite `{ fileName, base_64, src_img, id }`.
- `img-viewer-edit`: visualizacion/edicion de imagen.
- `img-component`: render reutilizable de imagen, usado tambien en inputs de divisa.

## Botones

- `btn-icon-circular`: boton circular reutilizable para acciones compactas.
- `app-btncircular`: boton circular usado en pantallas existentes.
- Antes de crear botones nuevos, revisar el formulario o listado vecino.

## Formularios custom

- `src/app/core/typescript/custom-forms-elements/custom-forms-elements.ts` ayuda a implementar controles compatibles con Angular Forms.
- Usarlo cuando un input nuevo deba funcionar como `ControlValueAccessor`.
