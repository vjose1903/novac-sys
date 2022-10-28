import { Permisos } from './../../core/typescript/permisos';
import { SingletonService } from './../../core/services/singleton.service';
import { FacturacionService } from './facturacion.service';
import * as _ from 'lodash';
import { fun } from '../../core/services/functions.service';
import { PreFacturaClass } from './preFacturas';
import { tipoDocFacturacion } from './factura';

export class FactsLocalStorage extends PreFacturaClass {
  constructor() {
    super();

    this.setActualModulo();
    this.setVariables();
  }

  ant_event_change_visibility;
  _sideBarOpened = false;
  index_fact_archivada = 0;
  facturas_localStorage: any;
  factura_guardada;
  actualModulo;

  sideBarTabs = [
    { key: tipoDocFacturacion.venta, label: 'facturas de venta', title: 'Venta', singleTitle: 'factura de venta', color: 'green' },
    { key: tipoDocFacturacion.compra, label: 'facturas de compra', title: 'Compra', singleTitle: 'factura de compra', color: 'yellow' },
  ];
  sideBarTabsIndex = {};

  setActualModulo() {
    const actualPath = fun.getActualPath();
    this.actualModulo = {};

    if (actualPath.includes(tipoDocFacturacion.pre_venta)) {
      this.actualModulo['key'] = tipoDocFacturacion.pre_venta;
      this.actualModulo['titulo'] = 'Pre-ventas';
    }
    if (actualPath.includes(tipoDocFacturacion.venta)) {
      this.actualModulo['key'] = tipoDocFacturacion.venta;
      this.actualModulo['titulo'] = 'Facturas de venta';
    }
    if (actualPath.includes(tipoDocFacturacion.compra)) {
      this.actualModulo['key'] = tipoDocFacturacion.compra;
      this.actualModulo['titulo'] = 'Facturas de compra';
    }
    if (actualPath.includes(tipoDocFacturacion.cotizacion)) {
      this.actualModulo['key'] = tipoDocFacturacion.cotizacion;
      this.actualModulo['titulo'] = 'Cotizaciones';
    }
  }

  async setVariables() {
    const hasPermisoPreVenta = await SingletonService.permissionsService.hasPermission(Object.values(Permisos.pre_venta));
    const hasPermisoCotizacion = await SingletonService.permissionsService.hasPermission(Object.values(Permisos.cotizacion));

    if (hasPermisoPreVenta) fun.pushAt(this.sideBarTabs, 1, { key: tipoDocFacturacion.pre_venta, label: 'pre ventas', title: 'Pre-Venta', singleTitle: 'pre-venta', color: 'blue' });
    if (hasPermisoCotizacion) this.sideBarTabs.push({ key: tipoDocFacturacion.cotizacion, label: 'cotizaciones', title: 'Cotización', singleTitle: 'cotización', color: 'red' });

    for (let index = 0; index < this.sideBarTabs.length; index++) {
      this.sideBarTabsIndex[index] = this.sideBarTabs[index].key;
    }
    this.index_fact_archivada = fun.getKeyByValue(this.sideBarTabsIndex, this.actualModulo['key']);
  }

  getSideBarTabByKey(key: tipoDocFacturacion) {
    return _.find(this.sideBarTabs, { key: key });
  }

  _toggleSidebar(where?, metodo?) {
    this.index_fact_archivada = fun.getKeyByValue(this.sideBarTabsIndex, metodo);

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
    return { disable: array_fact.length == 0, cant: array_fact.length };
  }

  clickTabView(tabIndex) {
    this.index_fact_archivada = tabIndex;
    this.getFacturasGuardadas();
  }

  async getFacturasGuardadas() {
    this.facturas_localStorage = fun.getFacturasguardadas();

    this.facturas_localStorage = _.filter(this.facturas_localStorage, (item: any) => item.tipo === this.sideBarTabsIndex[this.index_fact_archivada]);

    setTimeout(async () => {
      const htmlElement = document.getElementById('btn_side_facturas');
      if (this.facturas_localStorage.length > 0) {
        if (fun.hasValue(htmlElement)) htmlElement.setAttribute('data-cant-facturas', this.facturas_localStorage.length);

        this.facturas_localStorage = _.orderBy(this.facturas_localStorage, ['archivo_id'], ['asc']);
      } else {
        if (fun.hasValue(htmlElement)) htmlElement.removeAttribute('data-cant-facturas');
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
