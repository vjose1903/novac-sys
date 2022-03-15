import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import { GLOBAL } from '../../core/typescript/GLOBAL';
import { MixinClass } from '../../core/typescript/MixinClass';
import { TablasService } from '../components/tablas/tablas.service';
import { ArticuloC, tipos_articulos } from '../registros/articulos/articulo';
import { ProduccionC } from './produccion';
import * as $ from 'jquery';
@Component({
  selector: 'app-produccion',
  templateUrl: './produccion.component.html',
  styleUrls: ['./produccion.component.scss'],
})
export class ProduccionComponent extends MixinClass implements OnInit, OnDestroy, AfterViewInit {
  producto_terminado_en_turno;
  cantidad_producir;
  medida_producir;

  lista_produccion = [];
  ingredientes = [];
  ingredientesParaProduccion = [];

  medidas = { Libra: 'Libras', Quintal: 'Quintales', Caja: 'Cajas', Paquete: 'Paquetes', Unidad: 'Unidades' };

  element: any;
  optionsMedidas = ['Quintal', 'Libra'];
  seleccionModal: any;
  tipoModal: string;

  info = [
    { titulo: 'Producto', tipo: 'text', key: 'nombre' },
    { titulo: 'Cantidad', tipo: 'text', key: 'cantidad', formatoNumero: true },
    { titulo: 'Medida', tipo: 'text', key: 'medida' },
  ];

  botones = { titulo: true, borrar: true, editar: true };

  listaProductos = [];
  articuloEditando: any;
  articuloClass = new ArticuloC();
  produccionClass = new ProduccionC();

  constructor(private tServ: TablasService) {
    super();
  }
  ngAfterViewInit(): void {
    this.enfocarSelect();
  }

