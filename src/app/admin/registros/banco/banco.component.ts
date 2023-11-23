import { MixinClass } from './../../../core/typescript/MixinClass';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-banco',
  templateUrl: './banco.component.html',
  styleUrls: ['./banco.component.scss'],
})
export class BancoComponent extends MixinClass implements OnInit, OnDestroy {
  constructor() {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'banco', is_routing: true });

    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {}
}
