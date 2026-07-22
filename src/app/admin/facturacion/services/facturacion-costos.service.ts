import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { ConfigArticuloC, ConfigArticuloI } from '@registros/articulos/configuracion_articulos/articulos_configuracion';

export interface RevisionCostosResult {
  cuerpo: any[];
  articulosAcambiar: any[];
}

@Injectable({
  providedIn: 'root',
})
export class FacturacionCostosService {
  private configArticuloClass = new ConfigArticuloC();

  revisarPrecios(cuerpoFact: any[], configArticulos: ConfigArticuloI): RevisionCostosResult {
    const articulosAcambiar = [];

    const cuerpo = cuerpoFact.map(row => {
      const { articulo } = row;
      const { contenido_articulos } = articulo;
      const costoRow = fun.desformatearStNumber(row.costo);
      const costoPrincipalDB = articulo.costo_principal;
      const isMedida = this.determinarTipoMedida(articulo, row.unidad, contenido_articulos);

      if (contenido_articulos.length === 0 || isMedida === 'principal') {
        this.procesarCambioCostos({ costoDB: costoPrincipalDB, costoRow, articulo, configArticulos, articulosAcambiar });
      } else {
        const { costoPrincipalCalculado, costoRowCalculado } = this.calcularCostosPorMedida(isMedida, contenido_articulos, costoRow);
        this.procesarCambioCostos({ costoDB: costoPrincipalCalculado, costoRow: costoRowCalculado, articulo, configArticulos, articulosAcambiar });
      }

      return fun.omit(row, ['costo', 'condicion', 'codigo']);
    });

    return { cuerpo, articulosAcambiar };
  }

  private procesarCambioCostos(params: { costoDB: number; costoRow: number; articulo: any; configArticulos: ConfigArticuloI; articulosAcambiar: any[] }): void {
    const { costoDB, costoRow, articulo, configArticulos, articulosAcambiar } = params;
    if (costoDB === costoRow) return;

    const { contenido_articulos } = articulo;
    const newPrecio = this.calculatePrecio(costoRow, configArticulos);
    const newPrecioLibra = this.calculatePrecioLibra(newPrecio);
    const newCostoLibra = this.calculateCostoLibra(costoRow);
    const esQuintal = articulo.medida === 'Quintal';
    const contenidoPadre = contenido_articulos.find(contenido => contenido.condicion === 'padre');
    const contenidoHijo = contenido_articulos.find(contenido => contenido.condicion === 'hijo');

    if (contenidoPadre) {
      const { cantidad: cantPadre } = contenidoPadre;
      if (esQuintal) {
        contenidoPadre.precio = fun.desformatearStNumber(newPrecioLibra);
        contenidoPadre.costo = fun.desformatearStNumber(newCostoLibra);
        contenidoPadre.cantidad = 100;
      } else {
        contenidoPadre.precio = fun.desformatearStNumber(this.calcNewAmounts(cantPadre, newPrecio));
        contenidoPadre.costo = fun.desformatearStNumber(this.calcNewAmounts(cantPadre, costoRow));
      }
    }

    if (contenidoHijo && contenidoPadre) {
      contenidoHijo.precio = fun.desformatearStNumber(this.calcNewAmounts(contenidoHijo.cantidad, fun.roundNumberToDecimal(contenidoPadre.precio)));
      contenidoHijo.costo = fun.desformatearStNumber(this.calcNewAmounts(contenidoHijo.cantidad, fun.roundNumberToDecimal(contenidoPadre.costo)));
    }

    articulo.costo_principal = costoRow;
    articulo.precio_principal = newPrecio;
    articulo.contenido_articulos = this.limpiarContenidos([contenidoPadre, contenidoHijo]);

    articulosAcambiar.push(fun.omit(articulo, ['created_at', 'updated_at']));
  }

  private calculatePrecio(costo, configArticulos: ConfigArticuloI): number {
    costo = fun.desformatearStNumber(costo);

    if (costo > 0 || costo != null || costo) {
      const precio = costo / this.configArticuloClass.getWinPercentCalc(configArticulos);
      const precioRounded = fun.roundToNearestMultipleOf5(precio);
      return fun.desformatearStNumber(fun.roundNumberToDecimal(precioRounded));
    }
  }

  private calculatePrecioLibra(precio) {
    precio = fun.desformatearStNumber(precio);

    const precioLibra = precio / 100;
    return fun.roundNumberToDecimal(fun.roundToNearestMultipleOf5(precioLibra));
  }

  private calculateCostoLibra(costo) {
    costo = fun.desformatearStNumber(costo);

    return fun.roundNumberToDecimal(costo / 100);
  }

  private limpiarContenidos(contenidos) {
    return contenidos.filter(contenido => fun.hasValue(contenido)).map(contenido => fun.omit(contenido, ['created_at', 'updated_at']));
  }

  private calcNewAmounts(cant, precio) {
    const pre = precio / cant;
    return fun.roundNumberToDecimal(pre);
  }

  private determinarTipoMedida(articulo, unidad, contenido_articulos) {
    if (articulo.medida === unidad) return 'principal';

    const contenidoEncontrado = contenido_articulos.find(content => content.medida === unidad);
    return contenidoEncontrado ? contenidoEncontrado.condicion : '';
  }

  private calcularCostosPorMedida(isMedida, contenido_articulos, costoRow) {
    const contenidoPadre = contenido_articulos.find(cont => cont.condicion === 'padre');
    const contenidoHijo = contenido_articulos.find(cont => cont.condicion === 'hijo');

    if (isMedida === 'padre') {
      const { costo, cantidad } = contenidoPadre;
      return { costoPrincipalCalculado: costo * cantidad, costoRowCalculado: cantidad * costoRow };
    }

    const esContenidoSimple = contenido_articulos.length === 1;
    const maxContenido = esContenidoSimple ? contenidoPadre.cantidad : contenidoPadre.cantidad * contenidoHijo.cantidad;
    const costoPrincipalCalculado = esContenidoSimple ? contenidoPadre.costo * maxContenido : contenidoHijo.costo * maxContenido;

    return { costoPrincipalCalculado, costoRowCalculado: maxContenido * costoRow };
  }
}
