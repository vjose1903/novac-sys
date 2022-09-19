import * as _ from 'lodash';
import { fun } from '../../core/services/functions.service';
import { PreFacturaClass } from './preFacturas';

export class FactsLocalStorage extends PreFacturaClass {
  constructor() {
    super();
  }

  ant_event_change_visibility;
  _sideBarOpened = false;
  index_fact_archivada = 0;
  facturas_localStorage: any;
  factura_guardada;

  _toggleSidebar(where?, tipo_factura?) {
    this.index_fact_archivada = tipo_factura == 'venta' ? 0 : tipo_factura == 'pre_venta' ? 1 : 2;

    if (where == 'visibleChange') {
      if (this.ant_event_change_visibility == 'visibleChange') {
        this._sideBarOpened = false;
        this.ant_event_change_visibility = undefined;
      } else this.ant_event_change_visibility = where;
    } else {
      this.ant_event_change_visibility = where;
      this._sideBarOpened = !this._sideBarOpened;
      if (this._sideBarOpened) this.getFacturasGuardadas();
    }
  }

  countCantFactSaved(tipo) {
    const array_fact = _.filter(fun.getFacturasguardadas(), (item: any) => item.tipo === tipo);
    return { disable: array_fact.length === 0, cant: array_fact.length };
  }

  clickTabView(tabIndex) {
    this.index_fact_archivada = tabIndex;
    // const can = !this.countCantFactSaved(obj[tabIndex]).disable;
    this.getFacturasGuardadas();
  }

  async getFacturasGuardadas() {
    const obj = { 0: 'venta', 1: 'pre_venta', 2: 'compra' };
    this.facturas_localStorage = fun.getFacturasguardadas();

    this.facturas_localStorage = _.filter(this.facturas_localStorage, (item: any) => item.tipo === obj[this.index_fact_archivada]);

    setTimeout(async () => {
      if (this.facturas_localStorage.length > 0) {
        document.getElementById('btn_side_facturas').setAttribute('data-cant-facturas', this.facturas_localStorage.length);

        this.facturas_localStorage = _.orderBy(this.facturas_localStorage, ['archivo_id'], ['asc']);
      } else {
        document.getElementById('btn_side_facturas').removeAttribute('data-cant-facturas');
      }
    }, 20);
  }

  quitarFacturaGuardada(archivo_id) {
    let index;
    const allFacturas = fun.getFacturasguardadas();
    if (archivo_id) {
      if (this.factura_guardada?.archivo_id == archivo_id) this.factura_guardada = undefined;
      index = _.findIndex(allFacturas, (item: any) => item.archivo_id === archivo_id);

      _.pullAt(allFacturas, index);

      fun.setFacturasGuardadas(allFacturas);

      this.getFacturasGuardadas();
    }
  }

  abrirModalFacturaGuardada(fact, e) {
    const confirmationObj = {
      id: 'quitar_factura',
      texto: 'Estas seguro que desea quitar esta factura de la lista.',
      header: 'Confirmación',
      siFunction: (instance) => {
        this.quitarFacturaGuardada(fact.archivo_id);
        instance.closeModal(instance.id, 'quitar_factura');
      },
      width: '30rem',
    };
    this.confirmationModal(confirmationObj);

    e.stopPropagation();
  }

  confirmationModal(obj) {}

  getNombreFacturaGuardada(fact: any) {
    let nombre = '';
    if (fact) {
      if (fact.tipo === 'venta' || fact?.tipo === 'pre_venta') nombre = fact['NoCliente_nombre'] ? fact['NoCliente_nombre'] : fact['cliente'] ? fact['cliente']['nombre'] : '';
      else if (fact['suplidor']) nombre = fact['suplidor'] ? fact['suplidor']['nombre'] : '';
    }

    return nombre;
  }
}
