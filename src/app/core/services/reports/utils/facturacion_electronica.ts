import { DetalleFactura } from '@admin/facturacion/factura';

export function agruparArticulosPorPagina(articulos: any[], itemsPorPagina: number): { articulos: any[]; totalizacion?: { total_excento: number; total_gravado: number; itbis: number; total_pagina: number } }[] {
  const resultado: { articulos: any[]; totalizacion?: { total_excento: number; total_gravado: number; itbis: number; total_pagina: number } }[] = [];

  for (let i = 0; i < articulos.length; i += itemsPorPagina) {
    const grupo = articulos.slice(i, i + itemsPorPagina);
    const totalizacion = parseTotalizacion(grupo);

    resultado.push({ articulos: grupo, totalizacion });
  }

  return resultado;
}

export function parseTotalizacion(detalles: DetalleFactura[]): { total_excento: number; total_gravado: number; itbis: number; total_pagina: number } {
  let total_excento = 0;
  let total_gravado = 0;
  let itbis = 0;
  let total_pagina = 0;

  const articulos_grabados = detalles.filter(detalle => detalle.calcular_itbis);
  const articulos_excentos = detalles.filter(detalle => !detalle.calcular_itbis);

  articulos_grabados.forEach(articulo => {
    const descuento = articulo.descuento ?? articulo.descuento_valor ?? 0;
    const itbis_ = articulo.itbis ?? 0;

    total_gravado += articulo.total + descuento - itbis_;
    itbis += itbis_;
  });

  articulos_excentos.forEach(articulo => {
    const descuento = articulo.descuento ?? articulo.descuento_valor ?? 0;
    const itbis_ = articulo.itbis ?? 0;

    total_excento += articulo.total + descuento - itbis_;
  });

  total_pagina = total_excento + total_gravado + itbis;

  return { total_excento, total_gravado, itbis, total_pagina };
}
