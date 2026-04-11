import { Component, Input, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { fun } from '@core/services/functions.service';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { ReciboConfiguracionC, ReciboConfiguracionFormI, ReciboConfiguracionI } from './recibo-configuracion';

@Component({
  selector: 'app-config-recibos-modal',
  templateUrl: './config-recibos-modal.component.html',
  styleUrls: ['./config-recibos-modal.component.scss'],
  standalone: false,
})
export class ConfigRecibosModalComponent implements OnInit, IDynamicModal {
  form: UntypedFormGroup;
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() config_recibos: ReciboConfiguracionI | null = null;
  @Input() canEdit = false;

  reciboConfiguracionClass = new ReciboConfiguracionC();
  htmlServ = inject(HtmlElementsService);

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.createForm(this.config_recibos).then(() => {
      if (!this.canEdit) {
        this.form.disable({ emitEvent: false });
        return;
      }

      this.disableBtnConfirm(!this.form.valid);
      this.form.valueChanges.subscribe(() => {
        this.disableBtnConfirm(!this.form.valid);
      });
    });
  }

  createForm(data: ReciboConfiguracionI | null) {
    return new Promise<boolean>(resolve => {
      const config: ReciboConfiguracionFormI = {
        id: data?.id ?? ReciboConfiguracionC.CURRENT_ID,
        card_percentage: data?.card_percentage ?? 0,
      };

      this.form = this.fb.group({
        id: [config.id],
        card_percentage: [{ value: config.card_percentage, disabled: false }, Validators.compose([Validators.required, Validators.min(1), Validators.max(100)])],
      });

      fun.setTimeout(() => resolve(true), 10);
    });
  }

  disableBtnConfirm(validate) {
    const btn = this.modalConfig.botones.find(boton => boton.id == 'btnConfirmar');
    if (!btn) return;
    btn.disable = validate;
  }

  submit() {
    if (!this.canEdit) return;

    const formulario = this.form.getRawValue() as ReciboConfiguracionFormI;

    this.reciboConfiguracionClass
      .updateCurrent(formulario)
      .then(res => {
        fun.toastSuccess('Configuracion de recibos actualizada', 'CORRECTO');
        this.modalConfig.close(res.data);
      })
      .catch(err => {
        fun.toastError(err?.msg || 'Error al actualizar la configuracion de recibos', 'ERROR');
      });
  }
}
