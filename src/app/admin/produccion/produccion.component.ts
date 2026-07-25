import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { ArticuloC, ArticuloI, tipos_articulos } from '@registros/articulos/articulo';
import { ProduccionC } from './produccion';
import { fun } from '@core/services/functions.service';
import { default_per_page, medidas, table_config } from '@components/new_tablas/tabla-class';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
@Component({
  selector: 'app-produccion',
  templateUrl: './produccion.component.html',
  styleUrls: ['./produccion.component.scss'],
  standalone: false,
})
export class ProduccionComponent extends MixinClass implements OnInit, OnDestroy {
  producto_terminado_en_turno;
  cantidad_producir;
  medida_producir = '';

  lista_produccion = signal<any[]>([]);
  ingredientes = [];
  ingredientesParaProduccion = [];

  optionsMedidas = [];

  tableIsInitialized = signal<boolean>(false);
  table_config: table_config = {
    info: [
      { titulo: 'Producto', tipo: 'text', key: 'nombre' },
      { titulo: 'Cantidad', tipo: 'formatoNumero', key: 'cantidad' },
      { titulo: 'Medida', tipo: 'text', key: 'medida' },
    ],
    colores: true,
    id_tabla: 'lista_produccion',
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: true },
    botones: { editar: { show: true, permiso: null }, borrar: { show: true, permiso: null } },
  };
  tablaComponent;

  configApp: ConfigI;
  listaProductos = signal<ArticuloI[]>([]);
  articuloEditando: any;
  articuloClass = new ArticuloC();
  produccionClass = new ProduccionC();

  enfocarInput = fun.enfocarInput;
  htmlServ = inject(HtmlElementsService);
  dynamicModalServ = inject(DynamicModalService);

  constructor() {
    super();
    effect(() => {
      if (this.tableIsInitialized()) {
        this.tablaComponent.changeTableConfig([{ total_count: 0 }]);
      }
    });
  }

  ngOnInit() {
    this._init_mixin({ component: 'produccion', is_routing: true });
    this.configApp = Ss.configServ.config;
    this.optionsMedidas[0] = this.configApp.medida_producto_terminado;

    this.getProductosTerminados();
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  async getProductosTerminados() {
    const fechaActual = this.formarFechaFactura(new Date())['FechaFactura'];

    this.articuloClass.getArticulosFiltrado({ buscar: ' ', fecha: fechaActual, paginado: false, tipo: tipos_articulos.producto_terminado, mode: 'formula' }).then(res => {
      res['data'].map(producto_terminado => {
        producto_terminado.optionDisabled = false;
        this.listaProductos.update(prev => [...prev, producto_terminado]);
      });
    });
  }

  async getIngredients() {
    this.ingredientes = [...this.producto_terminado_en_turno.formulas_productos_terminados].sort((a, b) => fun.compare(a, b, 'articulo_combo', 'asc'));
    this.ingredientesParaProduccion.length = 0;
    this.cantidad_producir = null;
    this.medida_producir = '';
  }

  lookOters(objeto) {
    const keys = Object.keys(objeto);
    const values = Object.values(objeto) as Array<number>;

    const fin = values[0] > 1 ? medidas[keys[0]] : keys[0];
    const fin1 = values[1] > 1 ? medidas[keys[1]] : keys[1];
    const fin2 = values[2] > 1 ? medidas[keys[2]] : keys[2];

    const principal = fun.roundNumberToDecimal(values[0]) + '  ' + fin;

    const padre = fun.roundNumberToDecimal(values[1]) + '  ' + fin1;
    const hijo = fun.roundNumberToDecimal(values[2]) + '  ' + fin2;

    let cantiTootip = ``;
    if (keys.length > 1) {
      if (keys.length == 2) {
        cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br></div>`;
      } else {
        cantiTootip = `<div style=" max-width: 21rem;" > <span> ${padre} </span><br> <span>${hijo}</span><br> </div>`;
      }
    } else {
      cantiTootip = `<div style=" max-width: 21rem;" > <span> ${principal} </span><br></div>`;
    }

    return cantiTootip;
  }

  ingredientesScroll(arg) {
    const divs = ['inventario_scroll', 'produccion_scroll'];
    let div_opuesto_id = divs.find(item => item != arg.element_id);
    const div_opuesto = document.getElementById(div_opuesto_id);

    if (fun.hasValue(div_opuesto)) div_opuesto.scrollTop = arg.element.scrollTop;
  }

  existenciaConTooltip(objeto) {
    let llevaTooltip = true;

    if (fun.objHas(objeto.existencia, 'Caja')) llevaTooltip = objeto.existencia.Unidad >= objeto.contenido.Caja && objeto.existencia.Caja > 0;
    else if (fun.objHas(objeto.existencia, 'Saco')) llevaTooltip = objeto.existencia.Libra >= objeto.contenido.Saco && objeto.existencia.Saco > 0;
    else if (fun.objHas(objeto.existencia, 'Unidad')) llevaTooltip = false;
    else if (fun.objHas(objeto.existencia, 'Galon')) llevaTooltip = objeto.existencia.Onza >= objeto.contenido.Galon && objeto.existencia.Galon > 0;
    else llevaTooltip = objeto.existencia.Libra > 100;

    return llevaTooltip;
  }

  lookprincipal(objeto) {
    let mostrar;

    if (fun.objHas(objeto.existencia, 'Caja')) {
      if (objeto.existencia.Unidad >= objeto.contenido.Caja && objeto.existencia.Caja > 0) {
        mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Caja)} ${objeto.existencia.Caja === 1 ? 'Caja' : 'Cajas'}`;
      } else mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Unidad)} ${objeto.existencia.Unidad === 1 ? 'Unidad' : 'Unidades'}`;
    } else if (fun.objHas(objeto.existencia, 'Saco')) {
      if (objeto.existencia.Libra >= objeto.contenido.Saco && objeto.existencia.Saco > 0) {
        mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Saco)} ${objeto.existencia.Saco === 1 ? 'Saco' : 'sacos'}`;
      } else mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Libra)} ${objeto.existencia.Libra === 1 ? 'Libra' : 'Libras'}`;
    } else if (fun.objHas(objeto.existencia, 'Galon')) {
      if (objeto.existencia.Onza >= objeto.contenido.Galon && objeto.existencia.Galon > 0) {
        mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Galon)} ${objeto.existencia.Galon === 1 ? 'Galon' : 'Galones'}`;
      } else mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Onza)} ${objeto.existencia.Onza === 1 ? 'Onza' : 'Onzas'}`;
    } else if (fun.objHas(objeto.existencia, 'Unidad')) {
      mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Unidad)} ${objeto.existencia.Unidad === 1 ? 'Unidad' : 'Unidades'}`;
    } else {
      if (objeto.existencia.Libra >= 100) mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Quintal)} ${objeto.existencia.Quintal === 1 ? 'Quintal' : 'Quintales'}`;
      else mostrar = `${fun.roundNumberToDecimal(objeto.existencia.Libra)} ${objeto.existencia.Libra === 1 ? 'Libra' : 'Libras'}`;
    }

    return mostrar;
  }

  saltar(campo) {
    if (campo != 'agregar') {
      fun.enfocarInput(campo);
    } else {
      if (this.producto_terminado_en_turno) {
        const is_invalid = this.formIsInvalid();
        if (!is_invalid)
          fun.setTimeout(() => {
            this.agregarAlista();
          }, 250);
      }
    }
  }

  disableOption(id, boolean) {
    let optionSelected = this.listaProductos().find(item => item.id == id);

    optionSelected.optionDisabled = boolean;
  }

  activateAllOptions() {
    const deactivated = this.listaProductos().filter(item => (item.optionDisabled = true));
    for (const iterator of deactivated) this.disableOption(iterator.id, false);
  }

  formIsInvalid() {
    let res = true;
    if (this.producto_terminado_en_turno && this.cantidad_producir && this.medida_producir) res = false;
    return res;
  }

  habilitarBtnConfirmar() {
    let res = true;
    if (this.lista_produccion() && this.lista_produccion().length > 0) res = false;
    return res;
  }

  getIngredienteArticuloId(ingrediente) {
    return ingrediente?.articulo_combo_id ?? ingrediente?.articulo_combo?.id ?? ingrediente?.articulo_combo;
  }

  async calcularCantidadAProduccir() {
    this.ingredientesParaProduccion = [];

    if (!this.cantidad_producir || !this.medida_producir) return;

    const listaProduccion = this.lista_produccion();
    const tieneProduccionPrevia = listaProduccion.length > 0;

    for (const ingrediente of this.ingredientes) {
      const articuloComboId = this.getIngredienteArticuloId(ingrediente);

      if (!fun.hasValue(articuloComboId)) {
        fun.toastError(`No se pudo identificar el artículo ingrediente ${ingrediente.nombre}.`, 'ERROR');
        return;
      }

      const contenidoAProducir = {};
      let cantidadCalculada = ingrediente.cantidad * this.cantidad_producir;

      for (const [clave, valorContenido] of Object.entries(ingrediente.contenido)) {
        if (!clave.includes('Saco_')) contenidoAProducir[clave] = cantidadCalculada / (valorContenido as number);
      }

      if (tieneProduccionPrevia) {
        const todosLosIngredientes = listaProduccion.flatMap(producto => (producto.articulo_id !== ingrediente.articulo_id ? fun.getProperty(producto, 'ingredientes') : []));

        const ingredientesIguales = todosLosIngredientes.filter(item => this.getIngredienteArticuloId(item) === articuloComboId);

        if (ingredientesIguales.length) {
          cantidadCalculada = ingredientesIguales.reduce((acumulado, item) => acumulado + item.cantidad_en_unidades, cantidadCalculada);
        }
      }

      const parametrosVerificacion = { afterPath: `check_excede/${articuloComboId}`, parameters: { cantidad: cantidadCalculada } };
      const respuesta = await this.articuloClass.getAll(parametrosVerificacion);
      const excedeExistencia = respuesta['data'];

      if (excedeExistencia) {
        this.cantidad_producir = null;
        this.ingredientesParaProduccion = [];
        fun.toastError(`No tiene suficiente ${ingrediente.nombre}, para realizar la cantidad introducida de ${this.producto_terminado_en_turno.nombre}`, 'ERROR');
        fun.enfocarInput('cantidad_producir');
        return;
      }

      this.ingredientesParaProduccion.push({
        nombre: ingrediente.nombre,
        existencia: contenidoAProducir,
        articulo_id: ingrediente.articulo_id,
        contenido: ingrediente.contenido,
        articulo_combo: ingrediente.articulo_combo,
        articulo_combo_id: articuloComboId,
        cantidad_en_unidades: contenidoAProducir[ingrediente.medida],
        medida: ingrediente.medida,
      });
    }
  }

  borrarForm() {
    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.producto_terminado_en_turno = null;
    this.medida_producir = '';
    this.cantidad_producir = null;
    this.articuloEditando = null;
  }

  agregarAlista() {
    const prod_en_lista = this.lista_produccion().find(product => product.id == this.producto_terminado_en_turno.id);

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
        articulo_id: Number(this.producto_terminado_en_turno.id),
        id: Number(this.producto_terminado_en_turno.id),
        ingredientes: this.ingredientesParaProduccion,
        formulas_productos_terminados: this.producto_terminado_en_turno.formulas_productos_terminados,
      };

      this.lista_produccion.update(prev => [...prev, obj]);

      fun.setTimeout(() => {
        this.tablaComponent.changeTableConfig([{ total_count: this.lista_produccion().length }]);
      }, 100);
    }

    this.disableOption(this.producto_terminado_en_turno.id, true);
    this.articuloEditando = undefined;
    this.borrarForm();
    fun.enfocarInput('cantidad_producir');
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.abrirModalDinamicText('borrar', params.data);
  }

  editarItem(data) {
    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.articuloEditando = data;
    fun.setTimeout(() => {
      this.cantidad_producir = data.cantidad;
      this.medida_producir = data.medida;
    }, 10);

    this.producto_terminado_en_turno = this.listaProductos().find(product => product.id == data.id);

    fun.setTimeout(() => {
      this.getIngredients();
      this.ingredientesParaProduccion = data.ingredientes;
    }, 5);
  }

  eliminarReg(data) {
    this.disableOption(data.id, false);
    this.lista_produccion.update(prev => prev.filter(item => item.articulo_id != data.id));
    this.tablaComponent.changeTableConfig([{ total_count: this.lista_produccion().length }]);
  }

  abrirModalDinamicText(tipo, data = null) {
    const msgConfig = {
      confirmar: 'Seguro de que desea confirmar la produccion.',
      borrar: `Seguro de que desea remover el producto: <b>${data?.nombre}</b>, de esta producción.`,
      cancelarP: 'Seguro de que desea cancelar la produccion.',
    };

    const config = {
      confirmar: {
        buttons: confirmationButtons.cancelarAceptar,
        function: (data?) => this.confirmarProduccion(),
      },
      borrar: {
        buttons: confirmationButtons.cancelarEliminar,
        function: data => this.eliminarReg(data),
      },
      cancelarP: {
        buttons: confirmationButtons.cancelarAceptar,
        function: data => this.cancelarProduccion(),
      },
    };

    this.dynamicModalServ.confirmationModal({
      id: 'cancelar_ingreso',
      texto: `<p> ${msgConfig[tipo]} </p>`,
      btnKind: config[tipo].buttons,
      onYes: config[tipo].function.bind(this, data),
    });
  }

  cancelarProduccion() {
    this.borrarForm();
    this.activateAllOptions();
    this.lista_produccion.set([]);
  }

  formarIngredientes(ingredientes) {
    const ingredientes_format = [];

    for (let i = 0; i < ingredientes.length; i++) {
      const ingrediente = ingredientes[i];

      const obj = {
        articulo_combo: ingrediente.articulo_combo,
        articulo_combo_id: ingrediente.articulo_combo_id ?? ingrediente?.articulo_combo?.id,
        cantidad_en_unidades: ingrediente.cantidad_en_unidades,
      };
      ingredientes_format.push(obj);
    }
    return ingredientes_format;
  }

  async confirmarProduccion() {
    const obj = fun.deepCloning(this.lista_produccion());
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

    this.produccionClass.createUpdateOne(produccion_send).then(res => {
      this.cancelarProduccion();
      this.getProductosTerminados();
    });
  }
}
