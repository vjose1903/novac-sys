export const infoResumenPartes = {
  ventas: ['bruto', 'descuento', 'total', 'efectivo', 'cambio'],
  recibo_ingreso: ['total'],
};

export const infoFacturaPartes = {
  ventas: ['ncf', 'no_documento', 'fecha', 'condición'],
  recibo_ingreso: ['no_documento', 'fecha'],
};

export const infoPropietarioPartes = {
  ventas: ['nombre', 'doc_identidad', 'telefono'],
  recibo_ingreso: ['nombre', 'doc_identidad', 'telefono'],
};

export const cierrePdf = {
  barcode: ['ventas', 'recibo_ingreso'],
  usuario: ['ventas', 'recibo_ingreso'],
};
