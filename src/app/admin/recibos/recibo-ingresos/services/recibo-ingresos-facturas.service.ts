import { Injectable } from '@angular/core';
import { FacturasI } from '@admin/facturacion/factura';
import { fun } from '@core/services/functions.service';
import * as _ from 'lodash';
import moment from '../../../../core/javascript/moment';
import { MoraCalculator } from '../utils/mora-calculator';
import { ReciboIngresosCalculosService } from './recibo-ingresos-calculos.service';
import { MoraSelectorKeyI } from '../components/mora-selector/mora-selector.service';

@Injectable({
  providedIn: 'root',
})
export class ReciboIngresosFacturasService {
  constructor(private calculos: ReciboIngresosCalculosService) {}

  getBalancesParams(params: { per_page?: number; page?: number; factura_a_buscar?: any; order_by?: string }) {
    const parameters: any = { page: params.page, per_page: params.per_page, paginado: false };
    if (fun.hasValue(params.factura_a_buscar)) parameters['factura_a_buscar'] = params.factura_a_buscar;
    if (fun.hasValue(params.order_by)) parameters['order_by'] = params.order_by;
    return parameters;
  }

  mapFacturaPendiente(params: { factura: FacturasI; factura_selected?: FacturasI; factura_a_buscar?: any; porcentajeSelected: number; onFacturaABuscar?: (factura: FacturasI) => void }) {
    const { factura, factura_a_buscar, porcentajeSelected, onFacturaABuscar } = params;
    const fechaA = moment().format('YYYY-MM-DD');
    let factura_selected = params.factura_selected;

    if (fun.hasValue(factura_a_buscar) && factura.id == factura_a_buscar) {
      factura_selected = factura;
      factura_selected.monto = '0.00';
      factura_selected.pagoT = false;
      onFacturaABuscar?.(factura_selected);
    }

    factura.secuencia = _.padStart(factura.numero_factura, 8, '0');
    factura.fechaV = factura.condicion === 'Crédito' ? moment(factura.fecha_vencimiento).format('DD/MM/YYYY') : null;
    factura.select = fun.hasValue(factura_selected);
    factura.pagoT = fun.hasValue(factura_selected) ? factura_selected.pagoT : false;
    factura.pago_a_tiempo = factura.fecha_vencimiento ? factura.fecha_vencimiento > fechaA : true;
    factura.colorFecha = moment(factura.fecha_vencimiento).format('YYYY-MM-DD') < fechaA ? 'red' : 'black';
    factura.monto = fun.hasValue(factura_selected) ? fun.roundNumberToDecimal(factura_selected.monto) : '0.00';

    this.setFacturaMora(factura, factura_selected, porcentajeSelected);
    this.setFacturaIcons(factura);

    return factura;
  }

  setFacturaMora(factura: FacturasI, factura_selected: FacturasI | undefined, porcentajeSelected: number) {
    const moraCalculator = new MoraCalculator(factura);

    factura.porcentaje_mora = factura_selected?.porcentaje_mora ?? porcentajeSelected;
    factura.mora = factura_selected?.mora ?? moraCalculator.getMora({ porcentaje: porcentajeSelected });
  }

  setFacturaIcons(factura: FacturasI) {
    const modalMoviemientos = (factura.pagos ?? []).length > 0 || (factura.notas ?? []).length > 0;

    factura.tooltip_pedido = 'Modificar datos del pedido';
    factura.colorPedido = 'green';
    factura.pedido = 'fas fa-truck-moving';
    factura.tooltip_history = 'Movimientos realizados';
    factura.historyPagos = modalMoviemientos ? 'fas fa-comment-dollar' : 'far fa-comment';
    factura.colorEstado = modalMoviemientos ? 'black' : 'gris-claro';
    factura.iconHover = factura.is_viaje ? false : modalMoviemientos ? true : false;
    factura.ver = 'far fa-eye';
    factura.customStyles = {
      actions: [
        { key: 'actions', isTd: true, estilos: 'width: 6% !important; padding: 0.6rem 0rem !important' },
        { key: 'historyPagos', estilos: 'font-size: 1rem !important' },
        { key: 'pedido', estilos: 'font-size: 1rem !important' },
        { key: 'ver', estilos: 'font-size: 1rem !important' },
      ],
    };
  }

  setBalances(balances: any) {
    const totalFacturado = this.calculos.parseMonto(balances.total_facturado);
    const totalPagado = this.calculos.parseMonto(balances.abonado);
    const totalNotasCredito = this.calculos.parseMonto(balances.notas_credito);
    const totalNotasDebito = this.calculos.parseMonto(balances.notas_debito);
    const debiendoSinMora = totalFacturado + totalNotasDebito - totalPagado - totalNotasCredito;
    const porcentajePagado = totalFacturado > 0 ? ((totalPagado + totalNotasCredito) / totalFacturado) * 100 : 0;

    return {
      totalFacturado,
      totalPagado,
      totalNotasCredito,
      totalNotasDebito,
      totalPagadoPorciento: parseFloat(fun.roundNumberToDecimal(porcentajePagado)),
      debiendoSinMora,
    };
  }

  applyMoraGeneral(params: { facturas: FacturasI[]; porcentaje: number; getFacturaEnTabla: (facturaId: number) => FacturasI | null; updateSelected: (factura: FacturasI, monto: string | number, mora: string | number, porcentaje_mora: string | number) => void }) {
    return params.facturas.map(fact => {
      const factura_tabla = params.getFacturaEnTabla(fact.id);
      const moraCalculator = new MoraCalculator(fact);
      const new_mora = moraCalculator.getMora({ porcentaje: params.porcentaje });
      const new_monto = fact.select && fact.pagoT ? this.calculos.getMontoTotalFactura(fact.balance, new_mora) : fact.monto ?? '0.00';

      params.updateSelected(fact, new_monto, new_mora, params.porcentaje);

      if (fun.hasValue(factura_tabla)) {
        factura_tabla.porcentaje_mora = params.porcentaje;
        factura_tabla.mora = new_mora;
        factura_tabla.monto = new_monto;
      }

      return {
        ...fact,
        porcentaje_mora: params.porcentaje,
        mora: new_mora,
        monto: new_monto,
      };
    });
  }

  hydrateFacturaPagina(params: { item: FacturasI; factura_selected?: FacturasI; factura_from_all?: FacturasI; porcentajeSelected: number }) {
    let item = params.item;
    const { factura_selected, factura_from_all, porcentajeSelected } = params;

    if (fun.hasValue(factura_selected)) item = factura_selected;

    item.porcentaje_mora = factura_selected?.porcentaje_mora || factura_from_all?.porcentaje_mora || porcentajeSelected;
    item.mora = factura_selected?.mora ?? factura_from_all?.mora ?? new MoraCalculator(item).getMora({ porcentaje: item.porcentaje_mora });
    item.pagoT = factura_selected?.pagoT || false;
    item.monto = fun.roundNumberToDecimal(fun.desformatearStNumber(item.monto));

    return item;
  }

  updateMoraFromSelector(factura: FacturasI, data: { key: MoraSelectorKeyI; value: string | number }) {
    if (data.key == MoraSelectorKeyI.mora) {
      factura.mora = data.value;
      return factura;
    }

    factura.porcentaje_mora = data.value;
    factura.mora = new MoraCalculator(factura).getMora({ porcentaje: data.value });

    return factura;
  }
}
