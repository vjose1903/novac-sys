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
  fecha: Date;
  maxDate = new Date();

  constructor() {}

  modalComponent: ModalComponentI = {};
  inputs: any;

  btn_aceptar() {
    const fecha = DateUtils.format({ date: this.fecha, dateFormat: 'YYYY-MM-DD', hourFormat: 'HH:mm', separator: ' ' });
    this.modalComponent.closeModal(this.modalComponent.id, { fecha });
  }

  ngOnInit() {
    this.fecha = new Date();
    this.hora = this.fecha.getHours();
    this.minutos = this.fecha.getMinutes();

    this.time = { hour: this.hora, minute: this.minutos };
  }

  changeHour() {
    const time = this.fecha;
    time.setHours(this.time.hour);
    time.setMinutes(this.time.minute);

    this.fecha = time;
  }

  toggleMeridian() {
    this.meridian = !this.meridian;
  }
}
