import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { fun } from '@core/services/functions.service';
import { ConfigCuadresC, ConfigCuadreValues } from '../../config-cuadres.model';

@Component({
  selector: 'app-config-cuadres',
  templateUrl: './config-cuadres.component.html',
  styleUrls: ['./config-cuadres.component.scss'],
  standalone: false,
})
export class ConfigCuadresComponent implements OnInit, IDynamicModal {
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() config_cuadre: ConfigCuadreValues = { target_fondo: 0 };

  form!: UntypedFormGroup;
  configCuadresClass = new ConfigCuadresC();
  initialTargetFondo = null;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.initialTargetFondo = fun.roundNumberToDecimal(this.config_cuadre?.target_fondo ?? 0);

    this.form = this.fb.group({
      target_fondo: [this.initialTargetFondo, Validators.required],
    });

    this.form.valueChanges.subscribe(() => {
      const targetFondo = fun.roundNumberToDecimal(this.form.get('target_fondo')?.value ?? 0);

      if (targetFondo == this.initialTargetFondo) this.disableBtnConfirm(true);
      else this.disableBtnConfirm(!this.form.valid);
    });
  }

  disableBtnConfirm(validate: boolean) {
    const btn = this.modalConfig.botones?.find(boton => boton.id === 'btnConfirmar');
    if (btn) btn.disable = validate;
  }

  submit() {
    const value = this.form.getRawValue();

    this.configCuadresClass
      .updateOne({ id: 1, config: { target_fondo: Number(fun.desformatearStNumber(value.target_fondo)) } })
      .then(res => {
        this.modalConfig.close(res?.data?.config);
      })
      .catch(err => console.error(err));
  }
}
