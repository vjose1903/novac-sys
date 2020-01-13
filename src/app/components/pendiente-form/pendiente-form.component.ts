import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-pendiente-form',
  templateUrl: './pendiente-form.component.html',
  styleUrls: ['./pendiente-form.component.scss'],
})
export class PendienteFormComponent implements OnInit {
  time = { hour: 13, minute: 30 };
  hora;
  minutos;
  meridian = true;
  @Output() cancel = new EventEmitter<any>();
  constructor() {}

  ngOnInit() {
    this.hora = moment().hour();
    this.minutos = moment().minutes();

    this.time = { hour: this.hora, minute: this.minutos };
  }

  toggleMeridian() {
    this.meridian = !this.meridian;
  }

  accion(arg) {
    this.cancel.emit(arg);
  }
}
