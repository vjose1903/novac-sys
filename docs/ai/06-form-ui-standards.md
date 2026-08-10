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

## Estandar visual moderno

El estandar vigente para pantallas de listado/formulario toma como referencia visual `src/app/admin/produccion/produccion.component.*` y `src/app/admin/reportes/reportes.component.*`.

- Mantener el shell global `rowResgitro`; no crear estilos locales nuevos para resolver bordes, sombras, radios, titulos o densidad del CRUD si las clases estandar lo cubren.
- El encabezado de pantalla usa `colTitulo` con `screen-title-block`, `screen-module-kicker` y titulo fuerte, sin cards ni barras adicionales. El kicker debe indicar el modulo real, por ejemplo `Registros`, `Operaciones` o `Reportes`.
- El formulario usa `tituloFormClass` + `card cardFormClass`: superficie `var(--app-surface)`, borde `var(--app-card-border)`, sombra `var(--app-overlay-shadow)`, radio de `1rem` y acento lateral con `var(--primary06)`.
- Los formularios largos deben vivir dentro de `cardFormClass`; no mover scroll al body ni crear wrappers paralelos para simular la card.
- El formulario debe estar cerrado por defecto al entrar a una pantalla de listado. El estado cerrado no debe mostrar el titulo `Formulario`, pero la apertura/cierre entre `showForm` y `hideForm` debe conservar una transicion suave de ancho/opacidad.
- Labels y controles mantienen la densidad compacta del sistema: label semibold, margen inferior corto, inputs existentes (`form-control`, `inputE`, PrimeNG) y manejo de errores actual.
- Los botones principales del header/listado deben verse como acciones modernas: radio medio, peso semibold, sombra contenida y feedback hover/active.
- Reutilizar los mismos tokens globales usados por produccion/reportes: `--app-text`, `--app-text-muted`, `--app-surface`, `--app-card-border`, `--app-overlay-shadow`, `--app-border`, `--primary01`, `--primary06`, `--primary07`.
- Si una pantalla necesita una variacion por dominio, limitarla a detalles propios del modulo. El look base de CRUD debe salir de `src/styles.scss`.

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
