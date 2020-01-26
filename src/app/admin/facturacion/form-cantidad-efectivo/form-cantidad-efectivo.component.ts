import { Component, OnInit, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DBservice } from '../../../core/services/bdservice.service';
import { ModalService } from '../../../components/modal/modal.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as _ from 'lodash';

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
})
export class FormCantidadEfectivoComponent implements OnInit, AfterViewInit {
  @Input() data;
  element: any;
  devuelta;
  efectivo: string;

  @Output() getDevuelta = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<any>();
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private dbServ: DBservice, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.efectivo = this.formatoNumero(this.data.devuelta);
  }

  ngAfterViewInit(): void {
    this.enfocarInput('devuelta');
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  checkNumbers(arg) {
    let res = false;
    for (let i = 0; i < arg.length; i++) {
      const tempCaracter = arg.charAt(i);
      if (tempCaracter !== ',') {
        const caracter = _.parseInt(tempCaracter);
        if (_.isNaN(caracter)) {
          res = true;
        }
      }
    }
    return res;
  }
  checkLongMillares(num) {
    let res = false;
    const splitNum = _.split(num, ',');
    splitNum.forEach((element, i) => {
      if (i !== 0) {
        if (element.length !== 3) {
          res = true;
        }
      }
    });
    return res;
  }

  revisarPrecio(valor, input) {
    const precioTEMPO = valor;

    if (precioTEMPO !== null && precioTEMPO !== undefined && precioTEMPO !== '' && precioTEMPO !== ' ') {
      const splitPrecio = _.split(precioTEMPO, '.');

      let precioTEMP;

      let enteros = splitPrecio[0];
      let tempdecimales = splitPrecio[1];
      if (tempdecimales === undefined) {
        tempdecimales = '00';
      }
      //
      if (splitPrecio.length > 2 || this.checkNumbers(enteros) || this.checkLongMillares(enteros) || this.checkNumbers(tempdecimales) || this.checkLongMillares(tempdecimales)) {
        this.dbServ.toastError('Valor introducido es invalido', 'ERROR');
        this.enfocarInput(input);
      } else {
        //
        if (splitPrecio.length === 2) {
          if (enteros === '' || enteros === ' ') {
            enteros = '0';
          }
          let decimales;
          if (tempdecimales.length > 2) {
            decimales = tempdecimales.substring(0, 2);
          } else {
            decimales = _.padEnd(tempdecimales, 2, '0');
          }
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        } else if (splitPrecio.length === 1) {
          const decimales = '00';
          const temp = [enteros, decimales];
          precioTEMP = _.join(temp, '.');
        }

        const numeroFormateado = GLOBAL.formatearNumero(GLOBAL.redondearAdos(precioTEMP));

        this.data.devuelta = numeroFormateado;
        this.efectivo = numeroFormateado;
      }
    }
  }
  calcularDevueta() {
    const total = this.data.total_factura;
    const efectivo = GLOBAL.desformatear(this.efectivo);
    const dev = efectivo - total;
    this.devuelta = this.formatoNumero(dev);
  }

  cancelar() {
    this.cancel.emit();
  }
  confirmar() {
    this.getDevuelta.emit(this.devuelta);
  }
  enviar() {
    this.enfocarInput('btnSend');
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
}
