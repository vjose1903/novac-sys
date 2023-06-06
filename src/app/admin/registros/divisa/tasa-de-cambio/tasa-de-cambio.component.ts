import { table_config } from './../../../components/new_tablas/tabla-class';
import { TasaDeCambioC, TasaDeCambioI } from './tasa_de_cambio.utils';
import { fun } from './../../../../core/services/functions.service';
import { ModalI } from './../../../components/modal/modal-class';
import { Component, OnInit } from '@angular/core';
import * as moment from '../../../../core/javascript/moment';

import { DivisaC, DivisaI } from '../divisa.utils';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DivisaService } from '../divisa.service';

@Component({
  selector: 'app-tasa-de-cambio',
  templateUrl: './tasa-de-cambio.component.html',
  styleUrls: ['./tasa-de-cambio.component.scss'],
})
export class TasaDeCambioComponent implements OnInit, ModalI {
  modal: any = {};
  inputs: { divisa: DivisaI };

  form: UntypedFormGroup;

  desde;
  hasta;
  hastaMaxDate;

  tasaDeCambioClass = new TasaDeCambioC();
  divisaClass = new DivisaC();
  listaHistorial: Array<TasaDeCambioI> = [];

  table_config: table_config = {
    info: [
      { titulo: 'Fecha', tipo: 'text', key: 'fecha_equivalente', estilos: [{ 'text-align': 'left' }] },
      { titulo: 'Valor', tipo: 'text', key: 'monto' },
    ],
    colores: false,
    padding: '0rem',
    colorTitulo: false,
    id_tabla: 'lista_tasas_cambio',
  };

  divisaPrincipal: DivisaI;
  constructor(private fb: UntypedFormBuilder, public divisaServ: DivisaService) {}

  ngOnInit(): void {
    this.getDivisaPrincipal();
    this.setDefaultRange();
    this.createForm(this.inputs.divisa);
    this.getHistorialCambiosTasas();
  }

  createForm(divisa: DivisaI) {
    this.form = this.fb.group({
      tasa: [{ value: divisa.current_tasa, disabled: divisa.is_principal }, Validators.required],
    });
  }

  setDefaultRange() {
    let desde_temp = new Date();
    desde_temp.setDate(desde_temp.getDate() - 30);
    const desde = new Date(fun.getFirstDayOfMoth(desde_temp));

    this.desde = desde;
    this.hasta = new Date();
    this.hastaMaxDate = new Date();
  }

  verificateChangeOfCurrency() {
    const formValue = this.form.getRawValue();
    return formValue.tasa == this.inputs.divisa.current_tasa;
  }

  async getHistorialCambiosTasas() {
    try {
      this.listaHistorial.length = 0;
      const extra = { afterPath: 'custom/get_history_changes', parameters: { desde: fun.my_dateFormater(this.desde, false), hasta: fun.my_dateFormater(this.hasta, false), divisa_id: this.inputs.divisa.id } };
      this.tasaDeCambioClass.getAll(extra).then((res) => {
        res['data'].map((historial: TasaDeCambioI) => {
          historial.fecha_equivalente = moment(historial.fecha_equivalente).format('DD/MM/YYYY');
          historial.monto = `${this.divisaPrincipal.simbolo} ${fun.numFormatTwoDecimals(historial.valor)}`;

          historial.customStyles = { fecha_equivalente: { 'text-align': 'start' } };

          this.listaHistorial.push(historial);
        });
      });
    } catch (error) {
      fun.toastError('Error Buscando el historial de cambios de tasas de cambios.', 'ERROR');
    }
  }

  getDivisaPrincipal() {
    const extra = { afterPath: 'custom/get_principal' };
    this.divisaClass.dynamic(extra).then((res) => (this.divisaPrincipal = res['data'] as DivisaI));
  }

  btn_aceptar() {
    const formValue = this.form.getRawValue();

    const dataToSend = { id: this.inputs.divisa.id, divisa_id: this.inputs.divisa.id, valor: formValue.tasa, fecha_equivalente: fun.my_dateFormater(this.hastaMaxDate, false) };

    this.tasaDeCambioClass.updateOne(dataToSend).then((res) => {
      this.getHistorialCambiosTasas();
      this.divisaServ.getDivisas();

      this.inputs.divisa.current_tasa = formValue.tasa;
    });
  }
}
