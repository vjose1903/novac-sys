import { fun } from './../../../core/services/functions.service';
import { ConfiguracionEntidadCuentaI } from './../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { entidadesContables } from '../categoria-entidad-contable/categoria-entidad-contable.utils';
import { EntidadCuentaContableI, entidadCuentaContableBlank } from './cuenta-contable-form/cuenta-contable-form.utils';

@Component({
  selector: 'entidad-cuenta-contable',
  templateUrl: './entidad-cuenta-contable.component.html',
  styleUrls: ['./entidad-cuenta-contable.component.scss'],
})
export class EntidadCuentaContableComponent implements OnInit {
  activeIndex = 0;
  @Input() inputs: { configsEntCuentas: Array<ConfiguracionEntidadCuentaI>; entidad: entidadesContables };
  @Input() configuration: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } } = {};

  @Input() cuentasContablesData: EntidadCuentaContableI[] = [];
  @Output() cuentasContablesDataChange = new EventEmitter<Array<EntidadCuentaContableI>>();
  is_initialized: boolean = false;

  ngOnInit(): void {
    this.checkConfig();
    this.initEntidadCuentasContables();
  }

  checkConfig() {
    if (!fun.objHas(this.configuration, 'btn')) this.configuration.btn = {};

    if (!fun.objHas(this.configuration.btn, 'individual')) this.configuration.btn.individual = true;
    if (!fun.objHas(this.configuration.btn, 'categoria')) this.configuration.btn.categoria = true;
    if (!fun.objHas(this.configuration.btn, 'subCategoria')) this.configuration.btn.subCategoria = true;
  }

  initEntidadCuentasContables() {
    for (const config of this.inputs.configsEntCuentas) {
      let entidad_cuenta: EntidadCuentaContableI = this.cuentasContablesData.find((cuenta) => cuenta.configuracion_entidad_cuenta_id == config.id);

      if (fun.isEmpty(entidad_cuenta)) {
        entidad_cuenta = fun.duplicarJson(entidadCuentaContableBlank);
        entidad_cuenta.configuracion_entidad_cuenta_id = config.id;
        this.cuentasContablesData.push(entidad_cuenta);
      }
    }
    this.is_initialized = true;
    this.emitChanges();
  }

  getData(config_id: number) {
    let entidad_cuenta: EntidadCuentaContableI = this.cuentasContablesData.find((cuenta) => cuenta.configuracion_entidad_cuenta_id == config_id);
    return entidad_cuenta;
  }

  parseData(entidad_cuenta_contable: EntidadCuentaContableI) {
    const current_cuenta = this.cuentasContablesData.find((cuenta) => cuenta.configuracion_entidad_cuenta_id == entidad_cuenta_contable.configuracion_entidad_cuenta_id);

    if (fun.hasValue(current_cuenta)) Object.assign(current_cuenta, entidad_cuenta_contable);
    this.emitChanges();
  }

  emitChanges() {
    this.cuentasContablesDataChange.emit(this.cuentasContablesData);
  }
}
