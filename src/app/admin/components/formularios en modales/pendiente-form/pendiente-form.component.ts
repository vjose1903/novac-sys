import { Component, OnInit } from '@angular/core';
import * as moment from '../../../../core/javascript/moment';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { ModalI } from '../../modal/modal-class';
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
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private localeService: BsLocaleService) {
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
  modal: any = {};
  inputs: any;
  btn_aceptar() {
    const fechaTemp = moment(this.fecha).format('YYYY-MM-DD');
    const fecha = fechaTemp + ' ' + this.time.hour + ':' + this.time.minute;

    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    modal.getDataModal({ fecha, modal_id: this.modal.component_id });
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
}
