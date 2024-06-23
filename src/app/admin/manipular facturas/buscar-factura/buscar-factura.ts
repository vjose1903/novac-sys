import { tableCellType, table_config } from './../../components/new_tablas/tabla-class';
export const shearchDocumentTableId = 'facturas_params';
export class BuscarFacturaC {
  static tables_config: { [prop: string]: table_config } = {
    venta: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Factura', tipo: tableCellType.text, key: 'secuencia', estilos: [{ width: '7rem' }] },
        { titulo: 'Tipo', tipo: tableCellType.text, key: 'tipo_factura' },
        { titulo: 'Comprobante', tipo: tableCellType.text, key: 'numero_comprobante', estilos: [{ width: '9rem' }] },
        { titulo: 'Condición', tipo: tableCellType.text, key: 'condicion', estilos: [{ width: '6rem' }] },
        { titulo: 'Fecha Facturación', tipo: tableCellType.date, key: 'fecha_equivalente', estilos: [{ width: '6.5rem' }] },
        { titulo: 'Fecha Vencimiento', tipo: tableCellType.text, text_color: 'colorFechaV', key: 'fechaV', estilos: [{ width: '6.5rem' }] },
        { titulo: 'Total facturado', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        { titulo: 'Balance factura', tipo: tableCellType.formatoNumero, key: 'balance' },
        {
          titulo: 'Acciones',
          tipo: tableCellType.icon,
          key: 'actions',
          column_gap: '0.8rem',
          estilos: [{ width: '9%' }],
          iconsArray: [
            { id: 'duplicate', key: 'duplicate', tooltip: 'Duplicar factura' },
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
      id_tabla: shearchDocumentTableId,
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    },

    compra: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Factura', tipo: tableCellType.text, key: 'secuencia', estilos: [{ width: '7rem' }] },
        { titulo: 'Tipo', tipo: tableCellType.text, key: 'tipo_factura' },
        { titulo: 'Comprobante', tipo: tableCellType.text, key: 'numero_comprobante', estilos: [{ width: '9rem' }] },
        { titulo: 'Condición', tipo: tableCellType.text, key: 'condicion', estilos: [{ width: '6rem' }] },
        { titulo: 'Fecha ingreso', tipo: tableCellType.date, key: 'fecha_equivalente', estilos: [{ width: '6.5rem' }] },
        { titulo: 'Fecha Vencimiento', tipo: tableCellType.text, key: 'fechaV', text_color: 'colorFechaV' },
        { titulo: 'Total facturado', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        { titulo: 'Balance factura', tipo: tableCellType.formatoNumero, key: 'balance' },
        {
          titulo: 'Acciones',
          tipo: tableCellType.icon,
          key: 'actions',
          estilos: [{ width: '9%' }],
          iconsArray: [{ key: 'delete', tooltip: 'Anular Compra' }],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: shearchDocumentTableId,
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    },

    pre_venta: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Pre-venta', tipo: tableCellType.text, key: 'secuencia', estilos: [{ width: '7rem' }] },
        { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente' },
        { titulo: 'Cliente', tipo: tableCellType.text, key: 'cliente.nombre' },
        { titulo: 'Total', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        {
          titulo: 'Acciones',
          column_gap: '0.8rem',
          tipo: tableCellType.icon,
          key: 'actions',
          estilos: [{ width: '9%' }],
          iconsArray: [
            { key: 'view', tooltip: 'Ver Pre-Venta', text_color: 'viewColor' },
            {
              key: 'make_bill',
              rowTooltip: 'coti_preventa_tooltip',
              disable: [
                { kind: 'has_value', target: 'fecha_completada' },
                { kind: 'campo', target: 'estado', value: [] },
              ],
            },
            { key: 'delete', tooltip: 'Anular Pre-Venta' },
          ],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: shearchDocumentTableId,
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    },

    cotizacion: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', estilos: [{ width: '2rem' }, { color: 'var(--transparente00)' }], iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Cotización', tipo: tableCellType.text, key: 'secuencia', estilos: [{ width: '9rem' }] },
        { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente', estilos: [{ width: '6.5rem' }] },
        { titulo: 'Cliente', tipo: tableCellType.text, key: 'cliente.nombre' },
        { titulo: 'Total cotizado', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        {
          titulo: 'Acciones',
          tipo: tableCellType.icon,
          key: 'actions',
          column_gap: '0.8rem',
          estilos: [{ width: '9%' }],
          iconsArray: [
            { key: 'view', tooltip: 'Ver Cotización', text_color: 'viewColor' },
            { key: 'make_bill', rowTooltip: 'coti_preventa_tooltip', disable: [{ kind: 'has_value', target: 'fecha_completada' }] },
            { key: 'delete', tooltip: 'Anular Cotización' },
          ],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: shearchDocumentTableId,
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    },
  };
}
