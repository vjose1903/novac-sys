import { fun } from './../../../core/services/functions.service';
import { ConfiguracionEntidadCuentaI } from './../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { entidadesContables } from '../categoria-entidad-contable/categoria-entidad-contable.utils';
import { EntidadCuentaContableI, FormEntidadCuentaContableI, entidadCuentaContableBlank } from './cuenta-contable-form/cuenta-contable-form.utils';
import { TipoArticuloI } from '../../registros/articulos/tipo-articulo/tipo-articulo';
import { SubTipoArticuloI } from '../../registros/articulos/tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';

@Component({
  selector: 'entidad-cuenta-contable',
  templateUrl: './entidad-cuenta-contable.component.html',
  styleUrls: ['./entidad-cuenta-contable.component.scss'],
})
export class EntidadCuentaContableComponent implements OnInit, OnChanges {
  activeIndex = 0;
  @Input() inputs: { configsEntCuentas: Array<ConfiguracionEntidadCuentaI>; entidad: entidadesContables };
  @Input() configuration: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } } = {};
  @Input() camposDisabled: boolean = false;
  @Input() infoTipoArticulo: { categoria?: TipoArticuloI; sub_categoria?: SubTipoArticuloI };

  @Input() cuentasContablesDataCruda: EntidadCuentaContableI[] = [];

  @Input() cuentasContablesData: FormEntidadCuentaContableI[] = [];
  @Output() cuentasContablesDataChange = new EventEmitter<Array<FormEntidadCuentaContableI>>();
  is_initialized: boolean = false;
  fun = fun;
  ngOnInit(): void {
    this.checkConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (fun.objHas(changes, 'cuentasContablesData')) {
      this.is_initialized = false;
      this.initEntidadCuentasContables();
    }

    if (fun.objHas(changes, 'inputs')) this.initEntidadCuentasContables();
    if (fun.objHas(changes, 'configuration')) this.checkConfig();
  }

  checkConfig() {
    if (!fun.objHas(this.configuration, 'btn')) this.configuration.btn = {};

    if (!fun.objHas(this.configuration.btn, 'individual')) this.configuration.btn.individual = true;
    if (!fun.objHas(this.configuration.btn, 'categoria')) this.configuration.btn.categoria = true;
    if (!fun.objHas(this.configuration.btn, 'subCategoria')) this.configuration.btn.subCategoria = true;
  }

  initEntidadCuentasContables() {
    for (const config of this.inputs.configsEntCuentas) {
      let entidad_cuenta: FormEntidadCuentaContableI = this.cuentasContablesData?.find((cuenta) => cuenta.configuracion_entidad_cuenta_id == config.id);

      if (fun.isEmpty(entidad_cuenta)) {
        entidad_cuenta = fun.deepCloning(entidadCuentaContableBlank);
        entidad_cuenta.configuracion_entidad_cuenta_id = config.id;

        this.cuentasContablesData.push(entidad_cuenta);
      }
    }

    const ids_current_configs = this.inputs.configsEntCuentas.map((config) => config.id);
    this.cuentasContablesData = this.cuentasContablesData.filter((cuenta) => ids_current_configs.includes(cuenta.configuracion_entidad_cuenta_id));

    this.is_initialized = true;
    this.emitChanges();
  }

  getData(config_id: number, tipo: 'cruda' | 'form') {
    let entidad_cuenta: any;
    if (tipo == 'cruda') entidad_cuenta = this.cuentasContablesDataCruda?.find((cuenta) => cuenta.configuracion_entidad_cuenta_id == config_id) as EntidadCuentaContableI;
    if (tipo == 'form') entidad_cuenta = this.cuentasContablesData?.find((cuenta) => cuenta.configuracion_entidad_cuenta_id == config_id) as FormEntidadCuentaContableI;

    return entidad_cuenta;
  }

  parseData(entidad_cuenta_contable: FormEntidadCuentaContableI) {
    const current_cuenta = this.cuentasContablesData.find((cuenta) => cuenta.configuracion_entidad_cuenta_id == entidad_cuenta_contable.configuracion_entidad_cuenta_id);

    if (fun.hasValue(current_cuenta)) Object.assign(current_cuenta, entidad_cuenta_contable);
    this.emitChanges();
  }

  emitChanges() {
    this.cuentasContablesDataChange.emit(this.cuentasContablesData);
  }
}
