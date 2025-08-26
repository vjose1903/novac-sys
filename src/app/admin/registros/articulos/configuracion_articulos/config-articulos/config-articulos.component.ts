import { HtmlElementsService } from '@core/services/html-elements.service';
import { fun } from '@core/services/functions.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ConfigArticuloC, ConfigArticuloI } from '../articulos_configuracion';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

@Component({
  selector: 'app-config-articulos',
  templateUrl: './config-articulos.component.html',
  styleUrls: ['./config-articulos.component.scss'],
  standalone: false,
})
export class ConfigArticulosComponent implements OnInit, IDynamicModal {
  form: UntypedFormGroup;
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  @Input() config_articulos: ConfigArticuloI;

  update_articulos = true;
  configArticuloClass = new ConfigArticuloC();

  htmlServ = inject(HtmlElementsService);
  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.createForm(this.config_articulos).then(() => {
      this.form.valueChanges.subscribe(res => {
        this.disableBtnConfirm(!this.form.valid);
      });
    });
  }

  createForm(data) {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [data.id],
        porciento_ganancia: [{ value: data.porciento_ganancia, disabled: false }, Validators.compose([Validators.required, Validators.min(1), Validators.max(100)])],
      });

      fun.setTimeout(() => resolve(true), 10);
    });
  }

  changeUpdateArticulos() {
    this.update_articulos = !this.update_articulos;
  }

  disableBtnConfirm(validate) {
    const btn = this.modalConfig.botones.find(boton => boton.id == 'btnConfirmar');
    btn.disable = validate;
  }

  submit() {
    const formulario = this.form.getRawValue();
    this.configArticuloClass
      .updateOne(formulario, { parameters: { update_articulos: this.update_articulos } })
      .then(res => {
        this.modalConfig.close({ ...res.data, update_articulos: this.update_articulos });
      })
      .catch(err => console.error(err));
  }
}
