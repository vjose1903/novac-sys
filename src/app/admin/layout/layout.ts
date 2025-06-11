import { Subscription } from 'rxjs';
import { Ss } from '@core/services/singleton.service';
import { TablaClass } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';

export class LayoutClass extends TablaClass {
  constructor() {
    super();
  }

  ruta_a_cambiar = '';
  url_actual = '';

  subDeciMenu: Subscription;

  subRefresh: Subscription;

  layServ;

  private static metodos = {};
  private static lastComponentInitLayout;
  private static layoutComponent;



  _init_layout(arg) {
    this.layServ = Ss.layServ;
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
    if (refresh) {
      LayoutClass.layoutComponent = undefined;
      LayoutClass.metodos = {};
      LayoutClass.lastComponentInitLayout = undefined;
    }
  }
}
