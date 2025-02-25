import { DateUtils } from './../../core/typescript/date.utils';
import { Permisos } from './../../core/typescript/permisos';
import { Ss } from './../../core/services/singleton.service';
import { fun } from '../../core/services/functions.service';
import { PreFacturaClass } from './preFacturas';
import { tipoDocFacturacion } from './factura';
import { computed, effect, signal } from '@angular/core';
import { ObjectVar } from '../../core/typescript/constantes';

export class FactsLocalStorage extends PreFacturaClass {
  index_fact_archivada = signal<number | string>(0);
  sideBarTabsIndex = signal<ObjectVar<any>>({});
  triggerReload = signal<boolean>(false);

  facturas_localStorage = computed<any[]>(() => {
    this.triggerReload();
    const facturas_localStorage = FactsLocalStorage.getList().filter((item: any) => {
      return item.tipo === this.sideBarTabsIndex()[this.index_fact_archivada()];
    });

    const htmlElement = document.getElementById('btn_side_facturas');

    if (FactsLocalStorage.getList().length > 0) {
      if (fun.hasValue(htmlElement)) htmlElement.setAttribute('data-cant-facturas', FactsLocalStorage.getList().length);
    } else {
      if (fun.hasValue(htmlElement)) htmlElement.removeAttribute('data-cant-facturas');
    }

    return facturas_localStorage.sort((a, b) => fun.compare(a, b, ['archivo_id'], 'asc'));
  });

  get index_archivada() {
    return this.index_fact_archivada();
  }

  ant_event_change_visibility;
  _sideBarOpened = false;
  factura_guardada;
  actualModulo;

  sideBarTabs = [
    { key: tipoDocFacturacion.venta, label: 'facturas de venta', title: 'Venta', singleTitle: 'factura de venta', color: 'green' },
    { key: tipoDocFacturacion.compra, label: 'facturas de compra', title: 'Compra', singleTitle: 'factura de compra', color: 'yellow' },
  ];

  constructor() {
    super();
    this.setActualModulo();
    this.setVariables().then(() => {
      const initialFacturas = this.facturas_localStorage();
    });

    effect(() => {});
  }

  setActualModulo() {
    const actualPath = fun.getActualPath();

    this.actualModulo = {};

    if (actualPath.includes(tipoDocFacturacion.venta)) {
      this.actualModulo['key'] = tipoDocFacturacion.venta;
      this.actualModulo['titulo'] = 'Facturas de venta';
      //
    } else if (actualPath.includes(tipoDocFacturacion.compra)) {
      this.actualModulo['key'] = tipoDocFacturacion.compra;
      this.actualModulo['titulo'] = 'Facturas de compra';
      //
    } else if (actualPath.includes(tipoDocFacturacion.pre_venta)) {
      this.actualModulo['key'] = tipoDocFacturacion.pre_venta;
      this.actualModulo['titulo'] = 'Pre-ventas';
      //
    } else if (actualPath.includes(tipoDocFacturacion.cotizacion)) {
      this.actualModulo['key'] = tipoDocFacturacion.cotizacion;
      this.actualModulo['titulo'] = 'Cotizaciones';
    }
  }

  async setVariables() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const hasPermisoPreVenta = await Ss.permissionsService.hasPermission(Object.values(Permisos.pre_venta));
        const hasPermisoCotizacion = await Ss.permissionsService.hasPermission(Object.values(Permisos.cotizacion));

        if (hasPermisoPreVenta) fun.pushAt(this.sideBarTabs, 1, { key: tipoDocFacturacion.pre_venta, label: 'pre ventas', title: 'Pre-Venta', singleTitle: 'pre-venta', color: 'blue' });
        if (hasPermisoCotizacion) this.sideBarTabs.push({ key: tipoDocFacturacion.cotizacion, label: 'cotizaciones', title: 'Cotización', singleTitle: 'cotización', color: 'red' });

        const tempSideBarTabsIndex: ObjectVar<any> = {};
        for (let index = 0; index < this.sideBarTabs.length; index++) {
          tempSideBarTabsIndex[index] = this.sideBarTabs[index].key;
        }
        this.sideBarTabsIndex.set(tempSideBarTabsIndex);

        this.index_fact_archivada.set(Number(fun.getKeyByValue(this.sideBarTabsIndex(), this.actualModulo.key)));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  getSideBarTabByKey(key: tipoDocFacturacion) {
    return this.sideBarTabs.find(item => item.key == key);
  }

  _toggleSidebar(where?, metodo?) {
    this.index_fact_archivada.set(Number(fun.getKeyByValue(this.sideBarTabsIndex(), metodo)));

    if (where == 'visibleChange') {
      if (this.ant_event_change_visibility == 'visibleChange') {
        this._sideBarOpened = false;
        this.ant_event_change_visibility = undefined;
      } else this.ant_event_change_visibility = where;
    } else {
      this.ant_event_change_visibility = where;
      this._sideBarOpened = !this._sideBarOpened;
    }
  }

  static getList() {
    return JSON.parse(localStorage.getItem('facturas_guardadas')) || [];
  }

  static setList(facturas) {
    localStorage.removeItem('facturas_guardadas');

    facturas.map(factura => {
      factura['archivo_date'] ??= new Date();
      return factura;
    });

    localStorage.setItem('facturas_guardadas', JSON.stringify(facturas));
  }

  countCantFactSaved(tipo) {
    const array_fact = FactsLocalStorage.getList().filter((item: any) => item.tipo === tipo);
    return { disable: array_fact.length == 0, cant: array_fact.length };
  }

  reloadIndexFactArchivada() {
    this.triggerReload.set(!this.triggerReload());
  }

  quitarFacturaGuardada(archivo_id) {
    let index;
    const allFacturas = FactsLocalStorage.getList();
    
    if (archivo_id) {
      index = allFacturas.findIndex((item: any) => item.archivo_id === archivo_id);

      if (fun.hasValue(index)) {
        fun.pullAt(allFacturas, index);
        if (this.factura_guardada?.archivo_id == archivo_id) this.factura_guardada = undefined;
      }
      FactsLocalStorage.setList(allFacturas);
    }

    this.reloadIndexFactArchivada();
  }

  static verificateFacturasGuardadas() {
    const facturas = FactsLocalStorage.getList();
    if (fun.hasValue(facturas)) {
      const validFacturas = [];
      facturas.forEach(factura => {
        const timeArchivada = DateUtils.diffHours(factura.archivo_date);

        if (timeArchivada < 24) validFacturas.push(factura);
      });

      FactsLocalStorage.setList(validFacturas);
    }
  }

  openModalRemoveFactura(fact, e) {
    const confirmationObj = {
      id: 'quitar_factura',
      texto: 'Estas seguro que desea quitar esta factura de la lista.',
      header: 'Confirmación',
      siFunction: instance => {
        this.quitarFacturaGuardada(fact.archivo_id);
        instance.closeModal(instance.id, 'quitar_factura');
      },
      width: '30rem',
    };
    this.confirmationModal(confirmationObj);

    e.stopPropagation();
  }

  getNombreFacturaGuardada(fact: any) {
    let nombre = '';
    if (fact) {
      if (fact.tipo === 'venta' || fact?.tipo === 'pre_venta') nombre = fact['NoCliente_nombre'] ? fact['NoCliente_nombre'] : fact['cliente'] ? fact['cliente']['nombre'] : '';
      else if (fact['suplidor']) nombre = fact['suplidor'] ? fact['suplidor']['nombre'] : '';
    }

    return nombre;
  }
}
