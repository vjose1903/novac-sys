import { Injectable } from '@angular/core';
import { ConfigI } from '@core/interface/config-interface';
import { serie } from '@core/typescript/constantes';
import { FacturacionService } from '../facturacion.service';
import { tipoDocFacturacion } from '../factura';

export interface FacturacionInitialState {
  titulo: string;
  serieSelected: serie;
  fechaDefault: Date;
  modo_factura: string | null;
  condicion_fact: string;
  forma_pago: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class FacturacionStateService {
  makeInitialState(params: { tipoDocumento: tipoDocFacturacion; configApp: ConfigI; factServ: FacturacionService }): FacturacionInitialState {
    const { tipoDocumento, configApp, factServ } = params;
    const fechaDefault = new Date();
    const useNormalSerie = [factServ.isCotizacion(), factServ.isPreVenta()].some(condition => condition);

    return {
      titulo: this.getTitulo(tipoDocumento),
      serieSelected: useNormalSerie || configApp.usa_facturacion_electronica !== true ? serie.normal : configApp.serie_default,
      fechaDefault,
      modo_factura: this.getModoFacturaInicial(tipoDocumento),
      condicion_fact: this.getCondicionInicial(tipoDocumento),
      forma_pago: this.getFormaPagoInicial(tipoDocumento),
    };
  }

  getInitialPropietario(params: { tipoDocumento: tipoDocFacturacion; factServ: FacturacionService }) {
    const { tipoDocumento, factServ } = params;

    if (tipoDocumento === tipoDocFacturacion.venta) {
      return { ...factServ.clienteContado, documento_identidad: null, documento_identidad_tipo: null, NoCliente_rnc: null };
    }

    return null;
  }

  private getTitulo(tipoDocumento: tipoDocFacturacion): string {
    const titulos = {
      [tipoDocFacturacion.venta]: 'Factura de venta',
      [tipoDocFacturacion.compra]: 'Factura de compra',
      [tipoDocFacturacion.pre_venta]: 'Pre factura',
      [tipoDocFacturacion.cotizacion]: 'Cotización',
    };

    return titulos[tipoDocumento];
  }

  private getModoFacturaInicial(tipoDocumento: tipoDocFacturacion): string | null {
    if (tipoDocumento === tipoDocFacturacion.pre_venta) return tipoDocFacturacion.pre_venta;
    if (tipoDocumento === tipoDocFacturacion.cotizacion) return null;

    return 'normal';
  }

  private getCondicionInicial(tipoDocumento: tipoDocFacturacion): string {
    if (tipoDocumento === tipoDocFacturacion.pre_venta || tipoDocumento === tipoDocFacturacion.cotizacion) return 'Crédito';

    return 'Contado';
  }

  private getFormaPagoInicial(tipoDocumento: tipoDocFacturacion): string | null {
    if (tipoDocumento === tipoDocFacturacion.cotizacion || tipoDocumento === tipoDocFacturacion.pre_venta) return null;

    return 'Efectivo';
  }
}
