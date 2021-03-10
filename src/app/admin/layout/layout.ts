import { Subscription } from 'rxjs';
import { GLOBAL } from '../../core/services/GLOBAL';
import { myElectron } from '../../core/services/electron';
import { LayoutService } from './layout.service';

export class LayoutClass extends myElectron {
  constructor(public layServ?: LayoutService) {
    super();
  }

  public facturaGuardada: any = undefined;
  info_cambio = {};
  ruta_a_cambiar = '';
  url_actual = '';

  subInit: Subscription;
  subDeciMenu: Subscription;
  subFactG: Subscription;
  subRefresh: Subscription;

  _init_layout() {
    this.subInit = this.layServ.INITCAMBIOMENU.subscribe((res) => {
      if (res && res.bool) {
        this.info_cambio = res;
        this.info_cambio['verificar'] = true;
        this.initCambioMenu(res);
      }
    });

    const temp_url = document.location.href.split('admin/');
    if (temp_url[1]) {
      this.url_actual = temp_url[1].split('/')[0];

      if (this.url_actual === 'factura') {
        this.subFactG = this.layServ.FACTURAGUARDADA.subscribe((fact) => {
          if (fact) {
            this.rellenarFacturaGuardada((res) => {
              if (res) {
                this.facturaGuardada = fact;
                this.layServ.factura_guardada = GLOBAL.duplicarJson(fact);
              }
            });

            this.layServ.nextFacturaGuardada(undefined);
          }
        });
      }
    }
  }

  rellenarFacturaGuardada(callback = (arg) => {}) {}
  initCambioMenu(arg) {}

  decisionCambioMenu() {}

  _destroy_layout() {
    if (this.subInit) {
      if (this.subInit) this.subInit.unsubscribe();

      if (this.url_actual === 'factura' && this.subFactG) this.subFactG.unsubscribe();
    }
  }

  cambiarItemMenu(arg) {
    this.layServ.nextCambioMenu(arg);
  }
}
