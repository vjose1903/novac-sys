import { Component, OnInit } from '@angular/core';
import * as moment from '../../../../core/javascript/moment';

import { IModalConfiguration, ModalComponentI, ModalI } from '../../modal/modal-class';
import * as _ from 'lodash';

@Component({
  selector: 'app-pendiente-form',
  templateUrl: './pendiente-form.component.html',
  styleUrls: ['./pendiente-form.component.scss'],
})
export class PendienteFormComponent implements OnInit, ModalI {
  time = { hour: 13, minute: 30 };
  hora;
  minutos;
  meridian = true;
  fecha;
  maxDate = new Date();

  constructor() {}

  modalComponent: ModalComponentI= {};
  inputs: any;

  btn_aceptar() {
    const fechaTemp = moment(this.fecha).format('YYYY-MM-DD');

    const fecha = fechaTemp + ' ' + this.time.hour + ':' + this.time.minute;

    this.modalComponent.closeModal(this.modalComponent.id, { fecha, modalId: this.modalComponent.id });
  }

  ngOnInit() {
    this.hora = moment().hour();
    this.minutos = moment().minutes();

    this.fecha = new Date();

    this.time = { hour: this.hora, minute: this.minutos };
  }

  toggleMeridian() {
    this.meridian = !this.meridian;
  }
}
