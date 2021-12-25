import { Subscription } from 'rxjs';
import { SingletonService } from '../../core/services/singleton.service';


export class LayoutClass {
  constructor() {}

  info_cambio = {};
  ruta_a_cambiar = '';
  url_actual = '';

  subInit: Subscription;
  subDeciMenu: Subscription;

  subRefresh: Subscription;

  layServ;
  _init_layout() {
    this.layServ = SingletonService.layServ;

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
