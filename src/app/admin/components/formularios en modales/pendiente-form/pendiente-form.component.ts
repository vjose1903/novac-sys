import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { DBservice } from '../../../../core/services/bdservice.service';
import { ModalService } from '../../modal/modal.service';

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
  fecha;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  @Output() cancel = new EventEmitter<any>();
  @Output() getDate = new EventEmitter<any>();

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice, private router: Router, public mServ: ModalService, private localeService: BsLocaleService) {
    this.dpConfig = Object.assign(
      {},
      {
        // locale:'es',
        showWeekNumbers: false,
        maxDate: new Date(),
        dateInputFormat: 'DD/MM/YYYY',
      },
    );
  }

  ngOnInit() {
    this.localeService.use('es');
    this.hora = moment().hour();
    this.minutos = moment().minutes();

    this.fecha = new Date();

    this.time = { hour: this.hora, minute: this.minutos };
  }

  toggleMeridian() {
    this.meridian = !this.meridian;
  }

  accion(arg) {
    this.cancel.emit(arg);
  }
  makeDateTime() {
    const fechaTemp = moment(this.fecha).format('YYYY-MM-DD');
    const fechaF = fechaTemp + ' ' + this.time.hour + ':' + this.time.minute;
    this.getDate.emit(fechaF);
  }
}
