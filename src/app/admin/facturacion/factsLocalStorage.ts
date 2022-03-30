import * as _ from 'lodash';
import { SingletonService } from '../../core/services/singleton.service';
import { MixinClass } from '../../core/typescript/MixinClass';

export class FactsLocalStorage extends MixinClass {
  constructor() {
    super();
  }

  ant_event_change_visibility;
  _sideBarOpened = false;
  activeIndex = 0;
  facturas_localStorage: any;

  _toggleSidebar(where?, tipo_factura?) {
    this.activeIndex = tipo_factura === 'venta' ? 0 : 1;

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
    const array_fact = _.filter(this.fun.getFacturasguardadas(), (o: any) => o.tipo === tipo);
    return { disable: array_fact.length === 0, cant: array_fact.length };
  }

  clickTabView(tabIndex) {
    this.activeIndex = tabIndex;
    // const can = !this.countCantFactSaved(obj[tabIndex]).disable;
    this.getFacturasGuardadas();
  }

  async getFacturasGuardadas() {
    const obj = { 0: 'venta', 1: 'compra' };
    console.log('🚀 ~ FactsLocalStorage ~ getFacturasGuardadas ~ getFacturasGuardadas');
    this.facturas_localStorage = this.fun.getFacturasguardadas();

    this.facturas_localStorage = _.filter(this.facturas_localStorage, (o: any) => o.tipo === obj[this.activeIndex]);
    console.log('🚀 ~ FactsLocalStorage ~ getFacturasGuardadas ~ this.facturas_localStorage', this.facturas_localStorage);

    setTimeout(async () => {
      if (this.facturas_localStorage.length > 0) {
        document.getElementById('btn_side_facturas').setAttribute('data-cant-facturas', this.facturas_localStorage.length);

        this.facturas_localStorage = _.orderBy(this.facturas_localStorage, ['archivo_id'], ['asc']);
      } else {
        document.getElementById('btn_side_facturas').removeAttribute('data-cant-facturas');
      }
    }, 20);
  }

  quitarFacturaGuardada(params?) {
    const fact = params.body;
    let index;
    const allFacturas = this.fun.getFacturasguardadas();

    if (fact) index = _.findIndex(allFacturas, (o: any) => o.archivo_id === fact?.archivo_id);

    _.pullAt(allFacturas, index);

    this.fun.setFacturasGuardadas(allFacturas);

    // if (params && params.quien_llamo !== 'layout') {
    //   this.layServ.nextSacar({ quien_llamo: 'layout', body: this.layServ.factura_guardada });
    // }
    this.getFacturasGuardadas();
  }

  abrirModalFacturaGuardada(fact, e) {
    const obj = { texto_modal: 'Estas seguro que desea quitar esta factura de la lista.', archivo_id: fact.archivo_id };
    const confirmationObj = {
      id: 'quitar_factura',
      texto: obj.texto_modal,
      header: 'Confirmación',
      siFunction: (instance) => {
        this.quitarFacturaGuardada({ body: { archivo_id: obj.archivo_id } });
        instance.closeModal(instance.id, 'quitar_factura');
      },
      width: '30rem',
    };
    this.confirmationModal(confirmationObj);

    e.stopPropagation();
  }
  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
    this.handleModalForm({
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p>
      ${obj.texto}
    </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance, obj.id), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => obj.siFunction(instance),
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }

  getNombreFacturaGuardada(fact: any) {
    let nombre = '';
    if (fact) {
      if (fact.tipo === 'venta') nombre = fact['NoCliente_nombre'] ? fact['NoCliente_nombre'] : fact['cliente'] ? fact['cliente']['nombre'] : '';
      else if (fact['suplidor']) nombre = fact['suplidor'] ? fact['suplidor']['nombre'] : '';
    }

    return nombre;
  }
}
