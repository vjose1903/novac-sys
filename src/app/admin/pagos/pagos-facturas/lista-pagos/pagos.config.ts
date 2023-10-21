import { table_info } from '../../../components/new_tablas/tabla-class';

export const tableConfigPagos: { [key: string]: Array<table_info> } = {
  'recibos-ingresos': [
    { titulo: 'No. recibo', estilos: [{ width: '8%' }], key: 'numero_recibo', tipo: 'text' },
    { titulo: 'Fecha recibo', estilos: [{ width: '10%' }], key: 'fecha_equivalente', tipo: 'date' },
    { titulo: 'Cliente', key: 'cliente.nombre_completo', tipo: 'text', estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }] },
    { titulo: 'No. factura', key: 'numero_factura', tipo: 'text', estilos: [{ width: '12%' }] },
    { titulo: 'Total recibido', key: 'total', tipo: 'formatoNumero', estilos: [{ width: '12%' }, { 'text-align': 'end' }] },
    {
      titulo: 'Acciones',
      tipo: 'icon',
      key: 'actions',
      estilos: [{ width: '9%' }, { color: '#000' }],
      iconsArray: [
        { key: 'ver', rowTooltip: 'tooltip_ver', text_color: 'colorNegro' },
        { key: 'anular', rowTooltip: 'tooltip_anular', text_color: 'colorNegro' },
      ],
    },
  ],
  'pagos-facturas': [
    { titulo: 'No. pago', estilos: [{ width: '8%' }], key: 'numero', tipo: 'text' },
    { titulo: 'Fecha pago', estilos: [{ width: '10%' }], key: 'fecha_equivalente', tipo: 'date' },
    { titulo: 'Suplidor', key: 'suplidor.nombre_completo', tipo: 'text', estilos: [{ 'text-align': 'start' }, { 'padding-left': '1.5rem' }] },
    { titulo: 'No. factura', key: 'numero_factura', tipo: 'text', estilos: [{ width: '12%' }] },
    { titulo: 'Total recibido', key: 'total', tipo: 'formatoNumero', estilos: [{ width: '12%' }, { 'text-align': 'end' }] },
    {
      titulo: 'Acciones',
      tipo: 'icon',
      key: 'actions',
      estilos: [{ width: '9%' }, { color: '#000' }],
      iconsArray: [
        { key: 'ver', rowTooltip: 'tooltip_ver', text_color: 'colorNegro' },
        { key: 'anular', rowTooltip: 'tooltip_anular', text_color: 'colorNegro' },
      ],
    },
  ],
};

export enum tipoPagoE {
  recibosIngresos = 'recibos-ingresos',
  pagosFacturas = 'pagos-facturas',
}
