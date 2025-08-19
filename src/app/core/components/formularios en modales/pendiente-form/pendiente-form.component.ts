import { Component, Input, OnInit } from '@angular/core';
const moment = require('../../../../core/javascript/moment');

import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

@Component({
  selector: 'app-pendiente-form',
  templateUrl: './pendiente-form.component.html',
  styleUrls: ['./pendiente-form.component.scss'],
  standalone: false,
})
export class PendienteFormComponent implements OnInit, IDynamicModal {
  // TODO: Cambiar a DynamicModalComponent
  time = { hour: 13, minute: 30 };
  hora;
  minutos;
  meridian = true;
  fecha;
  maxDate = new Date();

  constructor() {}

  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  inputs: any;
  btn_aceptar() {
    const fechaTemp = moment(this.fecha).format('YYYY-MM-DD');
    const fecha = fechaTemp + ' ' + this.time.hour + ':' + this.time.minute;

    this.modalConfig.close({ fecha });
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
