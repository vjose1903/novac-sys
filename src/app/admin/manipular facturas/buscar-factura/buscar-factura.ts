
import { default_per_page, table_config, tableCellType} from '@components/new_tablas/tabla-class';
export const shearchDocumentTableId = 'facturas_params';
export class BuscarFacturaC {
  static tables_config: { [prop: string]: table_config } = {
    venta: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', style: { width: '2rem', color: 'var(--transparente00)' }, iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Factura', tipo: tableCellType.text, key: 'secuencia', style: { width: '7rem' } },
        { titulo: 'Tipo', tipo: tableCellType.text, key: 'tipo_factura' },
        { titulo: 'Comprobante', tipo: tableCellType.text, key: 'numero_comprobante', style: { width: '9rem' } },
        { titulo: 'Condición', tipo: tableCellType.text, key: 'condicion', style: { width: '6rem' } },
        { titulo: 'F. Facturación', tooltip: 'Fecha de facturación', tipo: tableCellType.date, key: 'fecha_equivalente', style: { width: '6.5rem' } },
        { titulo: 'F. Vencimiento', tooltip: 'Fecha de vencimiento', tipo: tableCellType.text, text_color: 'colorFechaV', key: 'fechaV', style: { width: '6.5rem' } },
        { titulo: 'Total facturado', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        { titulo: 'Balance factura', tipo: tableCellType.formatoNumero, key: 'balance' },
        {
          titulo: 'Acciones',
          tipo: tableCellType.icon,
          key: 'actions',
          column_gap: '0.8rem',
          style: { width: '9%' },
          iconsArray: [
            { id: 'duplicate', key: 'duplicate', tooltip: 'Duplicar factura' },
            { key: 'view', tooltip: 'Ver factura', text_color: 'viewColor' },
          ],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: shearchDocumentTableId,
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    } as table_config,

    compra: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', style: { width: '2rem', color: 'var(--transparente00)' }, iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Factura', tipo: tableCellType.text, key: 'secuencia', style: { width: '7rem' } },
        { titulo: 'Tipo', tipo: tableCellType.text, key: 'tipo_factura', style: { width: '11rem' } },
        { titulo: 'Comprobante', tipo: tableCellType.text, key: 'numero_comprobante', style: { width: '9rem' } },
        { titulo: 'Condición', tipo: tableCellType.text, key: 'condicion', style: { width: '6rem' } },
        { titulo: 'F. ingreso', tooltip: 'Fecha de ingreso', tipo: tableCellType.date, key: 'fecha_equivalente', style: { width: '6.5rem' } },
        { titulo: 'F. Vencimiento', tooltip: 'Fecha de vencimiento', tipo: tableCellType.text, key: 'fechaV', text_color: 'colorFechaV', style: { width: '6.5rem' } },
        { titulo: 'Total facturado', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        { titulo: 'Balance factura', tipo: tableCellType.formatoNumero, key: 'balance' },
        {
          titulo: 'Acciones',
          tipo: tableCellType.icon,
          key: 'actions',
          column_gap: '0.8rem',
          style: { width: '9%' },
          iconsArray: [
            { key: 'view', rowTooltip: 'view_compra', text_color: 'viewColor', disable: [{ kind: 'campo', target: 'can_pagar', value: [false] }] },
            {
              key: 'delete',
              rowTooltip: 'delete_compra',
              disable: [
                { kind: 'campo', target: 'can_pagar', value: [false] },
                { kind: 'has_value', target: 'fecha_completada' },
                { kind: 'has_value', target: 'pagos' },
              ],
            },
            {
              key: 'pay_bill',
              rowTooltip: 'pago_tooltip',
              disable: [
                { kind: 'campo', target: 'can_pagar', value: [false] },
                { kind: 'has_value', target: 'fecha_completada' },
              ],
            },
          ],
        },
      ],
      colores: true,
      padding: '0.5rem',
      id_tabla: shearchDocumentTableId,
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    } as table_config,

    pre_venta: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', style: { width: '2rem', color: 'var(--transparente00)' }, iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Pre-venta', tipo: tableCellType.text, key: 'secuencia', style: { width: '7rem' } },
        { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente' },
        { titulo: 'Cliente', tipo: tableCellType.text, key: 'cliente.nombre' },
        { titulo: 'Total', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        {
          titulo: 'Acciones',
          column_gap: '0.8rem',
          tipo: tableCellType.icon,
          key: 'actions',
          style: { width: '9%' },
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
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    } as table_config,

    cotizacion: {
      info: [
        { titulo: '1', tipo: tableCellType.icon, key: 'estado', style: { width: '2rem', color: 'var(--transparente00)' }, iconsArray: [{ key: 'is_active', rowTooltip: 'is_active_tooltip', text_color: 'is_active_color' }] },
        { titulo: 'No. Cotización', tipo: tableCellType.text, key: 'secuencia', style: { width: '9rem' } },
        { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente', style: { width: '6.5rem' } },
        { titulo: 'Cliente', tipo: tableCellType.text, key: 'cliente.nombre' },
        { titulo: 'Total cotizado', tipo: tableCellType.formatoNumero, key: 'total_factura' },
        {
          titulo: 'Acciones',
          tipo: tableCellType.icon,
          key: 'actions',
          column_gap: '0.8rem',
          style: { width: '9%' },
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
      obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    } as table_config,
  };
}
