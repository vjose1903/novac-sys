import { Injectable } from '@angular/core';
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { fun } from '@core/services/functions.service';
import { serie } from '@core/typescript/constantes';
import { tFacturaKey } from '../factura';

type FacturacionExternalFlowContext = {
  is_external: boolean;
  condicion_fact: string;
  modo_factura: string;
  is_viaje: boolean;
  is_adelantada: boolean;
  movimientosSelected: any[];
  dynamicModalServ: any;
  factServ: any;
  cuerpo: {
    seleccionarCampoEnTurno(): void;
  };
  checkIfFacturacionEnProceso(): boolean;
  resetVariables(): Promise<void>;
  validarClienteCasualPermitido(): boolean;
};

@Injectable({
  providedIn: 'root',
})
export class FacturacionExternalFlowService {
  requestExternalFactura(ctx: FacturacionExternalFlowContext): void {
    if (!ctx.checkIfFacturacionEnProceso()) {
      this.startNewExternalFactura(ctx);
      return;
    }

    ctx.dynamicModalServ.confirmationModal({
      id: 'confirm_factura_external',
      header: 'Comprobante especial',
      texto: 'Ya existe una factura en proceso. ¿Desea preparar esta venta como comprobante especial?',
      btnKind: confirmationButtons.cancelarNuevaCopiar,
      width: '34rem',
      onNo: () => this.startNewExternalFactura(ctx),
      onYes: async () => this.copyCurrentToExternalFactura(ctx),
    });
  }

  async startNewExternalFactura(ctx: FacturacionExternalFlowContext): Promise<void> {
    await ctx.resetVariables();
    await this.activateExternalState(ctx);
    fun.setTimeout(() => fun.enfocarInput('nom'), 10);
  }

  async copyCurrentToExternalFactura(ctx: FacturacionExternalFlowContext): Promise<void> {
    await this.activateExternalState(ctx);
    fun.setTimeout(() => ctx.cuerpo.seleccionarCampoEnTurno(), 10);
  }

  deactivateExternalState(ctx: FacturacionExternalFlowContext): void {
    ctx.is_external = false;
  }

  async activateExternalState(ctx: FacturacionExternalFlowContext): Promise<void> {
    ctx.is_external = true;
    ctx.condicion_fact = 'Contado';
    ctx.modo_factura = 'normal';
    ctx.is_viaje = false;
    ctx.is_adelantada = false;
    ctx.movimientosSelected = [];
    ctx.factServ.serieType.set(serie.normal);
    await ctx.factServ.setTipoFacturaSelected({ value: tFacturaKey.factura_sin_comprobante, by: 'key' });
    if (fun.isEmpty(ctx.factServ.tipoFactura)) {
      ctx.factServ.tipoFactura = ctx.factServ.lista_tipos_facturas.find(tipoFactura => tipoFactura.key === tFacturaKey.factura_sin_comprobante);
      ctx.factServ.tipoFacturaReferenciaSelected = ctx.factServ.tipoFactura?.referencia;
    }
    ctx.validarClienteCasualPermitido();
  }
}
