import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { ModalService } from '../components/modal/modal.service';
import { GLOBAL } from '../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { filter } from 'lodash';

@Component({
  selector: 'app-produccion',
  templateUrl: './produccion.component.html',
  styleUrls: ['./produccion.component.scss'],
})
export class ProduccionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardTabla', { static: false }) cardTabla: ElementRef;

  // listaArticulos: any;
  articulo_id;
  cantidad_producir;
  medida_producir;
  articuloSelected: any;
  altoDiv = 500;

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
  subDeci: Subscription;
  listaProductos: any;
  articuloEditando: any;

  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private actRou: ActivatedRoute, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined && (this.tipoModal === 'remover' || this.tipoModal === 'cancelarP')) {
        this.decisionModalP(res);
      } else if (res && this.tipoModal === 'confirmar_produccion') {
        this.confirmarProduccion();
      }
    });
    this.enfocarInput('articulo_id');
    this.getProductosTerminados();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.altoDiv = this.cardTabla.nativeElement.offsetHeight;
      this.altoDiv += 20;
    }, 10);
  }

  ngOnDestroy() {
    this.subDeci.unsubscribe();
  }

  filtroFormula(item) {
    return item.tipo_articulo_id === 3;
  }

  async getProductosTerminados() {
    try {
      const res = await this.dbServ.getProductosTerminados(this.articulo_id).toPromise();
      this.listaProductos = res;
    } catch (error) {
      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR');
      } else {
        this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR');
      }
    }
  }

  async getIngredients() {
    try {
      const res = await this.dbServ.getIngredientesFormula(this.articulo_id).toPromise();
      this.articuloSelected = this.listaProductos.filter((prod) => prod.id === _.parseInt(this.articulo_id))[0];

      this.ingredientes = res;
    } catch (error) {
      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR');
      } else {
        this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR');
      }
    }
  }

  lookOters(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? this.medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? this.medidas[keys[2]] : keys[2];

    const principal = GLOBAL.formatearNumero(GLOBAL.redondearAdos(values[0])) + '  ' + fin;

    const padre = GLOBAL.formatearNumero(GLOBAL.redondearAdos(values[1])) + '  ' + fin1;
    const hijo = GLOBAL.formatearNumero(GLOBAL.redondearAdos(values[2])) + '  ' + fin2;

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
  isLibraOrQuintal(objeto) {
    let presentar = 'Quintal';
    if (objeto.Quintal && objeto.Libra > 100) {
      presentar = 'Quintal';
    } else {
      presentar = 'Libra';
    }
    return presentar;
  }

  lookprincipal(objeto) {
    const presentar = this.isLibraOrQuintal(objeto);
    let cantidad = 0;

    cantidad = objeto[presentar];

    const fin = cantidad === 1 ? presentar : this.medidas[presentar];

    return GLOBAL.numFormatTwoDecimals(cantidad) + '  ' + fin;
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
    if (this.cantidad_producir && this.medida_producir) {
      this.ingredientes.forEach(async (ingre) => {
        let cantidadFormula = ingre.cantidad;

        if (this.medida_producir === 'Libra') {
          cantidadFormula = cantidadFormula / 100;
        }

        let cantidad_calculada = cantidadFormula * this.cantidad_producir;

        const obj = {
          Quintal: cantidad_calculada / 100,
          Libra: cantidad_calculada,
        };

        if (this.lista_produccion.length > 0) {
          for (let i = 0; i < this.lista_produccion.length; i++) {
            const element = this.lista_produccion[i];

            if (element.ingredientes.length > 0) {
              for (let j = 0; j < element.ingredientes.length; j++) {
                const ingrediente = element.ingredientes[j];
                if (ingrediente.nombre === ingre.nombre) {
                  cantidad_calculada += ingrediente.cantidad;
                }
              }
            }
          }
        }

        try {
          const res = await this.dbServ.getIngredienteExcede(ingre.articulo_id, cantidad_calculada).toPromise();

          if (res.excede) {
            this.cantidad_producir = null;
            this.ingredientesParaProduccion = [];

            this.dbServ.toastError('No tiene suficiente ' + ingre.nombre + ', para realizar la cantidad introducida de ' + this.articuloSelected.nombre, 'ERROR');
            this.enfocarInput('cantidad_producir');
          } else {
            this.ingredientesParaProduccion.push({ nombre: ingre.nombre, existencia: obj, articulo_id: ingre.articulo_id });
          }
        } catch (error) {
          if (error.error) {
            this.dbServ.toastError(error.error.msg, 'ERROR');
          } else {
            this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR');
          }
        }
      });
    }
  }

  borrar() {
    if (this.articuloEditando) {
      this.agregarAlista();
    }
    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.articulo_id = null;
    this.medida_producir = null;
    this.cantidad_producir = null;
    this.articuloEditando = undefined;
    this.enfocarInput('articulo_id');
  }

  agregarAlista() {
    this.ingredientesParaProduccion.forEach((ingre) => {
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

    this.disableOption('prod-' + this.articulo_id, true);
    this.articuloEditando = undefined;
    this.borrar();
  }

  editarItem(item) {
    if (this.articuloEditando) {
      this.agregarAlista();
    }

    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.articulo_id = item.ARG.articulo_id;
    this.cantidad_producir = item.ARG.cantidad;
    this.medida_producir = item.ARG.medida;

    this.articuloEditando = item.ARG;
    setTimeout(() => {
      this.getIngredients();
      this.calcularCantidadEnProduccion();

      this.seleccionModal = item.ARG;
      this.tipoModal = 'remover';
      this.indexBorrar = item.INDEX;
      this.decisionModalP(true);
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

  abrirModalDinamicText(tipo) {
    const obj = {};
    if (tipo === 'confirmar') {
      this.tipoModal = 'confirmar_produccion';
      this.mServ.modalTipo('dinamico_texto');
      obj['texto_modal'] = 'Seguro de que desea confirmar la produccion.';
    }
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  decisionModalP(bool) {
    const listaTemp = JSON.parse(JSON.stringify(this.lista_produccion));
    if (bool) {
      if (this.tipoModal === 'remover') {
        this.lista_produccion = [];
        this.disableOption('prod-' + this.seleccionModal.articulo_id, false);

        this.lista_produccion = _.remove(listaTemp, (n) => {
          return n.articulo_id !== this.seleccionModal.articulo_id;
        });
      } else {
        this.lista_produccion.forEach((element) => {
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
        (res) => {
          if (i === this.lista_produccion.length - 1) {
            this.succes();
          }
        },
        (err) => {
          this.mostrarErrores(err.error);
          // this.dbServ.toastError(err.error, 'Error');
        },
      );
    });
  }
  succes() {
    this.dbServ.toastSuccess('Producción registrada.', 'Correcto');
    this.tipoModal;
    this.decisionModalP('cancelarP');
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
