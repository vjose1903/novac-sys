import { EventEmitter } from '@angular/core';
import { Component, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import * as moment from 'moment';
import { ModalService } from '../../modal/modal.service';
import { DBservice } from '../../../../core/services/bdservice.service';

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

  filtro_articulo;
  listaArticulos = [];

  formarFecha = ['suplidor_prod'];
  Fecha: string;

  constructor(private fb: FormBuilder, private mServ: ModalService, private dbServ: DBservice) {
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
    if (this.formarFecha.includes(this.tipo_reporte)) {
      this.formarFechaFactura(new Date());
    }
  }

  formarFechaFactura(date) {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');

    // this.FechaFacturaMostrar = moment(date).format('DD/MM/YYYY');

    this.Fecha = fechaTemp + ' ' + (hora <= 9 ? '0' + hora : hora) + ':' + (minutos <= 9 ? '0' + minutos : minutos);
  }

  async getArticulos(arg) {
    console.log(arg);
    if (arg.term && arg.term !== '') {
      try {
        const is_compra = true;

        const res = await this.dbServ.getArticulosFiltrados(arg.term, 0, 0, false, is_compra, this.Fecha, 'todos').toPromise();

        if (res.length === 0) {
          this.dbServ.toastError('Articulo no creado', 'ERROR', true);
        } else {
          this.listaArticulos = res;
        }
      } catch (error) {
        console.error(error);
        this.dbServ.toastError('Error buscando articulos registrados.', 'ERROR', true);
      }
    } else {
      this.listaArticulos = [];
    }
  }

  getFirstDayOfMoth() {
    const month = moment().month() + 1;
    const year = moment().year();
    const temp = `${year}-${month}-01`;
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
    } else if (this.tipo_reporte === 'ventas_productos') {
      this.form.controls.fecha.setValue(new Date());
    } else if (this.tipo_reporte === 'suplidor_prod') {
      this.form.controls.desde.setValue(new Date(this.getFirstDayOfMoth()));
      this.form.controls.hasta.setValue(new Date());
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
      articulo_id: [null],
      tipo: [null],
      condicion: [null],
      fecha: [null],
      desde: [null],
      hasta: [null],
    });
  }

  accion(arg) {
    this.seleccion.emit({ bool: arg, obj: this.form.value });
  }
}
