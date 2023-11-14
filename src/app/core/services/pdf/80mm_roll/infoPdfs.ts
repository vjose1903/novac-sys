export const infoResumenPartes = {
  ventas: ['bruto', 'descuento', 'total', 'efectivo', 'cambio'],
  cotizacion: ['bruto', 'descuento', 'itbis', 'total'],
  notas: ['total'],
  pre_venta: ['bruto', 'descuento', 'total'],
  recibo_ingreso: ['total'],
  pago_factura: ['total'],
  conduce: [],
  cuadre_caja: [],
};

export const infoFacturaPartes = {
  ventas: ['ncf', 'no_documento', 'fecha', 'condición'],
  cotizacion: ['no_documento', 'fecha'],
  notas: ['ncf', 'no_documento', 'fecha', 'valida'],
  pre_venta: ['no_documento', 'fecha'],
  recibo_ingreso: ['no_documento', 'fecha'],
  pago_factura: ['no_documento', 'fecha'],
  conduce: ['no_documento', 'fecha'],
  cuadre_caja: ['no_documento', 'fecha'],
};

export const infoPropietarioPartes = {
  notas: ['nombre', 'doc_identidad', 'direccion', 'telefono'],
  ventas: ['nombre', 'doc_identidad', 'direccion', 'telefono'],
  cotizacion: ['nombre', 'doc_identidad', 'direccion', 'telefono'],
  pre_venta: ['nombre', 'doc_identidad', 'direccion', 'telefono'],
  recibo_ingreso: ['nombre', 'doc_identidad', 'direccion', 'telefono'],
  pago_factura: ['nombre', 'doc_identidad', 'direccion', 'telefono'],
  conduce: ['nombre', 'doc_identidad', 'direccion'],
  cuadre_caja: [],
};

export const cierrePdf = {
  barcode: ['ventas', 'recibo_ingreso', 'pago_factura', 'conduce', 'cuadre_caja', 'pre_venta', 'notas', 'cotizacion'],
  usuario: ['ventas', 'recibo_ingreso', 'pago_factura', 'conduce', 'cuadre_caja', 'pre_venta', 'notas', 'cotizacion'],
};
