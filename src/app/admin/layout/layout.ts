import { Subscription } from 'rxjs';
import { FunctionService } from '../../core/services/functions.service';
import { GLOBAL } from '../../core/services/GLOBAL';
import { LayoutService } from './layout.service';

export class LayoutClass {
  constructor(public layServ?: LayoutService, public fun?: FunctionService) {}

  info_cambio = {};
  ruta_a_cambiar = '';
  url_actual = '';

  subInit: Subscription;
  subDeciMenu: Subscription;

  subRefresh: Subscription;

  _init_layout() {
    this.subInit = this.layServ.INITCAMBIOMENU.subscribe((res) => {
      if (res && res.bool) {
        this.info_cambio = res;
        this.info_cambio['verificar'] = true;
        this.initCambioMenu(res);
      }
    });
  }

  initCambioMenu(arg) {}

  decisionCambioMenu() {}

  _destroy_layout() {
    if (this.subInit) {
      if (this.subInit) this.subInit.unsubscribe();
    }
  }

  cambiarItemMenu(arg) {
    this.layServ.nextCambioMenu(arg);
  }
}
