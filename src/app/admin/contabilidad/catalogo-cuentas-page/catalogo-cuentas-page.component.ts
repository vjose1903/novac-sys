import { MixinClass } from './../../../core/typescript/MixinClass';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-catalogo-cuentas-page',
  templateUrl: './catalogo-cuentas-page.component.html',
  styleUrls: ['./catalogo-cuentas-page.component.scss'],
})
export class CatalogoCuentasPageComponent extends MixinClass implements OnInit, OnDestroy {
  ngOnInit() {
    this._init_mixin({ component: 'catalogo_cuentas_page', is_routing: true });
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }
}
