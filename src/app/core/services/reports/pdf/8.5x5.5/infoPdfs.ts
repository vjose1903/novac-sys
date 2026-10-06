export const infoPagare = {
  vasquez: { altura_nombre: 170, altura_direccion: 180 },
  brendy: { altura_nombre: 173, altura_direccion: 170 },
  agrodemi: { altura_nombre: 173, altura_direccion: 170 },
};

export const infoTipoPdf = {
  notas: ['tipo_pdf', 'razon'],
  ventas: ['condicion', 'tipo_factura'],
  recibo_ingreso: ['tipo_pdf'],
  conduce: ['tipo_pdf'],
  cotizacion: ['tipo_pdf'],
  cuadre_caja: ['tipo_pdf'],
};


export const infoResumenPartes = {
  notas: ['total_excento', 'total_gravado', 'itbis', 'descuento', 'total'],
  ventas: ['bruto', 'descuento', 'total', 'efectivo', 'cambio'],
  recibo_ingreso: ['bruto', 'mora', 'total'],
  conduce: [],
  cotizacion: ['bruto', 'descuento', 'itbis', 'total'],
  cuadre_caja: [],
};

export const excludeFacturaPartesByTipoFactura = {
  valida: [25],
};

export const infoFacturaPartes = {
  notas: ['ncf', 'ncf_modificado', 'no_documento', 'fecha', 'valida'],
  ventas: ['ncf', 'no_documento', 'fecha', 'fecha_vencimiento', 'valida'],
  recibo_ingreso: ['no_documento', 'fecha'],
  conduce: ['no_documento', 'fecha'],
  cotizacion: ['no_documento', 'fecha'],
  cuadre_caja: ['no_documento', 'fecha'],
};

export const infoPropietarioPartes = {
  notas: ['nombre', 'doc_identidad', 'direccion'],
  ventas: ['nombre', 'doc_identidad', 'direccion'],
  recibo_ingreso: ['nombre', 'doc_identidad', 'direccion', 'recibido'],
  cotizacion: ['nombre', 'doc_identidad', 'direccion'],
  conduce: ['nombre', 'doc_identidad', 'direccion'],
  cuadre_caja: [],
};

export const firmas = {
  notas: ['realizado_por', 'cliente'],
  ventas: ['nombre', 'doc_identidad', 'direccion'],
  recibo_ingreso: ['recibido_por', 'entregado_por'],
  conduce: ['realizado_por', 'cliente'],
  cotizacion: [],
  cuadre_caja: [],
};

export const cierrePdf = {
  barcode: ['ventas', 'recibo_ingreso', 'conduce', 'cuadre_caja'],
  usuario: ['ventas', 'recibo_ingreso', 'conduce', 'cuadre_caja', 'cotizacion'],
};
