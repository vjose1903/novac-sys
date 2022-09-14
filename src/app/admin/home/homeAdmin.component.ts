import { Component, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '../../core/typescript/MixinClass';
import { SingletonService } from '../../core/services/singleton.service';
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
  configServ = SingletonService.configServ;

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
