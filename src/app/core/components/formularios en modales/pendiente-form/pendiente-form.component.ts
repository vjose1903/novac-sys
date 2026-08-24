import { Component, Input, OnInit } from '@angular/core';
import moment from '../../../../core/javascript/moment';

import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { CuadreCajaC } from '@core/typescript/cuadre_caja';
import { fun } from '@services/functions.service';

@Component({
  selector: 'app-pendiente-form',
  templateUrl: './pendiente-form.component.html',
  styleUrls: ['./pendiente-form.component.scss'],
  standalone: false,
})
export class PendienteFormComponent implements OnInit, IDynamicModal {
  hora: string | null = null;
  fecha: Date | null = null;
  maxDate = new Date();
  checkingCuadre = false;
  cuadreBlocked = false;
  validationError = false;
  private cuadreCajaClass = new CuadreCajaC();
  private validationRequestId = 0;
  private lastBlockedDateTimeToast = '';

  constructor() {}

  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  ngOnInit() {}

  canSubmit() {
    return fun.hasValue(this.fecha) && fun.hasValue(this.hora) && !this.checkingCuadre && !this.cuadreBlocked && !this.validationError;
  }

  async validateSelectedDateTime() {
    const requestId = ++this.validationRequestId;
    const selectedDateTime = this.getSelectedDateTime();

    this.cuadreBlocked = false;
    this.validationError = false;

    if (!selectedDateTime) {
      this.checkingCuadre = false;
      return;
    }

    this.checkingCuadre = true;

    try {
      const res = await this.cuadreCajaClass.getAll({
        afterPath: 'check_datetime_cuadre',
        parameters: { fecha_hora: selectedDateTime },
      });

      if (requestId !== this.validationRequestId) return;

      const data = res?.data as any;
      this.cuadreBlocked = data?.blocked === true;

      if (this.cuadreBlocked && this.lastBlockedDateTimeToast !== selectedDateTime) {
        this.lastBlockedDateTimeToast = selectedDateTime;
        fun.toastWarning('Ya existe un cuadre realizado para ese día.', 'AVISO');
      }
    } catch (error) {
      if (requestId !== this.validationRequestId) return;

      this.validationError = true;
      fun.toastError('No se pudo validar si existe un cuadre para la fecha indicada.', 'ERROR');
    } finally {
      if (requestId === this.validationRequestId) this.checkingCuadre = false;
    }
  }

  submit() {
    if (!this.canSubmit()) return;

    this.modalConfig.close({ fecha: this.getSelectedDateTime() });
  }

  private getSelectedDateTime() {
    if (!this.fecha || !this.hora) return null;

    const date = moment(this.fecha);
    if (!date.isValid()) return null;

    const time = moment(this.hora, 'HH:mm', true);
    if (!time.isValid()) return null;

    return `${date.format('YYYY-MM-DD')}T${time.format('HH:mm')}:00`;
  }
}
