import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import { MixinClass } from '../../core/typescript/MixinClass';
import { TablasService } from '../components/new_tablas/tablas.service';
import { ArticuloC, tipos_articulos } from '../registros/articulos/articulo';
import { ProduccionC } from './produccion';
import * as $ from 'jquery';
import { fun } from '../../core/services/functions.service';
import { medidas, table_config } from '../components/new_tablas/tabla-class';
import { ConfigI } from '../../core/typescript/config-interface';
import { SingletonService } from '../../core/services/singleton.service';
import { ModalClass } from '../components/modal/modal-class';
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

  optionsMedidas = [];

  info = [];

  table_config: table_config = {
    info: [
      { titulo: 'Producto', tipo: 'text', key: 'nombre' },
      { titulo: 'Cantidad', tipo: 'formatoNumero', key: 'cantidad' },
      { titulo: 'Medida', tipo: 'text', key: 'medida' },
    ],
    colores: true,
    id_tabla: 'lista_produccion',
    obj_paginate: { show: true,showTotal:true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: true },
    botones: { editar: { show: true, permiso: null }, borrar: { show: true, permiso: null } },
  };
  tablaComponent;

  configApp: ConfigI;
  listaProductos = [];
  articuloEditando: any;
  articuloClass = new ArticuloC();
  produccionClass = new ProduccionC();

  constructor(private tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'produccion', is_routing: true });
    this.configApp = SingletonService.configServ.getConfig({ isPromise: false }) as ConfigI;
    this.optionsMedidas[0] = this.configApp.medida_producto_terminado;

    this.getProductosTerminados();
  }

  ngAfterViewInit(): void {
    this.enfocarSelect();
    this.tablaComponent.changeConfig([{ total_count: 0 }]);
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

  enfocarSelect() {
    var fields = $('#cantidad_producir').parents('form:eq(0),body').find(':input').not('[tabindex]');
    fields.eq(0).focus();
  }

  async getProductosTerminados() {
    const fechaActual = this.formarFechaFactura(new Date())['FechaFactura'];
    this.listaProductos.length = 0;
    this.articuloClass.getArticulosFiltrado({ buscar: ' ', fecha: fechaActual, paginado: false, tipo: tipos_articulos.producto_terminado }).then((res) => {
      res['data'].map((producto_terminado) => {
        producto_terminado.optionDisabled = false;
        this.listaProductos.push(producto_terminado);
      });
    });
  }

  async getIngredients() {
    this.ingredientes = _.orderBy(this.producto_terminado_en_turno.formulas_productos_terminados, ['articulo_combo'], ['asc']);
    this.ingredientesParaProduccion.length = 0;
    [this.cantidad_producir, this.medida_producir] = Array(2).fill(null);
  }

  lookOters(objeto) {
    const keys = _.keys(objeto);
    const values = _.values(objeto);

    const fin = values[0] > 1 ? medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? medidas[keys[2]] : keys[2];

    const principal = fun.numFormatTwoDecimals(values[0]) + '  ' + fin;

    const padre = fun.numFormatTwoDecimals(values[1]) + '  ' + fin1;
    const hijo = fun.numFormatTwoDecimals(values[2]) + '  ' + fin2;

    let cantiTootip = ``;
    if (keys.length > 1) {
      if (keys.length == 2) cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br></div>`;
      else cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br> <span>${hijo}</span><br> </div>`;
    } else cantiTootip = `<div style=" max-width: 21rem;" > <span> ${principal} </span><br></div>`;

    return cantiTootip;
  }

  ingredientesScroll(arg) {
    const divs = ['inventario_scroll', 'produccion_scroll'];
    let div_opuesto_id = _.find(divs, (item) => item != arg.element_id);
    const div_opuesto = document.getElementById(div_opuesto_id);

    if (fun.hasValue(div_opuesto)) div_opuesto.scrollTop = arg.element.scrollTop;
  }

  existenciaConTooltip(objeto) {
    let llevaTooltip = true;

    if (_.has(objeto.existencia, 'Caja')) llevaTooltip = objeto.existencia.Unidad >= objeto.contenido.Caja && objeto.existencia.Caja > 0;
    else if (_.has(objeto.existencia, 'Saco')) llevaTooltip = objeto.existencia.Libra >= objeto.contenido.Saco && objeto.existencia.Saco > 0;
    else if (_.has(objeto.existencia, 'Unidad')) llevaTooltip = false;
    else if (_.has(objeto.existencia, 'Galon')) llevaTooltip = objeto.existencia.Onza >= objeto.contenido.Galon && objeto.existencia.Galon > 0;
    else llevaTooltip = objeto.existencia.Libra > 100;

    return llevaTooltip;
  }

  lookprincipal(objeto) {
    let mostrar;

    if (_.has(objeto.existencia, 'Caja')) {
      if (objeto.existencia.Unidad >= objeto.contenido.Caja && objeto.existencia.Caja > 0) {
        mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Caja)} ${objeto.existencia.Caja === 1 ? 'Caja' : 'Cajas'}`;
      } else mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Unidad)} ${objeto.existencia.Unidad === 1 ? 'Unidad' : 'Unidades'}`;
    } else if (_.has(objeto.existencia, 'Saco')) {
      if (objeto.existencia.Libra >= objeto.contenido.Saco && objeto.existencia.Saco > 0) {
        mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Saco)} ${objeto.existencia.Saco === 1 ? 'Saco' : 'sacos'}`;
      } else mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Libra)} ${objeto.existencia.Libra === 1 ? 'Libra' : 'Libras'}`;
    } else if (_.has(objeto.existencia, 'Galon')) {
      if (objeto.existencia.Onza >= objeto.contenido.Galon && objeto.existencia.Galon > 0) {
        mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Galon)} ${objeto.existencia.Galon === 1 ? 'Galon' : 'Galones'}`;
      } else mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Onza)} ${objeto.existencia.Onza === 1 ? 'Onza' : 'Onzas'}`;
    } else if (_.has(objeto.existencia, 'Unidad')) {
      mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Unidad)} ${objeto.existencia.Unidad === 1 ? 'Unidad' : 'Unidades'}`;
    } else {
      if (objeto.existencia.Libra >= 100) mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Quintal)} ${objeto.existencia.Quintal === 1 ? 'Quintal' : 'Quintales'}`;
      else mostrar = `${fun.numFormatTwoDecimals(objeto.existencia.Libra)} ${objeto.existencia.Libra === 1 ? 'Libra' : 'Libras'}`;
    }

    return mostrar;
  }

  saltar(campo) {
    if (campo != 'agregar') {
      fun.enfocarInput(campo);
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

  activateAllOptions() {
    const deactivated = _.filter(this.listaProductos, { optionDisabled: true });
    for (const iterator of deactivated) this.disableOption(iterator.id, false);
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
      this.ingredientes.forEach(async (ingrediente) => {
        let cantidad_formula = ingrediente.cantidad;
        let contenidos_ingrediente = ingrediente.contenido;
        const contenido_a_producir = {};
        let cantidad_calculada = cantidad_formula * this.cantidad_producir;

        for (const key in contenidos_ingrediente) {
          const contenido = contenidos_ingrediente[key];

          if (!key.includes('Saco_')) {
            contenido_a_producir[key] = cantidad_calculada / contenido;
          }
        }

        if (this.lista_produccion.length > 0) {
          const all_ingredientes = _.flattenDeep(
            _.map(this.lista_produccion, (producto) => {
              const producto_distinto_en_lista = producto.articulo_id != ingrediente.articulo_id ? _.get(producto, 'ingredientes') : [];
              return producto_distinto_en_lista;
            }),
          );
          const ingredientesIguales = _.filter(all_ingredientes, (item) => item.articulo_combo == ingrediente.articulo_combo);

          if (ingredientesIguales.length) cantidad_calculada = _.reduce(ingredientesIguales, (acumulado, item) => acumulado + item.cantidad_en_unidades, cantidad_calculada);
        }

        const extra = { afterPath: `check_excede/${ingrediente.articulo_combo}`, parameters: { cantidad: cantidad_calculada } };

        await this.articuloClass.getAll(extra).then((res) => {
          const excede = res['data'];
          if (excede) {
            this.cantidad_producir = null;
            this.ingredientesParaProduccion = [];

            fun.toastError('No tiene suficiente ' + ingrediente.nombre + ', para realizar la cantidad introducida de ' + this.producto_terminado_en_turno.nombre, 'ERROR');
            fun.enfocarInput('cantidad_producir');
          } else {
            this.ingredientesParaProduccion.push({
              nombre: ingrediente.nombre,
              existencia: contenido_a_producir,
              articulo_id: ingrediente.articulo_id,
              contenido: ingrediente.contenido,
              articulo_combo: ingrediente.articulo_combo,
              cantidad_en_unidades: contenido_a_producir[ingrediente.medida],
              medida: ingrediente.medida,
            });
            this.ingredientesParaProduccion = _.orderBy(this.ingredientesParaProduccion, ['articulo_combo'], ['asc']);
          }
        });
      });
    }
  }

  borrarForm() {
    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    [this.producto_terminado_en_turno, this.medida_producir, this.cantidad_producir, this.articuloEditando] = Array(4).fill(null);
  }

  agregarAlista() {
    const prod_en_lista = _.find(this.lista_produccion, { id: this.producto_terminado_en_turno.id });
    if (prod_en_lista) {
      prod_en_lista.cantidad = this.cantidad_producir;
      prod_en_lista.cantidad_en_unidades = this.cantidad_producir * this.producto_terminado_en_turno.contenido[this.medida_producir];
      prod_en_lista.medida = this.medida_producir;
      prod_en_lista.ingredientes = this.ingredientesParaProduccion;
    } else {
      const obj = {
        nombre: this.producto_terminado_en_turno.nombre,
        cantidad: this.cantidad_producir,
        cantidad_en_unidades: this.cantidad_producir * this.producto_terminado_en_turno.contenido[this.medida_producir],
        medida: this.medida_producir,
        articulo_id: _.parseInt(this.producto_terminado_en_turno.id),
        id: _.parseInt(this.producto_terminado_en_turno.id),
        ingredientes: this.ingredientesParaProduccion,
        formulas_productos_terminados: this.producto_terminado_en_turno.formulas_productos_terminados,
      };

      this.lista_produccion.push(obj);
      setTimeout(() => this.tablaComponent.changeConfig([{ total_count: this.lista_produccion.length }]), 100);
    }

    this.disableOption(this.producto_terminado_en_turno.id, true);
    this.articuloEditando = undefined;
    this.borrarForm();
    this.enfocarSelect();
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.abrirModalDinamicText('borrar', `Seguro de que desea remover el producto: <b>${params.data.nombre}</b>, de esta producción.`, params.data);
  }

  editarItem(data) {
    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.articuloEditando = data;
    setTimeout(() => {
      this.cantidad_producir = data.cantidad;
      this.medida_producir = data.medida;
    }, 10);

    this.producto_terminado_en_turno = _.find(this.listaProductos, { id: data.id });

    setTimeout(() => {
      this.getIngredients();
      this.ingredientesParaProduccion = data.ingredientes;
    }, 5);
  }

  eliminarReg(data) {
    this.disableOption(data.id, false);
    _.remove(this.lista_produccion, { articulo_id: data.id });
    this.tablaComponent.changeConfig([{ total_count: this.lista_produccion.length }]);
  }

  abrirModalDinamicText(tipo, texto_modal, data) {
    const functions = {
      confirmar: (instance, data?) => {
        this.confirmarProduccion();
        this.closeModal(instance);
      },
      borrar: (instance, data) => {
        this.eliminarReg(data);
        this.closeModal(instance);
      },
      cancelarP: (instance, data) => {
        this.borrarForm();
        this.activateAllOptions();
        this.lista_produccion.length = 0;
        this.closeModal(instance);
      },
    };

    this.openNewModal({
      id: 'produccion_modal',
      header: 'Confirmar',
      width: '510px',
      html: `<p> ${texto_modal} </p>`,
      botones: {
        ...ModalClass.noShowAceptarCancelarButtons,
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => this.closeModal(instance), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => functions[tipo](instance, data),
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
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
    const obj = fun.duplicarJson(this.lista_produccion);
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
      this.getProductosTerminados();
      this.borrarForm();
      this.lista_produccion.length = 0;
    });
  }
}
