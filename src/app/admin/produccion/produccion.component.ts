import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DBservice } from '../../core/services/bdservice.service';
import * as _ from 'lodash';
import { GLOBAL } from '../../core/services/GLOBAL';
import { mixinClass } from '../mixinClass';
import { TablasService, obj_paginate_default } from '../components/tablas/tablas.service';
import { ArticuloC, tipos_articulos } from '../registros/articulos/articulo';
@Component({
  selector: 'app-produccion',
  templateUrl: './produccion.component.html',
  styleUrls: ['./produccion.component.scss'],
})
export class ProduccionComponent extends mixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;

  // listaArticulos: any;
  producto_terminado_en_turno;
  cantidad_producir;
  medida_producir;

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
  tipoModal: string;

  listaProductos = [];
  articuloEditando: any;
  articuloClass = new ArticuloC();

  constructor(private dbServ: DBservice, private tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'produccion', _lista_subs: ['decisionModal'] });

    this.getProductosTerminados();
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  ngOnDestroy() {
    this._destroy_mixin();

    this.tServ.obj_paginate = obj_paginate_default;
    this.tServ.Func_total_paginas(1);
  }

  decisionModal(res) {
    if (this.fun.hasValue(res) && (this.tipoModal === 'remover' || this.tipoModal === 'cancelarP')) {
      this.decisionModalP(res);
    } else if (this.fun.hasValue(res) && this.tipoModal === 'confirmar_produccion') {
      this.confirmarProduccion();
    }
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
    this.ingredientes = _.orderBy(this.producto_terminado_en_turno.formulas_productos_terminados, ['articulo_id'], ['asc']);
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

  isLibraOrQuintal(objeto) {
    let presentar = 'Quintal';
    if (objeto.Quintal && objeto.Libra > 100) presentar = 'Quintal';
    else presentar = 'Libra';

    return presentar;
  }

  lookprincipal(objeto) {
    const presentar = this.isLibraOrQuintal(objeto);
    const cantidad = objeto[presentar];
    const fin = cantidad === 1 ? presentar : this.medidas[presentar];

    return `${GLOBAL.numFormatTwoDecimals(cantidad)} ${fin}`;
  }

  saltar(campo) {
    if (campo !== 'agregar') {
      this.enfocarInput(campo);
    } else {
      if (this.producto_terminado_en_turno) {
        const is_invalid = this.abilitarBtnAgregar();
        if (!is_invalid) setTimeout(() => this.agregarAlista(), 250);
      }
    }
  }
  // TODO: cambiar la forma de desabilitar
  disableOption(arg, boolean) {
    (this.element = document.getElementById(arg) as any).disabled = boolean;
  }

  abilitarBtnAgregar() {
    let res = true;
    if (this.producto_terminado_en_turno && this.cantidad_producir && this.medida_producir) res = false;
    return res;
  }

  abilitarBtnConfirmar() {
    let res = true;
    if (this.lista_produccion.length > 0) res = false;
    return res;
  }

  calcularCantidadAProduccir() {
    this.ingredientesParaProduccion = [];

    if (this.cantidad_producir && this.medida_producir) {
      this.ingredientes.forEach(async (ingre) => {
        let cantidadFormula = ingre.cantidad;

        if (this.medida_producir === 'Libra') cantidadFormula = cantidadFormula / 100;

        let cantidad_calculada = cantidadFormula * this.cantidad_producir;

        const obj = { Quintal: cantidad_calculada / 100, Libra: cantidad_calculada };

        if (this.lista_produccion.length > 0) {
          for (let i = 0; i < this.lista_produccion.length; i++) {
            const element = this.lista_produccion[i];

            if (element.ingredientes.length > 0) {
              for (let j = 0; j < element.ingredientes.length; j++) {
                const ingrediente = element.ingredientes[j];
                if (ingrediente.nombre === ingre.nombre) cantidad_calculada += ingrediente.cantidad;
              }
            }
          }
        }

        try {
          const res = await this.dbServ.getIngredienteExcede(ingre.articulo_id, cantidad_calculada).toPromise();

          if (res.excede) {
            this.cantidad_producir = null;
            this.ingredientesParaProduccion = [];

            this.fun.toastError('No tiene suficiente ' + ingre.nombre + ', para realizar la cantidad introducida de ' + this.producto_terminado_en_turno.nombre, 'ERROR');
            this.enfocarInput('cantidad_producir');
          } else {
            this.ingredientesParaProduccion.push({ nombre: ingre.nombre, existencia: obj, articulo_id: ingre.articulo_id });
            this.ingredientesParaProduccion = _.orderBy(this.ingredientesParaProduccion, ['articulo_id'], ['asc']);
          }
        } catch (error) {
          if (error.error) this.fun.toastError(error.error.msg, 'ERROR');
        }
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
    this.ingredientesParaProduccion.forEach((ingre) => {
      ingre.cantidad = this.medida_producir === 'Quintal' ? ingre.existencia.Quintal : ingre.existencia.Quintal;
      ingre.cantidad_en_unidades = ingre.existencia.Libra;
      ingre.articulo_id = ingre.articulo_id;

      delete ingre.existencia;
    });

    const obj = {
      nombre: this.producto_terminado_en_turno.nombre,
      cantidad: this.cantidad_producir,
      cantidad_en_unidades: this.medida_producir === 'Quintal' ? this.cantidad_producir * 100 : this.cantidad_producir,
      medida: this.medida_producir,
      articulo_id: _.parseInt(this.producto_terminado_en_turno),
      ingredientes: this.ingredientesParaProduccion,
    };

    this.lista_produccion.push(obj);

    this.tServ.Func_total_paginas(this.lista_produccion.length);

    this.disableOption('prod-' + this.producto_terminado_en_turno, true);
    this.articuloEditando = undefined;
    this.borrar();
  }

  editarItem(item) {
    if (this.articuloEditando) this.agregarAlista();

    this.ingredientes = [];
    this.ingredientesParaProduccion = [];
    this.producto_terminado_en_turno = item.ARG.articulo_id;
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
    this.abrirModal('dinamico_texto', obj, 'confirmar_produccion');
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
        this.tServ.Func_total_paginas(this.lista_produccion.length);
      } else {
        this.lista_produccion.forEach((element) => {
          this.disableOption('prod-' + element.articulo_id, false);
        });
        this.lista_produccion = [];
        this.borrar();
      }
    }
    this.tServ.Func_total_paginas(this.lista_produccion.length);
  }

  async confirmarProduccion() {
    const obj = JSON.parse(JSON.stringify(this.lista_produccion));
    const produccion_send = {};

    const empleado = this.fun.getUser();

    const detalle = [];

    obj.forEach((produccion, i) => {
      detalle.push({
        articulo_id: produccion.articulo_id,
        cantidad: produccion.cantidad,
        cantidad_en_unidades: produccion.cantidad_en_unidades,
        medida: produccion.medida,
      });
    });

    produccion_send['user_id'] = empleado.id;
    produccion_send['numero'] = null;
    produccion_send['fecha_equivalente'] = null;
    produccion_send['detalles_produccion_attributes'] = detalle;

    try {
      const res = await this.dbServ.createProduccion(produccion_send).toPromise();
      this.succes();
    } catch (error) {
      console.error(error);
      if (error.error) this.fun.toastError(error.error.msg, 'Error');
    }
  }

  succes() {
    this.fun.toastSuccess('Producción registrada.', 'Correcto');
    this.tipoModal;
    this.decisionModalP('cancelarP');
    this.borrar();
  }

  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.fun.toastError(element, 'Error');
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
