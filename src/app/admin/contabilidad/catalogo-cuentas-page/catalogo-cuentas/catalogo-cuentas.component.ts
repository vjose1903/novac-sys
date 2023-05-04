import { MixinClass } from './../../../../core/typescript/MixinClass';
import { CuentaContableC } from './../cuentas_contables';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'catalogo-cuentas',
  templateUrl: './catalogo-cuentas.component.html',
  styleUrls: ['./catalogo-cuentas.component.scss'],
})
export class CatalogoCuentasComponent extends MixinClass implements OnInit {
  cuentaContableClass = new CuentaContableC();

  ngOnInit() {}

  necesarioStart() {}
}
