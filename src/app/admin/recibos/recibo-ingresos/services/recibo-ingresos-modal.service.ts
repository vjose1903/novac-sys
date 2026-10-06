import { Injectable } from '@angular/core';
import { FacturasI, tipoDocFacturacion } from '@admin/facturacion/factura';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { FormCantidadEfectivoComponent } from '@components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { ICallbackModal, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

@Injectable({
  providedIn: 'root',
})
export class ReciboIngresosModalService {
  getBuscarClienteModalConfig(nombre: string, callback: (args: ICallbackModal) => void) {
    const propietarioModalConf = new DynamicModalClass();

    propietarioModalConf.id = 'buscarCliente';
    propietarioModalConf.inputs = { metodo: 'venta', palabra_a_buscar: nombre };
    propietarioModalConf.header = 'BUSCAR CLIENTE';
    propietarioModalConf.width = '57rem';
    propietarioModalConf.height = '32rem';
    propietarioModalConf.component = BuscarClienteSuplidorComponent;
    propietarioModalConf.closableEsc = true;
    propietarioModalConf.focusOnShow = false;
    propietarioModalConf.secondDetectChanges = false;
    propietarioModalConf.transitionOptions = '0ms';
    propietarioModalConf.setCallback(callback);

    return propietarioModalConf;
  }

  getCantidadEfectivoModalConfig(total_recibo: number, callback: (args: ICallbackModal) => void) {
    const cantidadEfectivoModalConfig = new DynamicModalClass();

    cantidadEfectivoModalConfig.id = 'cambioEfectivo';
    cantidadEfectivoModalConfig.inputs = { total_factura: total_recibo, metodo: tipoDocFacturacion.recibo_ingreso, formaPago: 'Efectivo' };
    cantidadEfectivoModalConfig.header = 'Cantidad de efectivo';
    cantidadEfectivoModalConfig.width = '35rem';
    cantidadEfectivoModalConfig.component = FormCantidadEfectivoComponent;
    cantidadEfectivoModalConfig.closableEsc = true;
    cantidadEfectivoModalConfig.contentStyleClass = 'confirmation-modal-content';
    cantidadEfectivoModalConfig.styleClass = 'confirmation-dialog';
    cantidadEfectivoModalConfig.transitionOptions = '180ms cubic-bezier(0.23, 1, 0.32, 1)';
    cantidadEfectivoModalConfig.botones = [
      { clase: 'btn-light-grey', action: modalActionsE.close, label: 'Cancelar', disable: false },
      { id: 'btnConfirmar', clase: 'btn-green', functionInOtherComponent: 'btn_aceptar', label: 'Confirmar', disable: true },
    ];
    cantidadEfectivoModalConfig.setCallback(callback);

    return cantidadEfectivoModalConfig;
  }

  getFacturaModalButtons(verDetalles: (data: FacturasI) => void, factura: FacturasI) {
    return [
      { clase: 'btn btn-gris', function: (_instance: any) => verDetalles(factura), label: 'Ver detalles', disable: false as any },
      { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false as any },
    ];
  }
}
