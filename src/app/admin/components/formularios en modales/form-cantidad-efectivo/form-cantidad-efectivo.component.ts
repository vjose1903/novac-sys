import { Component, OnInit, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalI } from '../../new_modal/modal-class';

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
})
export class FormCantidadEfectivoComponent extends MixinClass implements OnInit, AfterViewInit, ModalI {
  @Input() tipo = 'devuelta';
  @Input() data;
  @Input() debe_cubrir = true;

  element: any;
  devuelta;
  efectivo: string;
  formaPago = 'Efectivo';
  @Output() getDevuelta = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<any>();
  factura_de: any;
  cambiar_articulos = undefined;
  constructor() {
    super();
  }
  modal: any = {};
  inputs: any;

  ngOnInit() {
    this.data = this.inputs;
    console.log('VIENDO DATOS =====> this.inputs', this.inputs);
    console.log('VIENDO DATOS =====> this.data', this.data);

    this.efectivo = this.formatoNumero(this.data.devuelta);
    this.factura_de = this.data.factura_de;

    if (!this.data.cambios_articulos) {
      this.cambiar_articulos = 'no';
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.factura_de !== 'compra' && this.tipo === 'devuelta') {
        this.enfocarInput('inputEfectivo');
      }
    }, 250);
  }

  saltar(campo, valor?) {
    if (campo === 'formaPago') {
      this.enfocarInput(campo);
    }
    if (campo === 'send') {
      if (this.tipo !== 'no_devuelta' && this.efectivo < this.data.total_factura) {
        this.fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
        this.enfocarInput('inputEfectivo');
      } else {
        this.btn_aceptar();
      }
    }
  }

  formatoNumero(num) {
    return this.fun.formatearNumero(this.fun.redondearAdos(num));
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
        this.fun.toastError('Valor introducido es invalido', 'ERROR');
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

        const numeroFormateado = this.fun.formatearNumero(this.fun.redondearAdos(precioTEMP));

        this.data.devuelta = numeroFormateado;
        this.efectivo = numeroFormateado;
      }
    }
  }
  calcularDevueta() {
    const total = this.data.total_factura;
    const efectivo = this.fun.desformatear(this.efectivo);
    const dev = efectivo - total;
    this.devuelta = this.formatoNumero(dev);
  }

  cancelar() {
    this.cancel.emit();
  }
  btn_aceptar() {
    // const total = this.data.total_factura;
    const devuelta_ = this.fun.desformatear(this.devuelta);
    const efectivo = this.fun.desformatear(this.efectivo);
    const obj = {
      dinero: efectivo,
      devuelta: this.devuelta ? devuelta_ : 0,
      forma_pago: this.formaPago,
      decision_cambio: this.cambiar_articulos === 'si' ? true : false,
    };
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    if (this.validarForm()) {
      this.fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
    } else {
      if (this.factura_de === 'compra') {
        if (this.cambiar_articulos !== undefined) {
          modal.getDataModal({ obj, modal_id: this.modal.component_id });
        } else {
          this.fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
        }
      } else {
        modal.getDataModal({ obj, modal_id: this.modal.component_id });
      }
    }
  }

  cambiosEnArticulos(lugar) {
    this.cambiar_articulos = lugar;
  }

  validarForm(from?): boolean {
    const total = this.data.total_factura;
    const devuelta_ = this.fun.desformatear(this.devuelta);
    const efectivo = this.fun.desformatear(this.efectivo);
    const validate = this.factura_de === 'venta' && this.tipo !== 'no_devuelta' && total > efectivo;
    if (from == 'input') {
      const modal = _.find(this.modal.instance.modalsConfig, { id: this.modal.component_id });
      const btn = _.find(modal.botones.dinamico, { btn_id: 'btnConfirmar' });
      console.log('modal.botones.dinamico: ', modal.botones.dinamico);
      console.log('BOTON DEL DIABLO: ', btn);

      btn.disable = validate;
    }

    return validate;
  }
}
