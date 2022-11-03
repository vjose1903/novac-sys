import { table_config } from './../../components/new_tablas/tabla-class';

export class BuscarFacturaC {
  static tables_config = {
    venta: {
      info: [
        { titulo: '1', tipo: 'icon', key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Factura', tipo: 'text', key: 'secuencia', estilos: [{ width: '7rem' }] },
        { titulo: 'Tipo', tipo: 'text', key: 'tipo_factura' },
        { titulo: 'Comprobante', tipo: 'text', key: 'numero_comprobante', estilos: [{ width: '7rem' }] },
        { titulo: 'Condición', tipo: 'text', key: 'condicion', estilos: [{ width: '6rem' }] },
        { titulo: 'Fecha Facturación', tipo: 'date', key: 'fecha_equivalente' },
        { titulo: 'Fecha Vencimiento', tipo: 'text', text_color: 'colorFechaV', key: 'fechaV' },
        { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura' },
        { titulo: 'Balance factura', tipo: 'formatoNumero', key: 'balance' },
        {
          titulo: 'Acciones',
          tipo: 'icon',
          key: 'actions',
          estilos: [{ width: '9%' }],
          iconsArray: [
            { key: 'view', tooltip: 'Ver factura', text_color: 'viewColor' },
            {
              id: 'select',
              key: {
                key: 'selected',
                source: 'is_selected',
                clases: [
                  { value: true, clase: 'far fa-check-square' },
                  { value: false, clase: 'far fa-square' },
                ],
              },
              rowTooltip: 'tooltip_select',
            },
          ],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: 'facturas_params',
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    } as table_config,

    compra: {
      info: [
        { titulo: '1', tipo: 'icon', key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Factura', tipo: 'text', key: 'secuencia', estilos: [{ width: '7rem' }] },
        { titulo: 'Tipo', tipo: 'text', key: 'tipo_factura' },
        { titulo: 'Comprobante', tipo: 'text', key: 'numero_comprobante', estilos: [{ width: '7rem' }] },
        { titulo: 'Condición', tipo: 'text', key: 'condicion', estilos: [{ width: '6rem' }] },
        { titulo: 'Fecha ingreso', tipo: 'date', key: 'fecha_equivalente' },
        { titulo: 'Fecha Vencimiento', tipo: 'text', key: 'fechaV', text_color: 'colorFechaV' },
        { titulo: 'Total facturado', tipo: 'formatoNumero', key: 'total_factura' },
        { titulo: 'Balance factura', tipo: 'formatoNumero', key: 'balance' },
        {
          titulo: 'Acciones',
          tipo: 'icon',
          key: 'actions',
          estilos: [{ width: '9%' }],
          iconsArray: [{ key: 'delete', tooltip: 'Anular Compra' }],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: 'facturas_params',
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    } as table_config,

    pre_venta: {} as table_config,

    cotizacion: {
      info: [
        { titulo: '1', tipo: 'icon', key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Cotización', tipo: 'text', key: 'secuencia', estilos: [{ width: '7rem' }] },
        { titulo: 'Fecha', tipo: 'date', key: 'fecha_equivalente' },
        { titulo: 'Cliente', tipo: 'text', key: 'cliente.nombre' },
        { titulo: 'Total cotizado', tipo: 'formatoNumero', key: 'total_factura' },
        {
          titulo: 'Acciones',
          tipo: 'icon',
          key: 'actions',
          estilos: [{ width: '9%' }],
          iconsArray: [
            { key: 'view', tooltip: 'Ver Cotización', text_color: 'viewColor' },
            { key: 'make_bill', tooltip: 'Crear Factura desde Cotización' },
            { key: 'delete', tooltip: 'Anular Cotización' },
          ],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: 'facturas_params',
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    } as table_config,
  };
}
