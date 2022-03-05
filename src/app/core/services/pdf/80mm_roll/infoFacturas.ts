export const infoResumenPartes = {
  ventas: ['bruto', 'descuento', 'total', 'efectivo', 'cambio'],
  recibo_ingreso: ['total'],
  conduce: [],
};

export const infoFacturaPartes = {
  ventas: ['ncf', 'no_documento', 'fecha', 'condición'],
  recibo_ingreso: ['no_documento', 'fecha'],
  conduce: ['no_documento', 'fecha'],
};

export const infoPropietarioPartes = {
  ventas: ['nombre', 'doc_identidad', 'telefono'],
  recibo_ingreso: ['nombre', 'doc_identidad', 'telefono'],
  conduce: ['nombre', 'doc_identidad', 'telefono'],
};

export const cierrePdf = {
  barcode: ['ventas', 'recibo_ingreso', 'conduce'],
  usuario: ['ventas', 'recibo_ingreso', 'conduce'],
};
