import { Component, OnDestroy, OnInit } from '@angular/core';
import { GLOBAL } from '../../core/typescript/GLOBAL';
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

  cedula = null;
  ngOnInit() {
    console.log('======== INICIO EL HOME COMPONENT ======== ');

    this._init_mixin({ component: 'home' });

    this.configServ.getConfig().then((config: ConfigI) => {
      this.imgLogo = `data:image/png;base64,${config.logo_empresa}`;
    });
  }

  iniciarCambioMenu(arg, callback) {
    console.log('~~~~~~ iniciarCambioMenu ~~~~~~');

    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }
}
