import { fun } from './../../../core/services/functions.service';
import { ConfiguracionEntidadCuentaI } from './../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { Component, Input, OnInit } from '@angular/core';
import { entidadesContables } from '../categoria-entidad-contable/categoria-entidad-contable.utils';

@Component({
  selector: 'entidad-cuenta-contable',
  templateUrl: './entidad-cuenta-contable.component.html',
  styleUrls: ['./entidad-cuenta-contable.component.scss'],
})
export class EntidadCuentaContableComponent implements OnInit {
  activeIndex = 0;
  @Input() inputs: { configsEntCuentas: Array<ConfiguracionEntidadCuentaI>; entidad: entidadesContables };
  @Input() configuration: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } } = {};

  ngOnInit(): void {
    fun.logOrange('this.configuration ', this.configuration);

    this.checkConfig();
  }

  checkConfig() {
    if (!fun.objHas(this.configuration, 'btn')) this.configuration.btn = {};

    if (!fun.objHas(this.configuration.btn, 'btnIndividual')) this.configuration.btn.individual = true;
    if (!fun.objHas(this.configuration.btn, 'btnCategoria')) this.configuration.btn.categoria = true;
    if (!fun.objHas(this.configuration.btn, 'btnSubCategoria')) this.configuration.btn.subCategoria = true;
  }
}
