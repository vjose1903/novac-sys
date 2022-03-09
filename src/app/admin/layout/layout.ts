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

  private static metodos = {};
  private static lastComponentInitLayout;

  _init_layout(componente) {
    this.layServ = SingletonService.layServ;
    console.log('AGREGANDO AL OBJETO DE METODOS: ', componente);
    LayoutClass.metodos[componente] = this;
    LayoutClass.lastComponentInitLayout = componente;
    console.log('LayoutClass.metodos: ', LayoutClass.metodos);
  }

  runRouterNavigate(arg) {
    if (arg && arg.bool) {
      this.info_cambio = arg;
      this.info_cambio['verificar'] = true;
      this.info_cambio['componente'] = LayoutClass.lastComponentInitLayout;
      const tempLastComponent = LayoutClass.lastComponentInitLayout;

      console.log('tempLastComponent ', tempLastComponent);
      console.log('LayoutClass.metodos ', LayoutClass.metodos);
      LayoutClass.metodos[LayoutClass.lastComponentInitLayout].iniciarCambioMenu(arg, (callback) => {
        console.log('= = = = = luego del cambio del menu = = = = = ');
        console.log('BORRANDO DEL OBJETO DE METODOS: ', tempLastComponent);
        if (callback.bool) delete LayoutClass.metodos[tempLastComponent];
      });
    }
  }

  iniciarCambioMenu(arg, callback = (arg) => {}) {}

  decisionCambioMenu() {}

  _destroy_layout() {
    if (this.subInit) {
      if (this.subInit) this.subInit.unsubscribe();
    }
  }
}
