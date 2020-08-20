import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ModalService } from '../components/modal/modal.service';
import { ObservableServcie } from '../../core/services/observables.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TablasService, obj_paginate } from '../components/tablas/tablas.service';

@Component({
  selector: 'app-conduce',
  templateUrl: './conduce.component.html',
  styleUrls: ['./conduce.component.scss'],
})
export class ConduceComponent implements OnInit, OnDestroy, AfterViewInit {
  listaClientes;

  cliente;
  facturas_adelantadas = [];
  facturas_adelantadas_wait = [];

  form: FormGroup;
  ARRAY_ROWARTICULOS: any;
  tipoModal: string;
  indexRemove: any;
  control: FormArray;

  secuencia = 0;
  inputSecuencia = 'cod-0';
  inputDrop = 'uni-0';
  drop = false;
  listaArticulos = [];
  UnidadesArticulo: any[];
  sacos = [25, 50, 100];

  TOTAL: number;

  obj_paginate_ = obj_paginate;

  subDeci: Subscription;
  subObj: Subscription;
  subEsc: Subscription;
  subInde: Subscription;

  info = [
    {
      titulo: 'Numero Fact',
      key: 'secuencia',
    },
    {
      titulo: 'NCF',
      key: 'numero_comprobante',
    },
    {
      titulo: 'Fecha Facturacion',
      key: 'fecha',
    },
    {
      titulo: 'Total Facturado',
      key: 'total_factura',
      formatoNumero: true,
    },
  ];

  facturaAdelantadaSelected;
  CuerpoConduce = [];
  altoDiv: number;
  constructor(private mServ: ModalService, private obsServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private tServ: TablasService) {}

  ngOnInit() {
    this.form = this.fb.group({
      rowFactura: this.fb.array([this.createItem(0)]),
    });

    this.ARRAY_ROWARTICULOS = this.form['rowFactura'] as FormArray;

    for (let index = 1; index <= 22; index++) {
      this.addItem(index);
    }

    this.necesarioStar();

    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res) {
        if (res.tipoModal === 'buscarCliente') {
          this.cliente = res;
          (document.getElementById('clienteI') as any).value = res.nombre;
          this.BuscarFacturasAdelantadas(res.id);
          setTimeout(() => {
            this.enfocarInput('cod-0');
          }, 10);
          //
        } else if (res.tipoModal === 'buscar') {
          this.clickRowModal(res);
          //
        } else if (res.tipoModal === 'seleccionar_articulos_adelantados') {
          this.llenarConduce(res.body);
        }
        setTimeout(() => {
          this.resetModalVaribales();
        }, 1000);
      }

