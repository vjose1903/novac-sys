export const infoResumenPartes = {
  ventas: ['bruto', 'descuento', 'total', 'efectivo', 'cambio'],
  notas: ['total'],
  pre_factura: ['bruto', 'descuento', 'total'],
  recibo_ingreso: ['total'],
  conduce: [],
  cuadre_caja: [],
};

export const infoFacturaPartes = {
  ventas: ['ncf', 'no_documento', 'fecha', 'condición'],
  notas: ['ncf', 'no_documento', 'fecha', 'valida'],
  pre_factura: ['no_documento', 'fecha'],
  recibo_ingreso: ['no_documento', 'fecha'],
  conduce: ['no_documento', 'fecha'],
  cuadre_caja: ['no_documento', 'fecha'],
};

export const infoPropietarioPartes = {
  notas: ['nombre', 'doc_identidad', 'direccion'],
  ventas: ['nombre', 'doc_identidad', 'telefono'],
  pre_factura: ['nombre', 'doc_identidad', 'telefono'],
  recibo_ingreso: ['nombre', 'doc_identidad', 'telefono'],
  conduce: ['nombre', 'doc_identidad', 'telefono'],
  cuadre_caja: [],
};

export const cierrePdf = {

  barcode: ['ventas', 'recibo_ingreso', 'conduce', 'cuadre_caja', 'pre_factura', 'notas'],
  usuario: ['ventas', 'recibo_ingreso', 'conduce', 'cuadre_caja', 'pre_factura', 'notas'],
};

