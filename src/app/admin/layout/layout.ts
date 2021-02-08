import { Subscription } from 'rxjs';
import { myElectron } from '../../core/services/electron';
import { LayoutService } from './layout.service';

export class LayoutClass extends myElectron {
  constructor(public layServ?: LayoutService) {
    super();
  }

  facturaGuardada = {};
  info_cambio = {};
  ruta_a_cambiar = '';
  url_actual = '';

  subInit: Subscription;
  subDeciMenu: Subscription;
  subFactG: Subscription;

  _init_layout() {
    this.subInit = this.layServ.INITCAMBIOMENU.subscribe((res) => {
      if (res && res.bool) {
        console.log('Inicio del proceso de cambiar');

        this.info_cambio = res;
        this.info_cambio['verificar'] = true;
        this.initCambioMenu(res);
      }
    });

    const temp_url = document.location.href.split('admin/');
    if (temp_url[1]) {
      this.url_actual = temp_url[1].split('/')[0];

      if (this.url_actual === 'factura') {
        console.log('------ estoy en facturacion ------ ');

        this.subFactG = this.layServ.FACTURAGUARDADA.subscribe((res) => {
          if (res) {
            this.facturaGuardada = res;
            this.rellenarFacturaGuardada();
          }
        });
      }
    }
  }

  rellenarFacturaGuardada() {}
  initCambioMenu(arg) {}

  decisionCambioMenu() {}

  _destroy_layout() {
    console.log('this.subInit --> ', this.subInit);
    console.log('this.subFactG --> ', this.subFactG);
    console.log('this.url_actual --> ', this.url_actual);

    if (this.subInit) {
      this.subInit.unsubscribe();
      if (this.url_actual === 'factura') this.subFactG.unsubscribe();
    }
  }

  cambiarItemMenu(arg) {
    this.layServ.nextCambioMenu(arg);
  }
}
