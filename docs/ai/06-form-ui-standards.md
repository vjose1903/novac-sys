# Form UI Standards

## Regla principal

Si la tarea pide crear o modificar un formulario, primero revisa el formulario existente mas parecido y replica su estructura visual, clases, componentes PrimeNG, permisos, botones y manejo de errores.

Referencias rapidas:
- Clientes: `src/app/admin/registros/registro-clientes/registro-clientes.component.html`.
- Suplidores: `src/app/admin/registros/registro-suplidores/registro-suplidores.component.html`.
- Articulos: `src/app/admin/registros/articulos/registro-articulos.component.html`.
- Divisa: `src/app/admin/registros/divisa/divisa.component.html`.
- NCF: `src/app/admin/registros/ncf/ncf.component.html`.
- Roles: `src/app/admin/registros/roles/roles.component.html`.
- Configuracion inicial: `src/app/login/extra/configuraciones/configuraciones.component.html`.

## Layout CRUD estandar

- Contenedor de pantalla: `row rowResgitro`.
- Titulo: `colTitulo`.
- Area principal: `colFormularioListado`.
- Form/list split:
  - Formulario: `form {{ isCreando || selected ? 'showForm' : 'hideForm' }}`.
  - Listado: `list {{ isCreando || selected ? 'FormList' : 'onlyList' }}`.
- Card de formulario: `card cardFormClass`.
- Card/listado: `card cardContentClass`, `tituloCardClass`, `divTabla`.
- Permisos visibles con `*ngxPermissionsOnly="formPermissions"` o permisos especificos por accion.

## Campos

- Usar Reactive Forms (`UntypedFormGroup`, `UntypedFormBuilder`, `Validators`) cuando el modulo vecino lo use.
- Patron clasico:
  - Wrapper `div.form-group` con `[appMsgError]="'campo'" [form]="form"`.
  - `label.control-label`.
  - Requeridos con `<span style="color: red">*</span>`.
  - Input/select con `class="form-control"` o clases ya usadas en el modulo.
  - Contenedor de error `span id="msgContainer_campo"`.
- Patron nuevo permitido: `<form-error-msg [control]="form.get('campo')">`.
- No inventar un sistema visual nuevo para errores, labels o espaciado.
- Si el estilo aplica a campos reutilizables o componentes usados en mas de una pantalla, colocarlo en el SCSS global correspondiente bajo `src/assets/my_styles/elements/` antes que en el SCSS de un modulo puntual.

## PrimeNG usado en formularios

Usa estos componentes cuando el caso coincida con pantallas existentes:

- `p-select`: selects con `appendTo="body"`, `optionLabel`, `optionValue`, `[filter]="true"` y `[resetFilterOnHide]="true"` cuando aplique.
- `p-inputMask`: telefonos, RNC, cedulas u otros formatos; usar `styleClass="form-control"` y `[autoClear]="false"` si el formulario vecino lo hace.
- `p-datepicker`: fechas con `dateFormat="dd/mm/yy"`, `appendTo="body"` e `inputStyleClass="form-control"`.
- `p-multiSelect`: seleccion multiple.
- `p-selectButton`: opciones tipo selector segmentado.
- `p-tabs`, `p-tablist`, `p-tab`, `p-tabpanels`, `p-tabpanel`: secciones por tabs.
- `p-dialog`, `p-popover`, `p-drawer`: overlays si ya se usan en el flujo.
- `p-tag`, `p-progressBar`, `p-paginator`, `p-speedDial`, `p-accordion`: estados, progreso, paginacion o acciones cuando el patron existente lo requiera.

## Botones y acciones

- Reusar botones existentes (`btn-icon-circular`, `app-btncircular`) si el formulario vecino los usa.
- Mantener permisos y nombres de acciones existentes.
- Evitar agregar texto explicativo visible dentro de la UI salvo que el modulo ya lo haga.

## Listado asociado

- Usar `dinamic-table` para listados CRUD.
- Configurar `table_config` siguiendo el modulo vecino: columnas `info`, `id_tabla`, `filtrar`, `obj_paginate`, `botones`, `padre_functions`.
- Para paginacion y total de registros, aplicar `docs/ai/11-list-ui-standards.md`.
- Para sort remoto, revisar `TablasService.parseSort(table_config)`.

## Teclado y UX existente

- Muchos formularios usan `MixinClass` y `saltar(...)` para Enter/tabulacion. Si el formulario vecino lo usa, mantener ese patron.
- Checkboxes estilo switch usan `input.apple-switch`.
- Mantener densidad visual y clases Bootstrap existentes.
