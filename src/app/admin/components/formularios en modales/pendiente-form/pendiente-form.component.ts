import { Component, OnInit } from '@angular/core';
import { ModalComponentI, ModalI } from '../../modal/modal-class';
import { DateUtils } from '../../../../core/typescript/date.utils';

@Component({
  selector: 'app-pendiente-form',
  templateUrl: './pendiente-form.component.html',
  styleUrls: ['./pendiente-form.component.scss'],
})
export class PendienteFormComponent implements OnInit, ModalI {
  time: { hour: number; minute: number; second?: number };
  hora;
  minutos;
  meridian = true;
  fecha: Date | string;
  maxDate = new Date();

  constructor() {}

  modalComponent: ModalComponentI = {};
  inputs: any;

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

  btn_aceptar() {
    const dateFormat = DateUtils.convertStringToDate({ dateString: this.fecha });
    const fecha = DateUtils.format({ date: dateFormat, dateFormat: 'YYYY-MM-DD', hourFormat: 'HH:mm', separator: ' ' });

    this.modalComponent.closeModal(this.modalComponent.id, { fecha });
  }
}
