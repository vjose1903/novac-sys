import { EventEmitter } from '@angular/core';
import { Component, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import * as moment from 'moment';

@Component({
  selector: 'app-form-reportes',
  templateUrl: './form-reportes.component.html',
  styleUrls: ['./form-reportes.component.scss'],
})
export class FormVentasComponent implements OnInit {
  @Input() tipo_reporte;

  @Output() seleccion = new EventEmitter<any>();
  form: FormGroup;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();

  condiciones = [
    { id: 'Crédito', label: 'Crédito' },
    { id: 'Contado', label: 'Contado' },
    { id: 'todos', label: 'Todos' },
  ];

  tipos = [
    { id: 'viajes', label: 'Viajes' },
    { id: 'normal', label: 'Normal' },
    { id: 'todos', label: 'Todos' },
  ];

  constructor(private fb: FormBuilder) {
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
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.createForm();
    await this.agregateValidators();
  }

  getFirstDayOfMoth() {
    const month = moment().month() + 1;
    const year = moment().year();
    const temp = `${year}-${month}-02`;
    return temp;
  }

  agregateValidators() {
    if (this.tipo_reporte === 'ventas_diarias') {
      this.form.controls.tipo.setValue(1);
      this.setValidator('condicion');
    } else if (this.tipo_reporte === 'ventas_rango') {
      this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
      this.form.controls.hasta.setValue(new Date());
      this.form.controls.tipo.setValue(2);

      this.setValidator('condicion');
      this.setValidator('desde');
      this.setValidator('hasta');
    } else if (this.tipo_reporte === 'recibos') {
      this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
      this.form.controls.hasta.setValue(new Date());
      this.form.controls.tipo.setValue('todos');
    }
  }

  setValidator(control) {
    this.form.controls[control].setValidators(Validators.required);
    this.form.controls[control].updateValueAndValidity();
  }

  createForm() {
    this.form = this.fb.group({
      tipo: [null],
      condicion: [null],
      desde: [null],
      hasta: [null],
    });
  }

  accion(arg) {
    this.seleccion.emit({ bool: arg, obj: this.form.value });
  }
}
