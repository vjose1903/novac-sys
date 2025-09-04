import { Component, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { Ss } from '@core/services/singleton.service';

@Component({
  selector: 'app-homeAdmin',
  templateUrl: './homeAdmin.component.html',
  styleUrls: ['./homeAdmin.component.scss'],
  standalone: false,
})
export class HomeAdminComponent extends MixinClass implements OnInit, OnDestroy {
  constructor() {
    super();
  }

  imgLogo;
  configServ = Ss.configServ;

  initCambioMenu(arg) {}

  cedula = null;
  ngOnInit() {
    this._init_mixin({ component: 'home', is_routing: true });

    this.imgLogo = `data:image/png;base64,${this.configServ.config.logo_empresa}`;
    this.prueba();
  }

  async prueba() {
    // new ClienteC().getAll({ afterPath: `custom/get_balances/10`, parameters: { page: 1, per_page: 20, paginado: true, factura_a_buscar: 21905 } }).then((res) => {
    // // new ClienteC().getAll({ afterPath: `custom/get_balances/10`, parameters: { page: 1, per_page: 20, paginado: true, factura_a_buscar: 219052222 } }).then((res) => {
    //   console.log('res ', res);
    // });
    // new FacturaC().getAll({ afterPath: `custom/can_update`, parameters: { id: 152 } }).then((res) => {
    //   console.log('res ', res);
    // });
    // const filter_options = { todos: '0', cliente: '1', numero_documento: '3' };
    // // const filter_value = '3';
    // const filter_value = '';
    // const params = { ant_page: null, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false };
    // const args = { campo: filter_options.todos, valor: filter_value, tipo_factura_id: 0, adelantada: false, page: params.page, per_page: params.per_page, paginado: true, tipo: tipoDocFacturacion.cotizacion, pagada: false };
    // const res = await new FacturaC().getFacturasByParams(args);
    // console.log('res ', res);
    // const extra = { afterPath: `19417`, parameters: { actual_price: true } };
    // new FacturaC().dynamic(extra).then((res) => {
    //   console.log('res ', res);
    // });
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }
}
