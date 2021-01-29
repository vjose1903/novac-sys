import { Subscription } from 'rxjs';
import { myElectron } from '../../core/services/electron';
import { LayoutService } from './layout.service';

export class LayoutClass extends myElectron {
  constructor(public layServ?: LayoutService) {
    super();
  }

  info_cambio = {};
  ruta_a_cambiar = '';

  subInit: Subscription;
  subDeciMenu: Subscription;

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
      this.subInit.unsubscribe();
    }
  }

  cambiarItemMenu(arg) {
    this.layServ.nextCambioMenu(arg);
  }
}
