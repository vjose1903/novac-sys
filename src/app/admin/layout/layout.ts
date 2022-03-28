import { Subscription } from 'rxjs';
import { SingletonService } from '../../core/services/singleton.service';
import * as _ from 'lodash';
export class LayoutClass {
  constructor() {}

  ruta_a_cambiar = '';
  url_actual = '';

  subInit: Subscription;
  subDeciMenu: Subscription;

  subRefresh: Subscription;

  layServ;

  private static metodos = {};
  private static lastComponentInitLayout;
  private static layoutComponent;
  fun = SingletonService.fun;
  _init_layout(arg) {
    this.layServ = SingletonService.layServ;
    if (arg.component == 'layout') LayoutClass.layoutComponent ||= this;

    if (arg.component != 'layout' && arg.is_routing) {
      LayoutClass.metodos[arg.component] = this;
      LayoutClass.lastComponentInitLayout = arg.component;
    }
  }

  runRouterNavigate(arg) {
    if (arg && arg.bool) {
      const tempLastComponent = LayoutClass.lastComponentInitLayout;

      LayoutClass.metodos[tempLastComponent].iniciarCambioMenu(arg, (callback) => {
        if (callback.bool) delete LayoutClass.metodos[tempLastComponent];
      });
    }
  }

  iniciarCambioMenu(arg, callback = (arg) => {}) {}

  runFinalizarCambioMenu(arg) {
    LayoutClass.layoutComponent.finalizarCambioMenu(arg);
  }

  _destroy_layout(refresh = false) {
    if (this.subInit) {
      if (this.subInit) this.subInit.unsubscribe();
    }

    if (refresh) {
      LayoutClass.layoutComponent = undefined;
      LayoutClass.metodos = {};
      LayoutClass.lastComponentInitLayout = undefined;
    }
  }
}