      // else if (res && res.tipoModal === 'cambio') {
      //   this.Devuelta = res.devuelta;
      //   this.forma_pago = res.forma_pago;
      //   this.sendIngreso();
      //   this.mServ.ModalObj(undefined);
      // }
    });

    this.subDeci = this.mServ.DECISIONMODAL.subscribe(async (res) => {
      if (res) {
        if (this.tipoModal === 'removerArticulo') {
          this.procesoQuitarArticulo();
        }
        if (this.tipoModal === 'cancelar_conduce') {
          this.cancelarConduce(2);
        }
        if (this.tipoModal === 'conduce_lleno') {
          await this.form.reset();
          await this.SeleccionarFactruaAdelantada(this.facturas_adelantadas_wait);
          this.facturas_adelantadas_wait = [];
        }
        if (this.tipoModal === 'imprimir_conduce') {
          await this.sendData();
        }
        setTimeout(() => {
          this.resetModalVaribales();
        }, 1000);
      }
    });

    this.subEsc = this.mServ.PRESSESC.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.enfocarInput('cod-' + res);
      }
    });

    this.subInde = this.mServ.INDEXTOFOCUS.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.noArticuloEncontrado(res);
      }
    });

    this.getArticulos();
  }
  resetModalVaribales() {
    this.mServ.ModalObj(undefined);
    this.mServ.ModalSeleccion(undefined);
    this.mServ.ModalDecision(undefined);
    this.tipoModal = undefined;
  }

  noArticuloEncontrado(arg) {
    this.dbServ.toastError('Articulo no creado', 'ERROR');

    this.enfocarInput('cod-' + arg);
    this.mServ.ModalIndex(undefined);
  }

  ngOnDestroy() {
    this.subDeci.unsubscribe();
    this.subObj.unsubscribe();
    this.subEsc.unsubscribe();
    this.subInde.unsubscribe();

    this.mServ.modalTipo(undefined);
    this.mServ.ModalSeleccion(undefined);
    this.mServ.mostrarModal(false);
  }
  ngAfterViewInit() {
    this.control = this.form.controls['rowFactura'] as FormArray;
  }

  async necesarioStar() {
    this.enfocarInput('clienteI');
  }
  aumentarSecuencia() {
    this.secuencia++;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }

  async procesoQuitarArticulo() {
    await this.removeItem(this.indexRemove);
    await this.disminuirSecuencia();
  }

  disminuirSecuencia() {
    this.secuencia--;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }
  async saltar(input, i) {
    const sigInput = input + i;

    if (i >= 10 && input === 'cod-') {
      this.addItem(i);
    }

    let codigo = (this.control.controls[i] as any).controls['cod'].value;

    if (input === 'can-' && codigo !== '') {
      codigo = _.parseInt(codigo);

      if (_.isInteger(codigo)) {
        codigo = (this.control.controls[i] as any).controls['cod'].value;
        this.buscarArticuloPorCodigo(i, codigo, input);
      } else {
        codigo = (this.control.controls[i] as any).controls['cod'].value;

        if (!codigo) {
          this.enfocarInput('cod-' + i);
          this.selectContenido('cod-' + i);
        } else {
          const obj = { filtrarArticulo: codigo, index: i, metodo: 'venta', data: [] };
          this.abrirModal(obj);
        }
      }
    }

    if (input === 'uni-') {
      const cantidad = (this.control.controls[i] as any).controls['can'].value;

      if (cantidad !== '' && cantidad !== null) {
        if (input === 'uni-' && codigo !== '' && codigo !== null && codigo !== undefined) {
          this.verificarRow(i);
          this.buscarArticuloPorCodigo(i, codigo);
          setTimeout(() => {
            this.enfocarInput(sigInput);
          }, 2);
        }
      }
    }

    if (input === 'cod-' || input === 'pre-') {
      let unidad;
      let index = i;

      if (input === 'cod-') {
        index--;
      }
      unidad = (this.control.controls[index] as any).controls['uni'].value;

      const excede = this.checkCantidadExede(index, unidad, 'saltar');

      if (!excede) {
        if (unidad === '' || unidad === null) {
          setTimeout(() => {
            this.enfocarInput('uni-' + (i - 1));
          }, 5);
        } else {
          this.UnidadesArticulo = [];
          this.aumentarSecuencia();
          this.enfocarInput(sigInput);
        }
      } else {
        this.enfocarInput('can-' + index);
        this.selectContenido('can-' + index);
        setTimeout(() => {
          (this.control.controls[index] as any).controls['uni'].setValue(null);
        }, 2);
      }
    }
  }

  async clickRowModal(arg) {
    const index = _.findIndex(this.listaArticulos, (o: any) => {
      return o.codigo === arg.codigo;
    });

    const cantidades = arg.cantidades;

    if (arg.existencia > 0 && arg.aviso_existencia > cantidades[arg.medida_alerta]) {
      this.dbServ.toastWarning('Solo quedan ' + cantidades[arg.medida_alerta] + ' ' + arg.medida_alerta + ' de este producto, debe de aumentar el inventario!!!', 'AVISO');
    }

    (this.control.controls[arg.index] as any).controls['cod'].setValue(arg.codigo);
    (this.control.controls[arg.index] as any).controls['des'].setValue(arg.nombre);

    if (arg.is_detallable) {
      await this.articulo_detallable(arg);
    } else {
      await this.articulo_no_detallable(arg);
    }

    const sigInput = 'can-' + arg.index;
    this.enfocarInput(sigInput);
  }

  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================
  abrirModal(arg) {
    const obj = arg;

    this.mServ.modalTipo('buscarArticulo');
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
    this.mServ.ModalTablaHeight(true);
  }

  // =============================================
  checkCantidadExede(i, unidad, lugar) {
    let cantidad = 0;
    const descripcion = (this.control.controls[i] as any).controls['des'].value;
    const tempArticulo = this.listaArticulos.filter((arti) => arti.nombre === descripcion);
    const articulo = tempArticulo[0];
    const cantidades = articulo.cantidades;

    const splitUnidad = _.split(unidad, ' ');
    let unidad_ = splitUnidad[0];
    unidad = splitUnidad[0];

    if (unidad_ === 'Saco' || unidad_ === 'Libra') {
      unidad_ = 'Libra';
    } else {
      unidad_ = 'Unidad';
    }

    for (let index = 0; index < this.control.controls.length; index++) {
      const cod = (this.control.controls[index] as any).controls['cod'].value;
      if (cod === null || cod === undefined || cod === '' || cod === ' ') {
        break;
      }
      let cantidadF = 0;
      let unidadF = '';

      cantidadF = (this.control.controls[index] as any).controls['can'].value;
      unidadF = (this.control.controls[index] as any).controls['uni'].value;

      const splitUnidadF = _.split(unidadF, ' ');
      let unity = splitUnidadF[0];
      const FindProd = (this.control.controls[index] as any).controls['des'].value;

      if (FindProd === descripcion) {
        if (unidad_ === 'Libra') {
          if (splitUnidadF.length > 1) {
            cantidadF = cantidadF * _.parseInt(splitUnidadF[2]);
          }
        }
        if (unity === 'Saco') {
          unity = 'Libra';
        }

        cantidadF *= articulo.contenido[unity];

        cantidad += cantidadF;
      }
    }

    if (lugar === 'saltar') {
      i--;
    }

    if (cantidad > cantidades[unidad_]) {
      this.dbServ.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');
      return true;
    } else {
      return false;
    }
  }

  addItem(i): void {
    this.ARRAY_ROWARTICULOS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWARTICULOS.push(this.createItem(i));
  }

  removeItem(i: number) {
    this.control.removeAt(i);
  }

  verificarSecuencia(i, input?) {
    if (this.secuencia < i) {
      this.enfocarInput(this.inputSecuencia);
    }

    if (!input) {
      this.drop = false;
    }

    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    if (input === 'unidad' && codigo !== '' && codigo !== null && codigo !== undefined) {
      this.verificarRow(i);
      this.buscarArticuloPorCodigo(i, codigo);
    }
  }

  selectMedidaChange(arg, i) {
    const indiceDetalle = _.findIndex(this.UnidadesArticulo, (o) => {
      return o.value === arg;
    });
    const unidad = this.UnidadesArticulo[indiceDetalle].value;

    const execede = this.checkCantidadExede(i, unidad, 'change');

    if (!execede) {
      (this.control.controls[i] as any).controls['uni'].setValue(unidad);
    } else {
      this.enfocarInput('can-' + i);
      this.selectContenido('can-' + i);
      setTimeout(() => {
        (this.control.controls[i] as any).controls['uni'].setValue(null);
      }, 2);
    }
  }

  secuenciaDelDrop(arg) {
    return 'uni-' + arg;
  }

  verificarRow(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  enfocarInput(arg) {
    const element = document.getElementById(arg) as any;
    element.focus();
  }

  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    element.select();
  }

  createItem(i): FormGroup {
    return this.fb.group({
      id: [],
      cod: [null],
      uni: [null],
      des: [null],
      can: [null],
      secuencia: [i],
    });
  }

  modalRemover(i) {
    const name = (this.control.controls[i] as any).controls['des'].value;
    const unidad = (this.control.controls[i] as any).controls['uni'].value;
    let obj = {};
    if (unidad) {
      obj = { nombre: name + ' (' + unidad + ')' };
    } else {
      obj = { nombre: name };
    }

    if (name) {
      this.tipoModal = 'removerArticulo';
      this.indexRemove = i;
      this.mServ.modalTipo('removerArticulo');
      this.mServ.ModalSeleccion(obj);
      this.mServ.mostrarModal(true);
    }
  }

  ModificarClass(item, clase, action) {
    if (action === 'add') {
      document.getElementById(item).classList.add(clase);
    } else {
      document.getElementById(item).classList.remove(clase);
    }
  }

  selectedRow(i, bool) {
    const lista = ['cod-' + i, 'can-' + i, 'uni-' + i, 'des-' + i];
    lista.forEach((row) => {
      if (this.checkIfArticuloRow(i)) {
        if (bool) {
          this.ModificarClass(row, 'inputOscuro', 'add');
        } else {
          this.ModificarClass(row, 'inputOscuro', 'remove');
        }
      }
    });
  }
  getArticulos() {
    try {
      this.dbServ.getArticulos().subscribe((res) => {
        res.sort((a, b) => {
          return a.id > b.id ? 1 : -1;
        });

        if (res !== undefined && res !== null) {
          this.listaArticulos = res;
        }
      });
    } catch (error) {}
  }

  calcularHeigth() {
    setTimeout(() => {
      console.log(document.getElementById('cardTabla'));
      this.altoDiv = document.getElementById('cardTabla').offsetHeight;
    }, 10);
  }

  async BuscarFacturasAdelantadas(id) {
    try {
      this.facturas_adelantadas = await this.dbServ
        .getFacturasByParams('1', id, 0, true)
        .pipe(
          map(
            (fact) =>
              (fact = fact.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_facturacion).format('DD-MM-YYYY');
                val.fechaV = moment(val.fecha_vencimiento).isValid() ? moment(val.fecha_vencimiento).format('DD-MM-YYYY') : '';
                val.estado_ = val.estado ? 'fas fa-check' : 'fas fa-times';
                val.monto = GLOBAL.formatearNumero(GLOBAL.redondearAdos(val.balance));

                for (let i = 0; i < val.detalle_facturas.length; i++) {
                  const detalle = val.detalle_facturas[i];
                  detalle.select = false;
                }

                return val;
              })),
          ),
        )
        .toPromise();

      if (this.facturas_adelantadas.length > 0) {
        this.calcularHeigth();
      }
    } catch (error) {}
  }

  async pedirClientes(e, buscando) {
    try {
      console.log('BUSCANDO    ->"', buscando, '"');

      const page = e.page;
      const per_page = e.per_page;
      const palabra_a_buscar = buscando === '' || buscando === null || buscando === undefined ? ' ' : buscando;

      const res = await this.dbServ.getClientesFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

      this.listaClientes = undefined;

      res.data.map((cli) => {
        cli.nombre = GLOBAL.Capitalice(cli.nombre);
        cli.apellido = GLOBAL.Capitalice(cli.apellido);
        cli.documentos_de_identidad.map((docu) => {
          if (docu.principal) {
            cli.documento_identidad = docu.documento;
          }
        });
        return cli;
      });
      this.listaClientes = res.data;

      this.tServ.Func_total_paginas(res.total_registros);
    } catch (error) {
      console.error(error);
      this.dbServ.toastError('Error buscando clientes registrados.', 'ERROR');
    }
  }

  async abrirModalFiltro(nombre) {
    await this.pedirClientes(this.obj_paginate_, nombre);
    this.mServ.modalTipo('buscarCliente');
    this.tipoModal = 'buscarCliente';

    const obj = {
      data: this.listaClientes,
      filtrarCliente: nombre,
    };

    this.mServ.ModalSeleccion(obj);

    this.mServ.mostrarModal(true);
    this.mServ.ModalTablaHeight(true);
  }

  async SeleccionarFactruaAdelantada(factura) {
    if (factura) {
      // if (this.checkIfCuerpoDirty()) {
      //   this.facturas_adelantadas_wait = GLOBAL.duplicarJson(factura);
      //   this.abrirModalDinamicText('Conduce no terminado, ¿Desea sobreescribirlo?', 1);
      // } else {
      this.mServ.modalTipo('seleccionar_articulos_adelantados');
      for (let i = 0; i < factura.detalle_facturas.length; i++) {
        const detalle = factura.detalle_facturas[i];

        const existe = this.control.value.find((d) => d.id === detalle.id);
        if (existe) {
          detalle.select = true;
        } else {
          detalle.select = false;
        }
      }
      this.mServ.ModalSeleccion(factura.detalle_facturas);
      this.mServ.mostrarModal(true);
      // }
    }
  }

  buscarArticuloPorCodigo(i, codigo, input?) {
    this.inputDrop = 'uni-' + i;

    const ARTICULO = this.listaArticulos.filter((articulo) => articulo.codigo === codigo);

    if (ARTICULO[0] === undefined) {
      this.dbServ.toastError('El codigo introducido no existe', 'ERROR');
      setTimeout(() => {
        this.enfocarInput('cod-' + i);
      }, 5);
      this.selectContenido('cod-' + i);
    } else {
      const cantidades = ARTICULO[0].cantidades;
      if (ARTICULO[0].existencia === 0) {
        if (ARTICULO[0].descripcion === 'Producto terminado') {
          this.dbServ.toastError('Producto agotado, debe de producir mas!!!', 'ERROR');
        } else {
          this.dbServ.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR');
        }
        setTimeout(() => {
          this.enfocarInput('cod-' + i);
          this.selectContenido('cod-' + i);
        }, 5);
      } else {
        if (ARTICULO[0].existencia > 0 && ARTICULO[0].aviso_existencia > cantidades[ARTICULO[0].medida_alerta]) {
          if (input === 'can-') {
            this.dbServ.toastWarning(
              'Solo quedan ' + cantidades[ARTICULO[0].medida_alerta] + ' ' + ARTICULO[0].medida_alerta + ' de este producto, debe de aumentar el inventario!!!',
              'AVISO',
            );
          }
        }

        (this.control.controls[i] as any).controls['des'].setValue(ARTICULO[0].nombre);
        this.verificarRow(i);

        if (ARTICULO[0].is_detallable) {
          this.articulo_detallable(ARTICULO[0]);
        } else {
          this.articulo_no_detallable(ARTICULO[0]);
        }

        this.enfocarInput('can-' + i);
      }
    }
  }
  checkIfArticuloRow(i) {
    let res = false;
    const element = this.control.controls[i] as any;
    if (element.controls['des'].value || element.controls['cod'].value) {
      res = true;
    } else {
      res = false;
    }
    return res;
  }
  checkIfCuerpoDirty() {
    let acu = false;
    for (let i = 0; i < this.control.controls.length; i++) {
      const element = this.control.controls[i] as any;
      if (element.controls['des'].value || element.controls['cod'].value) {
        acu = true;
        break;
      }
    }
    return acu;
  }

  abrirModalDinamicText(texto, tipo) {
    const obj = { texto_modal: texto };
    if (tipo === 1) {
      this.tipoModal = 'conduce_lleno';
      this.mServ.modalTipo('dinamico_texto');
    } else if (tipo === 2) {
      {
        this.tipoModal = 'imprimir_conduce';
        this.mServ.modalTipo('dinamico_texto');
      }
    } else {
      this.tipoModal = 'cancelar_conduce';
      this.mServ.modalTipo('dinamico_texto');
    }
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  entrarSacosAUnidades() {
    this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
    for (let i = 0; i < this.sacos.length; i++) {
      const saco = this.sacos[i];
      const valor = 'Saco de ' + saco + ' libras';
      this.UnidadesArticulo.push({ value: valor, precio: 0, costo: 0 });
    }
  }

  articulo_detallable(art) {
    this.drop = true;
    this.UnidadesArticulo = [];

    if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
      this.entrarSacosAUnidades();
    }

    if (art.descripcion === 'Veterinaria' || art.descripcion === 'Otros') {
      this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
      this.UnidadesArticulo.push({ value: art.medida, precio: 0, costo: 0 });
    }

    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: 0, costo: 0 });
    });
  }

  articulo_no_detallable(art) {
    this.drop = true;
    this.UnidadesArticulo = [];

    if (art.descripcion === 'Veterinaria' || art.descripcion === 'Otros') {
      this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
      this.UnidadesArticulo.push({ value: art.medida, precio: 0, costo: 0 });
    }

    art.contenido_articulos.forEach((element) => {
      if (element.referencia === null) {
        if (art.descripcion === 'Veterinaria') {
          this.UnidadesArticulo.push({ value: element.medida, precio: 0, costo: 0 });
        }
      }
      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
        this.entrarSacosAUnidades();
      }
    });
  }

  parsearDetalleModal(articulos) {
    const articulos_parsed = [];

    for (let i = 0; i < this.control.controls.length; i++) {
      const row_conduce = this.control.controls[i].value;

      if (row_conduce.id) {
        for (let j = 0; j < articulos.length; j++) {
          const articulo = articulos[j];

          const i = _.findIndex(this.control.controls, (control: any) => {
            return control.id === articulo.id;
          });

          if (i !== -1) {
            articulo.cantidad = this.control.controls[i].value.can + articulo.retirado;
            articulos_parsed.push(articulo);
          } else {
            if (row_conduce.cod && row_conduce.des) {
              articulos_parsed.push(row_conduce);
            }
          }
        }
      } else {
        if (row_conduce.cod && row_conduce.des) {
          articulos_parsed.push(row_conduce);
        }
      }

      // for (let j = 0; j < articulos.length; j++) {
      //   const articulo_selected = articulos[j];

      //   const i = _.findIndex(this.control.controls, (control: any) => {
      //     return control.id === articulo_selected.id;
      //   });

      //   if (i !== -1) {
      //     articulo_selected.cantidad = this.control.controls[i].value.can + articulo_selected.retirado;
      //     articulos_parsed.push(articulo_selected);
      //   } else {
      //     if (row_conduce.cod && row_conduce.des) {
      //       articulos_parsed.push(row_conduce);
      //     }
      //   }
      // }
    }
    this.form.reset();

    // this.llenarConduce(articulos_parsed);
  }

  llenarConduce(articulos) {
    for (let i = 0; i < this.control.controls.length; i++) {
      const element = this.control.controls[i].value;

      for (let j = 0; j < articulos.length; j++) {
        const articulo = articulos[j];

        const existe = this.control.value.find((d) => d.id === articulo.id);

        if (element.des && element.cod) {
          if (element.id === articulo.id && articulo.destroy === 1) {
            this.indexRemove = i;
            this.procesoQuitarArticulo();
          }
        } else {
          if (!existe && articulo.destroy !== 1) {
            this.llenarFila(articulo, i);
          }
        }
      }
    }
  }

  llenarFila(element, i) {
    (this.control.controls[i] as any).controls['id'].setValue(element.id);
    (this.control.controls[i] as any).controls['cod'].setValue(element.codigo);

    (this.control.controls[i] as any).controls['can'].setValue(element.cantidad - element.retirado);
    (this.control.controls[i] as any).controls['des'].setValue(_.capitalize(element.articulo));
    if (element.peso_saco) {
      (this.control.controls[i] as any).controls['uni'].setValue('Saco de ' + element.peso_saco + ' libras');
    } else {
      (this.control.controls[i] as any).controls['uni'].setValue(element.unidad);
    }
    this.aumentarSecuencia();
  }

  async ParsearCuerpo() {
    for (let i = 0; i < this.control.value.length; i++) {
      const element = this.control.value[i];
      if (element.cod && element.uni && element.can) {
        element['articulo_id'] = this.listaArticulos.filter((art) => art.codigo === element.cod)[0].id;

        this.CuerpoConduce.push({
          detalle_factura_id: element.id ? element.id : null,
          articulo_id: element.articulo_id,
          cantidad: element.can,
          unidad: element.uni,
        });
      } else {
        break;
      }
    }
  }

  imprimirConduce() {
    if (!this.cliente) {
      this.dbServ.toastWarning('Conduce no tiene cliente', 'Aviso');
    } else {
      this.ParsearCuerpo();
      if (this.CuerpoConduce.length === 0) {
        this.dbServ.toastWarning('Conduce no tiene Articulos', 'Aviso');
      } else {
        this.abrirModalDinamicText('Seguro que desea imprimir el conduce', 2);
      }
    }
  }

  sendData() {
    const empleado = JSON.parse(this.dbServ.getEmpleado());

    const obj = {};
    obj['user_id'] = empleado.id;
    obj['cliente_id'] = this.cliente.id;
    obj['numero_conduce'] = '';
    obj['detalle_conduce_attributes'] = this.CuerpoConduce;
  }

  cancelarConduce(secuencia) {
    if (secuencia === 1) {
      this.abrirModalDinamicText('Conduce no terminado, ¿Desea cancelarlo?', null);
    } else {
      this.form.reset();
      this.cliente = undefined;
      this.facturas_adelantadas_wait = [];
      this.facturas_adelantadas = [];
      this.secuencia = 0;
      this.inputSecuencia = 'cod-0';
      this.inputDrop = 'uni-0';
      this.facturaAdelantadaSelected = undefined;

      (document.getElementById('clienteI') as any).value = '';
      setTimeout(() => {
        this.enfocarInput('clienteI');
      }, 10);
    }
  }
}
