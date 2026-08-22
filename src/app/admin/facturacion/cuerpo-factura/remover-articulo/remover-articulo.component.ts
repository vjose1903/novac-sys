import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, Input, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { fun } from '@core/services/functions.service';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

@Component({
  selector: 'app-remover-articulo',
  templateUrl: './remover-articulo.component.html',
  styleUrls: ['./remover-articulo.component.scss'],
  standalone: false,
})
export class RemoverArticuloComponent implements OnInit, IDynamicModal {
  constructor(private fb: UntypedFormBuilder) {}
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  @Input() index: number;
  @Input() key: string;
  @Input() cantidad: number;
  @Input() is_prefactura_selected: boolean;
  @Input() data_detalle: any;
  @Input() nombre: string;

  form;

  htmlServ = inject(HtmlElementsService);

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      all: [{ value: false, disabled: false }],
      cantidad: [{ value: 0, disabled: false }, Validators.required],
      razon: [{ value: 'no_venta', disabled: false }, Validators.required],
    });
  }

  saltar(campo) {
    if (campo != 'send') {
      fun.enfocarInput(campo);
    } else {
      this.submit();
    }
  }

  changeValorCheck() {
    this.form.controls.cantidad.setValue(this.cantidad);
    fun.enfocarInput('razon');
  }

  checkCantidad() {
    const formulario = this.form.getRawValue();

    if (formulario.cantidad < 0) {
      fun.toastWarning('La cantidad no puede ser menor a 0.');
      this.form.controls.cantidad.setValue(0);
    }

    if (formulario.cantidad > this.cantidad) {
      fun.toastWarning('La cantidad no puede ser mayor a la cantidad pre-facturada.');
      this.form.controls.cantidad.setValue(this.cantidad);
    }

    this.form.controls.all.setValue(formulario.cantidad == this.cantidad);
  }

  submit() {
    if (this.form.valid || this.data_detalle.is_defectuoso || !this.is_prefactura_selected) {
      const obj = { key: this.key, data: this.data_detalle };

      if (this.is_prefactura_selected) obj['data'] = this.form.getRawValue();
      this.modalConfig.close(obj);
    } else {
      fun.toastError('Complete los campos para retirar el articulo.', 'ERROR');
    }
  }
}
