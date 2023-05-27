import { fun } from './../../../../core/services/functions.service';
import { Component, Input, OnInit } from '@angular/core';
import { CategoriaEntidadContableService } from '../../categoria-entidad-contable/categoria-entidad-contable.service';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableI, entidadesContables } from '../../categoria-entidad-contable/categoria-entidad-contable.utils';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { agrupacionContable } from './cuenta-contable-form.utils';

@Component({
  selector: 'cuenta-contable-form',
  templateUrl: './cuenta-contable-form.component.html',
  styleUrls: ['./cuenta-contable-form.component.scss'],
})
export class CuentaContableFormComponent implements OnInit {
  @Input() inputs: { selectedConfig: ConfiguracionEntidadCuentaI; entidad: entidadesContables };
  @Input() configuration: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } } = {};

  form: UntypedFormGroup;
  listadoCategorias: Array<CategoriaEntidadContableI> = [];
  configEntContableClass = new ConfiguracionEntidadCuentaC();

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.createForm();
    this.getCategorias();
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
      tipo_agrupacion_contable: [{ value: null, disabled: false }, Validators.required],
    });
  }

  async getCategorias() {
    CategoriaEntidadContableService.getCategoriasByEntidad({ paginado: false, config_id: this.inputs.selectedConfig.id, entidad: this.inputs.entidad }).then((res) => {
      this.listadoCategorias = res['data'];
    });
  }

  changeAgrupacion(tipo: agrupacionContable) {
    this.form.controls.tipo_agrupacion_contable.setValue(tipo);
  }
}
