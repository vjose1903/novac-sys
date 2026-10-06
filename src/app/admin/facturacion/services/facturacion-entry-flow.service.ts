import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { actionFacturacion, tipoDocFacturacion } from '../factura';

type FacturacionEntryContext = {
  id_documento: any;
  factServ: any;
  validatePermisos(): Promise<any>;
  rellenarVariables(): Promise<void>;
  makeOptionsExtra(): void;
  getConfiguracionArticulo(): void;
  procesoRelleno(factura: any): Promise<void>;
  abrirModalPropietario(): void;
  cuerpo: {
    rellenarVariables(): Promise<boolean>;
  };
  is_editando: boolean;
  rellenando_factura_archivada: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class FacturacionEntryFlowService {
  async enter(ctx: FacturacionEntryContext): Promise<void> {
    await ctx.validatePermisos();

    ctx.makeOptionsExtra();
    ctx.getConfiguracionArticulo();

    await ctx.rellenarVariables();
    await ctx.cuerpo.rellenarVariables();

    await this.runActionFlow(ctx);
  }

  private async runActionFlow(ctx: FacturacionEntryContext): Promise<void> {
    switch (ctx.factServ.action) {
      case actionFacturacion.update:
        ctx.is_editando = true;
        await ctx.procesoRelleno({ id: ctx.id_documento, tipo: ctx.factServ.tipoDocumento(), action: actionFacturacion.update });
        return;

      case actionFacturacion.bill_from_cotizacion:
        await ctx.procesoRelleno({ id: ctx.id_documento, tipo: tipoDocFacturacion.venta, action: actionFacturacion.bill_from_cotizacion });
        return;

      case actionFacturacion.bill_from_pre_venta:
        await ctx.procesoRelleno({ id: ctx.id_documento, tipo: tipoDocFacturacion.venta, action: actionFacturacion.bill_from_pre_venta });
        return;

      case actionFacturacion.duplicate:
        await ctx.procesoRelleno({ id: ctx.id_documento, tipo: ctx.factServ.tipoDocumento(), action: actionFacturacion.duplicate });
        ctx.abrirModalPropietario();
        return;

      default:
        this.focusNewInvoiceStart(ctx);
        return;
    }
  }

  private focusNewInvoiceStart(ctx: FacturacionEntryContext): void {
    fun.setTimeout(() => {
      if (ctx.rellenando_factura_archivada) return;
      if (ctx.factServ.isPreVenta() || ctx.factServ.isCotizacion()) ctx.abrirModalPropietario();
      else fun.enfocarInput('tipoFact');
    }, 5);
  }
}
