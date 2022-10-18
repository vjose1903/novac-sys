export const infoPagare = {
  vasquez: { altura_nombre: 170, altura_direccion: 180 },
  brendy: { altura_nombre: 173, altura_direccion: 170 },
  agrodemi: { altura_nombre: 173, altura_direccion: 170 },
};

export const infoTipoPdf = {
  notas: ['titulo'],
  ventas: ['condicion', 'tipo_factura'],
  recibo_ingreso: ['titulo'],
  conduce: ['titulo'],
  cuadre_caja: ['titulo'],
};

export const infoResumenPartes = {
  notas: ['total'],
  ventas: ['bruto', 'descuento', 'total', 'efectivo', 'cambio'],
  recibo_ingreso: ['total'],
  conduce: [],
  cuadre_caja: [],
};

export const infoFacturaPartes = {
  notas: ['ncf', 'no_documento', 'fecha', 'valida'],
  ventas: ['ncf', 'no_documento', 'fecha', 'fecha_vencimiento', 'valida'],
  recibo_ingreso: ['no_documento', 'fecha'],
  conduce: ['no_documento', 'fecha'],
  cuadre_caja: ['no_documento', 'fecha'],
};

export const infoPropietarioPartes = {
  notas: ['nombre', 'doc_identidad', 'direccion'],
  ventas: ['nombre', 'doc_identidad', 'direccion'],
  recibo_ingreso: ['nombre', 'doc_identidad', 'direccion', 'recibido'],
  conduce: ['nombre', 'doc_identidad', 'direccion'],
  cuadre_caja: [],
};

export const firmas = {
  notas: ['realizado_por', 'cliente'],
  ventas: ['nombre', 'doc_identidad', 'direccion'],
  recibo_ingreso: ['recibido_por', 'entregado_por'],
  conduce: ['nombre', 'doc_identidad', 'direccion'],
  cuadre_caja: [],
};

export const cierrePdf = {
  barcode: ['ventas', 'recibo_ingreso', 'conduce', 'cuadre_caja'],
  usuario: ['ventas', 'recibo_ingreso', 'conduce', 'cuadre_caja'],
};