  ngOnInit() {
    this._init_mixin({ component: 'produccion', is_routing: true, _lista_subs: ['decisionModal'] });

    this.getProductosTerminados();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  decisionModal(res) {
    if (this.fun.hasValue(res) && (this.tipoModal === 'remover' || this.tipoModal === 'cancelarP')) {
      this.decisionModalP(res);
    } else if (this.fun.hasValue(res) && this.tipoModal === 'confirmar_produccion') {
      this.confirmarProduccion();
    }
  }

  enfocarSelect() {
    var fields = $('#cantidad_producir').parents('form:eq(0),body').find(':input').not('[tabindex]');
    fields.eq(0).focus();
  }

  async getProductosTerminados() {
    const fechaActual = this.formarFechaFactura(new Date())['FechaFactura'];
    this.listaProductos.length = 0;
    this.articuloClass.getArticulosFiltrado({ buscar: ' ', fecha: fechaActual, paginado: false, tipo: tipos_articulos.Producto_terminado }).then((res) => {
      res['data'].map((producto_terminado) => {
        producto_terminado.optionDisabled = false;
        this.listaProductos.push(producto_terminado);
      });
    });
  }

  async getIngredients() {
    this.ingredientes = _.orderBy(this.producto_terminado_en_turno.formulas_productos_terminados, ['articulo_combo'], ['asc']);
  }

  lookOters(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? this.medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? this.medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? this.medidas[keys[2]] : keys[2];

    const principal = this.fun.formatearNumero(this.fun.redondearAdos(values[0])) + '  ' + fin;

    const padre = this.fun.formatearNumero(this.fun.redondearAdos(values[1])) + '  ' + fin1;
    const hijo = this.fun.formatearNumero(this.fun.redondearAdos(values[2])) + '  ' + fin2;

    let cantiTootip = ``;
    if (keys.length > 1) {
      if (keys.length === 2) cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br></div>`;
      else cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br> <span>${hijo}</span><br> </div>`;
    } else cantiTootip = `<div style=" max-width: 21rem;" > <span> ${principal} </span><br></div>`;

    return cantiTootip;
  }

  ingredientesScroll(arg) {
    const divs = ['inventario_scroll', 'produccion_scroll'];
    let div_opuesto_id = _.find(divs, (item) => item != arg.element_id);
    const div_opuesto = document.getElementById(div_opuesto_id);

    if (this.fun.hasValue(div_opuesto)) div_opuesto.scrollTop = arg.element.scrollTop;
  }

  existenciaConTooltip(objeto) {
    let llevaTooltip = true;

    if (_.has(objeto.existencia, 'Caja')) llevaTooltip = objeto.existencia.Unidad > objeto.contenido.Caja && objeto.existencia.Caja > 0;
    else if (_.has(objeto.existencia, 'Saco')) llevaTooltip = objeto.existencia.Libra > objeto.contenido.Saco && objeto.existencia.Saco > 0;
    else llevaTooltip = objeto.existencia.Libra > 100;

    return llevaTooltip;
  }

  lookprincipal(objeto) {
    let mostrar;

    if (_.has(objeto.existencia, 'Caja')) {
      if (objeto.existencia.Unidad > objeto.contenido.Caja && objeto.existencia.Caja > 0) {
        mostrar = `${this.fun.numFormatTwoDecimals(objeto.existencia.Caja)} ${objeto.existencia.Caja === 1 ? 'Caja' : 'Cajas'}`;
      } else mostrar = `${this.fun.numFormatTwoDecimals(objeto.existencia.Unidad)} ${objeto.existencia.Unidad === 1 ? 'Unidad' : 'Unidades'}`;
    } else if (_.has(objeto.existencia, 'Saco')) {
      if (objeto.existencia.Libra > objeto.contenido.Saco && objeto.existencia.Saco > 0) {
        mostrar = `${this.fun.numFormatTwoDecimals(objeto.existencia.Saco)} ${objeto.existencia.Saco === 1 ? 'Saco' : 'sacos'}`;
      } else mostrar = `${this.fun.numFormatTwoDecimals(objeto.existencia.Libra)} ${objeto.existencia.Libra === 1 ? 'Libra' : 'Libras'}`;
    } else {
      if (objeto.existencia.Libra > 100) mostrar = `${this.fun.numFormatTwoDecimals(objeto.existencia.Quintal)} ${objeto.existencia.Quintal === 1 ? 'Quintal' : 'Quintales'}`;
      else mostrar = `${this.fun.numFormatTwoDecimals(objeto.existencia.Libra)} ${objeto.existencia.Libra === 1 ? 'Libra' : 'Libras'}`;
    }

    return mostrar;
  }

  saltar(campo) {
    if (campo !== 'agregar') {
      this.enfocarInput(campo);
    } else {
      if (this.producto_terminado_en_turno) {
        const is_invalid = this.formIsInvalid();
        if (!is_invalid) setTimeout(() => this.agregarAlista(), 250);
      }
    }
  }

  disableOption(id, boolean) {
    let optionSelected = _.find(this.listaProductos, (item) => item.id == id);
    optionSelected.optionDisabled = boolean;
  }

  formIsInvalid() {
    let res = true;
    if (this.producto_terminado_en_turno && this.cantidad_producir && this.medida_producir) res = false;
    return res;
  }

  abilitarBtnConfirmar() {
    let res = true;
    if (this.lista_produccion && this.lista_produccion.length > 0) res = false;
    return res;
  }

  calcularCantidadAProduccir() {
    this.ingredientesParaProduccion = [];

    if (this.cantidad_producir && this.medida_producir) {
      this.ingredientes.forEach(async (ingre) => {
        let cantidadFormula = ingre.cantidad;

        if (this.medida_producir === 'Libra' && ingre.medida === 'Libra') cantidadFormula = cantidadFormula / 100;

        let cantidad_calculada = cantidadFormula * this.cantidad_producir;

        let obj: any = { Quintal: cantidad_calculada / 100, Libra: cantidad_calculada };

        if (ingre.medida == 'Unidad') obj = { Caja: cantidad_calculada / ingre.contenido.Caja, Unidad: cantidad_calculada };

        if (this.lista_produccion.length > 0) {
          const ingredientesIguales = _.filter(this.lista_produccion, (item) => item.articulo_combo == ingre.articulo_combo);
          cantidad_calculada = _.reduce(ingredientesIguales, (acumulado, item) => acumulado + item.cantidad, cantidad_calculada);
        }

        const extra = { afterPath: `check_excede/${ingre.articulo_combo}`, parameters: { cantidad: cantidad_calculada } };
        await this.articuloClass.getAll(extra).then((res) => {
          const excede = res['data'];
          if (excede) {
            this.cantidad_producir = null;
            this.ingredientesParaProduccion = [];

            this.fun.toastError('No tiene suficiente ' + ingre.nombre + ', para realizar la cantidad introducida de ' + this.producto_terminado_en_turno.nombre, 'ERROR');
            this.enfocarInput('cantidad_producir');
          } else {
            this.ingredientesParaProduccion.push({
              nombre: ingre.nombre,
              existencia: obj,
              articulo_id: ingre.articulo_id,
              contenido: ingre.contenido,
              articulo_combo: ingre.articulo_combo,
              cantidad_en_unidades: ingre.medida == 'Unidad' ? obj.Unidad : obj.Libra,
              medida: ingre.medida,
            });

            this.ingredientesParaProduccion = _.orderBy(this.ingredientesParaProduccion, ['articulo_combo'], ['asc']);
          }
        });
      });
    }
  }

  borrar() {
    if (this.articuloEditando) this.agregarAlista();

    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.producto_terminado_en_turno = null;
    this.medida_producir = null;
    this.cantidad_producir = null;
    this.articuloEditando = undefined;
  }

  paginateChange(arg) {}

  agregarAlista() {
    const obj = {
      nombre: this.producto_terminado_en_turno.nombre,
      cantidad: this.cantidad_producir,
      cantidad_en_unidades: this.medida_producir === 'Quintal' ? this.cantidad_producir * 100 : this.cantidad_producir,
      medida: this.medida_producir,
      articulo_id: _.parseInt(this.producto_terminado_en_turno.id),
      id: _.parseInt(this.producto_terminado_en_turno.id),
      ingredientes: this.ingredientesParaProduccion,
      formulas_productos_terminados: this.producto_terminado_en_turno.formulas_productos_terminados,
    };

    this.lista_produccion.push(obj);

    this.tServ.Func_total_paginas({ total: this.lista_produccion.length, tabla: 'lista_produccion' });

    this.disableOption(this.producto_terminado_en_turno.id, true);
    this.articuloEditando = undefined;
    this.borrar();
    this.enfocarSelect();
  }

  editarItem(item) {
    if (this.articuloEditando) this.agregarAlista();

    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.producto_terminado_en_turno = item.ARG;
    this.cantidad_producir = item.ARG.cantidad;
    this.medida_producir = item.ARG.medida;

    this.articuloEditando = item.ARG;

    setTimeout(() => {
      this.getIngredients();
      this.calcularCantidadAProduccir();

      this.seleccionModal = item.ARG;
      this.tipoModal = 'remover';
      this.decisionModalP(true);
    }, 5);
  }

  abrirModalDinamicText(tipo) {
    const obj = {};
    if (tipo === 'confirmar') obj['texto_modal'] = 'Seguro de que desea confirmar la produccion.';

    this.handleModalForm({
      id: 'confirmar_produccion',
      header: 'Confirmar',
      width: '510px',
      html: `<p> ${obj['texto_modal']} </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => {
              this.confirmarProduccion();
              this.closeModal(instance);
            },
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }
  closeModal(modalInstance) {
    console.warn('modalInstance: ', modalInstance);

    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }

  decisionModalP(bool) {
    const listaTemp = JSON.parse(JSON.stringify(this.lista_produccion));
    if (bool) {
      if (this.tipoModal === 'remover') {
        this.lista_produccion = [];
        this.disableOption(this.seleccionModal.articulo_id, false);
        this.lista_produccion = _.remove(listaTemp, (item) => item.articulo_id !== this.seleccionModal.articulo_id);
      } else {
        this.lista_produccion.forEach((element) => this.disableOption(element.articulo_id, false));

        this.lista_produccion = [];
        this.borrar();
      }
    }
    this.tServ.Func_total_paginas({ total: this.lista_produccion.length, tabla: 'lista_produccion' });
  }

  formarIngredientes(ingredientes) {
    const ingredientes_format = [];

    for (let i = 0; i < ingredientes.length; i++) {
      const ingrediente = ingredientes[i];

      const obj = {
        articulo_combo: ingrediente.articulo_combo,
        cantidad_en_unidades: ingrediente.cantidad_en_unidades,
      };
      ingredientes_format.push(obj);
    }
    return ingredientes_format;
  }

  async confirmarProduccion() {
    const obj = JSON.parse(JSON.stringify(this.lista_produccion));
    const produccion_send = {};

    const detalle = [];

    obj.forEach((produccion, i) => {
      detalle.push({
        articulo_id: produccion.articulo_id,
        cantidad: produccion.cantidad,
        cantidad_en_unidades: produccion.cantidad_en_unidades,
        medida: produccion.medida,
        ingredientes: this.formarIngredientes(produccion.ingredientes),
      });
    });

    produccion_send['numero'] = null;
    produccion_send['fecha_equivalente'] = null;
    produccion_send['detalles_produccion'] = detalle;

    this.produccionClass.createUpdateOne(produccion_send).then((res) => {
      this.decisionModalP('cancelarP');
      this.getProductosTerminados();
    });
  }
}
