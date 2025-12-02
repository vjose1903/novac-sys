import { tableCellType, table_info } from '@components/new_tablas/tabla-class';

export enum tipoPagoE {
  recibosIngresos = 'recibo_ingreso',
  pagosFacturas = 'pago_factura',
}

export const tableConfigPagos: { [key: string]: Array<table_info> } = {
  [tipoPagoE.recibosIngresos]: [
    { titulo: 'No. recibo', style: { width: '8%' }, key: 'numero_recibo', tipo: tableCellType.text },
    { titulo: 'Fecha recibo', style: { width: '10%' }, key: 'fecha_equivalente', tipo: tableCellType.date },
    { titulo: 'Cliente', key: 'cliente.nombre_completo', tipo: tableCellType.text, style: { 'text-align': 'start', 'padding-left': '1.5rem' } },
    { titulo: 'No. factura', key: 'numero_factura', tipo: tableCellType.text, style: { width: '12%' } },
    { titulo: 'Total recibido', key: 'total', tipo: tableCellType.formatoNumero, style: { width: '12%', 'text-align': 'end' } },
    {
      titulo: 'Acciones',
      tipo: tableCellType.icon,
      key: 'actions',
      style: { width: '9%', color: '#000' },
      iconsArray: [
        { key: 'ver', rowTooltip: 'tooltip_ver', text_color: 'colorNegro' },
        { key: 'anular', rowTooltip: 'tooltip_anular', text_color: 'colorNegro' },
      ],
    },
  ],
  [tipoPagoE.pagosFacturas]: [
    { titulo: 'No. pago', style: { width: '8%' }, key: 'numero', tipo: tableCellType.text },
    { titulo: 'Fecha pago', style: { width: '10%' }, key: 'fecha_equivalente', tipo: tableCellType.date },
    { titulo: 'Suplidor', key: 'suplidor.nombre', tipo: tableCellType.text, style: { 'text-align': 'start', 'padding-left': '1.5rem' } },
    { titulo: 'No. factura', key: 'numero_factura', tipo: tableCellType.text, style: { width: '12%' } },
    { titulo: 'Total recibido', key: 'total', tipo: tableCellType.formatoNumero, style: { width: '12%', 'text-align': 'end' } },
    {
      titulo: 'Acciones',
      tipo: tableCellType.icon,
      key: 'actions',
      style: { width: '9%', color: '#000' },
      iconsArray: [
        { key: 'ver', rowTooltip: 'tooltip_ver', text_color: 'colorNegro' },
        { key: 'anular', rowTooltip: 'tooltip_anular', text_color: 'colorNegro' },
      ],
    },
  ],
};
