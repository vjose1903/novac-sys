import { Component, OnInit } from '@angular/core';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { ModalService } from '../../components/modal/modal.service';

@Component({
  selector: 'app-produccion',
  templateUrl: './produccion.component.html',
  styleUrls: ['./produccion.component.scss'],
})
export class ProduccionComponent implements OnInit {
  listaArticulos: any;
  articulo_id;
  cantidad_producir;
  medida_producir;
  articuloSelected: any;

  lista_produccion = [];
  ingredientes = [];
  ingredientesParaProduccion = [];
  medidas = {
    Libra: 'Libras',
    Quintal: 'Quintales',
    Caja: 'Cajas',
    Paquete: 'Paquetes',
    Unidad: 'Unidades',
  };
  element: any;
  optionsAlerta = ['Quintal', 'Libra'];
  seleccionModal: any;
  indexBorrar: any;
  tipoModal: string;
  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private actRou: ActivatedRoute, private router: Router, private mServ: ModalService) {}

  formatearNumero(nStr) {
    if (nStr !== undefined) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }

  redondearAdos(num) {
    const string = num + '';
    const splitStr = _.split(string, '.');
    const enteros = splitStr[0];
    let tempdecimales = splitStr[1];
    if (splitStr.length === 1) {
      tempdecimales = '00';
    }

    const decimales = tempdecimales.substring(0, 2);
    const Arreglo = [enteros, decimales];
    const numStr = _.join(Arreglo, '.');
    return parseFloat(numStr).toFixed(2);
    // return (Math.round(num * 100) / 100).toFixed(2);
  }
  ngOnInit() {
    this.dbServ.getArticulos().subscribe(res => {
      res.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });

      if (res !== undefined && res !== null) {
        this.listaArticulos = res;
      }
    });

    this.mServ.DECISIONMODAL.subscribe(res => {
      if (res !== null || res !== undefined) {
        this.decisionModalP(res);
      }
    });
    this.enfocarInput('articulo_id');
  }
  filtroFormula(item) {
    return item.tipo_articulo_id === 3;
  }
  getIngredients() {
    this.ingredientes = [];

    const tempArticulo = this.listaArticulos.filter(val => val.id === _.parseInt(this.articulo_id));
    this.articuloSelected = tempArticulo[0];
    const tempIngredientes = tempArticulo[0].formulas_productos_terminados;

    tempIngredientes.forEach(ingrediente => {
      const tempIngre = this.listaArticulos.filter(val => val.id === _.parseInt(ingrediente.articulo_combo));
      const ingre = tempIngre[0];
      this.ingredientes.push({
        articulo_id: ingre.id,
        nombre: ingre.nombre,
        cantidad: ingrediente.cantidad,
        existencia: ingre.cantidades,
        contenido: ingre.contenido,
      });
    });
    // console.log(this.articuloSelected);
    // console.log(this.ingredientes);
  }

  lookOters(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? this.medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? this.medidas[keys[2]] : keys[2];

    const principal = this.formatearNumero(this.redondearAdos(values[0])) + '  ' + fin;

    const padre = this.formatearNumero(this.redondearAdos(values[1])) + '  ' + fin1;
    const hijo = this.formatearNumero(this.redondearAdos(values[2])) + '  ' + fin2;

    let cantiTootip = ``;
    if (keys.length > 1) {
      if (keys.length === 2) {
        cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br></div>`;
      } else {
        cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br> <span>${hijo}</span><br> </div>`;
      }
    } else {
      cantiTootip = `<div style=" max-width: 21rem;" > <span> ${principal} </span><br></div>`;
    }
    return cantiTootip;
  }
  lookprincipal(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);
    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    return this.formatearNumero(this.redondearAdos(values[0])) + '  ' + fin;
  }

  saltar(campo) {
    if (campo !== 'agregar') {
      this.enfocarInput(campo);
    } else {
      const continu = this.abilitarBtnAgregar();

      if (!continu) {
        setTimeout(() => {
          this.agregarAlista();
        }, 250);
      }
    }
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  disableOption(arg, boolean) {
    (this.element = document.getElementById(arg) as any).disabled = boolean;
  }
  abilitarBtnAgregar() {
    let res = true;
    if (
      this.articulo_id !== null &&
      this.articulo_id !== undefined &&
      this.articulo_id !== '' &&
      this.articulo_id !== ' ' &&
      this.cantidad_producir !== null &&
      this.cantidad_producir !== undefined &&
      this.cantidad_producir !== '' &&
      this.cantidad_producir !== ' ' &&
      this.medida_producir !== null &&
      this.medida_producir !== undefined &&
      this.medida_producir !== '' &&
      this.medida_producir !== ' '
    ) {
      res = false;
    }
    return res;
  }
  abilitarBtnConfirmar() {
    let res = true;
    if (this.lista_produccion.length > 0) {
      res = false;
    }
    return res;
  }

  calcularCantidadEnProduccion() {
    this.ingredientesParaProduccion = [];
    if (
      this.cantidad_producir !== null &&
      this.cantidad_producir !== undefined &&
      this.cantidad_producir !== '' &&
      this.cantidad_producir !== ' ' &&
      this.medida_producir !== null &&
      this.medida_producir !== undefined &&
      this.medida_producir !== '' &&
      this.medida_producir !== ' '
    ) {
      this.ingredientes.forEach(ingre => {
        let cantidadFormula = ingre.cantidad;
        if (this.medida_producir === 'Libra') {
          cantidadFormula = cantidadFormula / 100;
        }

        let quin = cantidadFormula * this.cantidad_producir;
        const obj = {
          Quintal: quin / 100,
          Libra: quin,
        };
        if (this.lista_produccion.length > 0) {
          for (let i = 0; i < this.lista_produccion.length; i++) {
            const element = this.lista_produccion[i];

            if (element.ingredientes.length > 0) {
              for (let j = 0; j < element.ingredientes.length; j++) {
                const ingrediente = element.ingredientes[j];
                if (ingrediente.nombre === ingre.nombre) {
                  quin += ingrediente.cantidad;
                }
              }
            }
          }
        }

        if (quin > ingre.existencia.Libra) {
          this.cantidad_producir = null;
          this.ingredientesParaProduccion = [];
          this.dbServ.toastError('No tiene suficiente ' + ingre.nombre + ', para realizar la cantidad introducida de ' + this.articuloSelected.nombre, 'ERROR');
          this.enfocarInput('cantidad_producir');
        } else {
          this.ingredientesParaProduccion.push({ nombre: ingre.nombre, existencia: obj, articulo_id: ingre.articulo_id });
        }
      });
    }
  }

  borrar() {
    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.articulo_id = null;
    this.medida_producir = null;
    this.cantidad_producir = null;
    this.enfocarInput('articulo_id');
  }
  agregarAlista() {
    this.ingredientesParaProduccion.forEach(ingre => {
      ingre.cantidad = ingre.existencia.Libra;
      ingre.articulo_id = ingre.articulo_id;
      delete ingre.existencia;
    });

    const obj = {
      nombre: this.articuloSelected.nombre,
      cantidad: this.cantidad_producir,
      medida: this.medida_producir,
      articulo_id: _.parseInt(this.articulo_id),
      ingredientes: this.ingredientesParaProduccion,
    };
    this.lista_produccion.push(obj);
    console.log(this.lista_produccion);

    this.disableOption('prod-' + this.articulo_id, true);
    this.borrar();
  }
  editarItem(item) {
    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.articulo_id = item.ARG.articulo_id;
    this.cantidad_producir = item.ARG.cantidad;
    this.medida_producir = item.ARG.medida;
    setTimeout(() => {
      this.getIngredients();
      this.calcularCantidadEnProduccion();
    }, 5);
  }
  abrirModal(arg?) {
    this.seleccionModal = arg.ARG;
    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('remover');
    this.tipoModal = 'remover';
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }
  decisionModalP(bool) {
    const listaTemp = JSON.parse(JSON.stringify(this.lista_produccion));
    if (bool) {
      if (this.tipoModal === 'remover') {
        this.lista_produccion = [];
        this.disableOption('prod-' + this.seleccionModal.articulo_id, false);
        this.lista_produccion = _.pullAt(listaTemp[this.indexBorrar]);
      } else {
        this.lista_produccion.forEach(element => {
          this.disableOption('prod-' + element.articulo_id, false);
        });
        this.lista_produccion = [];
        this.borrar();
      }
    }
  }
  cancelarProduccion() {
    this.mServ.modalTipo('cancelarP');
    this.tipoModal = 'cancelarP';
    this.mServ.mostrarModal(true);
  }
  confirmarProduccion() {
    const obj = JSON.parse(JSON.stringify(this.lista_produccion));
    let continuar = false;

    const empleado = JSON.parse(this.dbServ.getEmpleado());

    obj.forEach((produccion, i) => {
      produccion['user_id'] = empleado.id;
      if (produccion.medida === 'Quintal') {
        produccion.cantidad *= 100;
      }

      this.dbServ.createProduccion(produccion).subscribe(
        res => {
          console.log('i', i);
          console.log('this.lista_produccion.length', this.lista_produccion.length - 1);

          if (i === this.lista_produccion.length - 1) {
            this.succes();
          }
        },
        err => {
          console.log(err.error);

          this.mostrarErrores(err.error);
          // this.dbServ.toastError(err.error, 'Error');
        },
      );
    });
  }
  succes() {
    this.dbServ.toastSuccess('Producción registrada.', 'Correcto');
    this.cancelarProduccion();
  }
  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.dbServ.toastError(element, 'Error');
      }
    }
  }
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Producto',
      key: 'nombre',
    },
    {
      titulo: 'Cantidad',
      key: 'cantidad',
      formatoNumero: true,
    },
    {
      titulo: 'Medida',
      key: 'medida',
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
}
