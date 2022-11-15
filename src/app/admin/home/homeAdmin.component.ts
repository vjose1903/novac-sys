import { FacturaC, tipoDocFacturacion } from './../facturacion/factura';
import { fun } from './../../core/services/functions.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '../../core/typescript/MixinClass';
import { Ss } from '../../core/services/singleton.service';
import { ConfigI } from '../../core/typescript/config-interface';

@Component({
  selector: 'app-homeAdmin',
  templateUrl: './homeAdmin.component.html',
  styleUrls: ['./homeAdmin.component.scss'],
})
export class HomeAdminComponent extends MixinClass implements OnInit, OnDestroy {
  constructor() {
    super();
  }

  imgLogo;
  configServ = Ss.configServ;

  initCambioMenu(arg) {
    if (arg.bool) this.runFinalizarCambioMenu(arg);
  }

  cedula = null;
  ngOnInit() {
    this._init_mixin({ component: 'home', is_routing: true });

    this.configServ.getConfig().then((config: ConfigI) => {
      this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
    });
  }

  async prueba() {
    const filter_options = { todos: '0', cliente: '1', numero_documento: '3' };
    // const filter_value = '3';
    const filter_value = '';
    const params = { ant_page: null, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false };

    const args = { campo: filter_options.todos, valor: filter_value, tipo_factura_id: 0, adelantada: false, page: params.page, per_page: params.per_page, paginado: true, fact_de: tipoDocFacturacion.cotizacion, pagada: false };

    const res = await new FacturaC().getFacturasByParams(args);
    console.log('res ', res);

    // const extra = { afterPath: `19417`, parameters: { actual_price: true } };
    // new FacturaC().dynamic(extra).then((res) => {
    //   console.log('res ', res);
    // });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }
}
