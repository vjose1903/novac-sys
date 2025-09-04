<<<<<<< HEAD:src/app/admin/components/formularios en modales/pendiente-form/pendiente-form.component.ts
import { Component, OnInit } from '@angular/core';
import { ModalComponentI, ModalI } from '../../modal/modal-class';
import { DateUtils } from '../../../../core/typescript/date.utils';
=======
import { Component, Input, OnInit } from '@angular/core';
const moment = require('../../../../core/javascript/moment');

import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
>>>>>>> dev:src/app/core/components/formularios en modales/pendiente-form/pendiente-form.component.ts

@Component({
  selector: 'app-pendiente-form',
  templateUrl: './pendiente-form.component.html',
  styleUrls: ['./pendiente-form.component.scss'],
  standalone: false,
})
<<<<<<< HEAD:src/app/admin/components/formularios en modales/pendiente-form/pendiente-form.component.ts
export class PendienteFormComponent implements OnInit, ModalI {
  time: { hour: number; minute: number; second?: number };
=======
export class PendienteFormComponent implements OnInit, IDynamicModal {
  time = { hour: 13, minute: 30 };
>>>>>>> dev:src/app/core/components/formularios en modales/pendiente-form/pendiente-form.component.ts
  hora;
  minutos;
  meridian = true;
  fecha: Date | string;
  maxDate = new Date();

  constructor() {}

<<<<<<< HEAD:src/app/admin/components/formularios en modales/pendiente-form/pendiente-form.component.ts
  modalComponent: ModalComponentI = {};
  inputs: any;
=======
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
>>>>>>> dev:src/app/core/components/formularios en modales/pendiente-form/pendiente-form.component.ts

  ngOnInit() {
    this.fecha = new Date();
    this.hora = this.fecha.getHours();
    this.minutos = this.fecha.getMinutes();
    this.fecha = DateUtils.format({ date: new Date(), include_hour: true });

    this.time = { hour: this.hora, minute: this.minutos };
  }

  changeHour() {
    let time = this.fecha as Date;

    if (!DateUtils.isValid(time)) {
      time = DateUtils.convertStringToDate({ dateString: time });
    }

    time.setHours(this.time.hour);
    time.setMinutes(this.time.minute);

    this.fecha = DateUtils.format({ date: time, include_hour: true });
  }

  toggleMeridian() {
    this.meridian = !this.meridian;
  }

<<<<<<< HEAD:src/app/admin/components/formularios en modales/pendiente-form/pendiente-form.component.ts
  btn_aceptar() {
    const dateFormat = DateUtils.convertStringToDate({ dateString: this.fecha });
    const fecha = DateUtils.format({ date: dateFormat, dateFormat: 'YYYY-MM-DD', hourFormat: 'HH:mm', separator: ' ' });

    this.modalComponent.closeModal(this.modalComponent.id, { fecha });
=======
  submit() {
    const fechaTemp = moment(this.fecha).format('YYYY-MM-DD');
    const fecha = fechaTemp + ' ' + this.time.hour + ':' + this.time.minute;

    this.modalConfig.close({ fecha });
>>>>>>> dev:src/app/core/components/formularios en modales/pendiente-form/pendiente-form.component.ts
  }
}
