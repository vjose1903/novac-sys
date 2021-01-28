import { Subscription } from 'rxjs';
import { myElectron } from '../../core/services/electron';
import { LayoutService } from './layout.service';

export class LayoutClass extends myElectron {
  constructor(public layServ?: LayoutService) {
    super();
  }

  cambioMenu_ = false;
  seCambiara_ = false;
  ruta_a_cambiar = '';

  subInit: Subscription;
  subDeciMenu: Subscription;

  _init_layout() {
    console.log(' ');
    console.log(' -------iniciando el layout class -------');
    console.log(' ');

    this.subInit = this.layServ.INITCAMBIOMENU.subscribe((res) => {
      this.cambioMenu_ = res;
      if (res) {
        this.initCambioMenu();
      }
    });
  }

  initCambioMenu() {}

  decisionCambioMenu() {}

  _destroy_layout() {
    this.subInit.unsubscribe();
  }

  cambiarItemMenu(arg) {
    this.layServ.nextCambioMenu(arg);
  }
}
