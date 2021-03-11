import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ModalService } from '../components/modal/modal.service';
import { DBservice } from '../../core/services/bdservice.service';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import * as moment from '../../../utils/javascript/moment';
import { IpcService } from '../../core/services/ipc.service';
import { FunctionService } from '../../core/services/functions.service';

import { LayoutService } from '../layout/layout.service';
import { mixinClass } from '../mixinClass';
import { PdfService } from '../../core/services/pdf/pdf.service';

@Component({
  selector: 'app-conduce',
  templateUrl: './conduce.component.html',
  styleUrls: ['./conduce.component.scss'],
})
export class ConduceComponent extends mixinClass implements OnInit, OnDestroy, AfterViewInit {
  listaClientes;

  cliente;
  facturas_adelantadas = [];
  facturas_adelantadas_wait = [];

  form: FormGroup;
  ARRAY_ROWARTICULOS: any;
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
  rowsExcede = [];
  FechaConduce: any;

  constructor(
    public mServ: ModalService,
    public _ipc: IpcService,
    private fun: FunctionService,
    private dbServ: DBservice,
    private fb: FormBuilder,
    public layServ: LayoutService,
    public pdfServ: PdfService,
  ) {
    super(mServ, _ipc, layServ);
  }

  ngOnInit() {
    this._init_mixin({
      component: 'conduce',
      _lista_subs: ['decisionModal', 'objDevuelto', 'articuloPorCodigo', 'pressEsc', 'articuloPorCodigo', 'pressEsc', 'indexToFocus', 'printBase64Res'],
    });

    this.form = this.fb.group({
      rowFactura: this.fb.array([this.createItem(0)]),
    });

    this.ARRAY_ROWARTICULOS = this.form['rowFactura'] as FormArray;

    for (let index = 1; index <= 22; index++) {
      this.addItem(index);
    }

    this.necesarioStar();
  }

  initCambioMenu(arg) {
    if (arg.bool) {
      this.layServ.nextDecisionCambioMenu(arg);
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();

    this.resetModalVaribales();
  }

  async decisionModal(res) {
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
  }

  objDevueltoResponse(res) {
    if (res) {
      if (res.tipo_modal === 'buscarCliente') {
        this.cliente = res.data;
        (document.getElementById('clienteI') as any).value = res.data.nombre;
        this.BuscarFacturasAdelantadas(res.data.id);
        setTimeout(() => {
          this.enfocarInput('cod-0');
        }, 10);
        //
      } else if (res && res.tipo_modal === 'buscarArticulo') {
        this.LLenarRowDespuesDeFiltro(res);
        setTimeout(() => {
          this.enfocarInput('can-' + res.index);
        }, 10);
        //
      } else if (res.tipo_modal === 'seleccionar_articulos_adelantados') {
        // mirar aqui el res
        this.llenarConduce(res.data.body);
      }
      setTimeout(() => {
        this.resetModalVaribales();
      }, 1000);
    }
  }

  articuloFiltroResponse(res) {
    if (res && res.tipo_modal === 'buscarArticulo') {
      this.LLenarRowDespuesDeFiltro(res);
      setTimeout(() => {
        this.enfocarInput('can-' + res.index);
      }, 10);
    }
  }

  pressEscResponse(res) {
    if (res !== undefined && res !== null) {
      this.enfocarInput('cod-' + res);
    }
  }

  indexToFocusResponse(res) {
    if (res !== undefined && res !== null) {
      this.noArticuloEncontrado(res);
    }
  }

  resetModalVaribales() {
    this.tipoModal = undefined;
  }

  noArticuloEncontrado(arg) {
    this.dbServ.toastError('Articulo no creado', 'ERROR', true);
    this.enfocarInput('cod-' + arg);
    setTimeout(() => {
      this.resetModalVaribales();
    }, 10);
  }

  ngAfterViewInit() {
    this.control = this.form.controls['rowFactura'] as FormArray;
  }

  async necesarioStar() {
    this.FechaConduce = this.formarFechaFactura(new Date())['FechaFactura'];
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
    // await this.chequearExcede();
  }

  async chequearExcede() {
    for (let i = 0; i < this.control.value.length; i++) {
      const element = this.control.value[i];

      if (element.cod) {
        const excede = await this.checkCantidadExede(i, 'change', element.des);
      } else {
        this.rowsExcede = _.difference(this.rowsExcede, [i]);
      }
    }
  }

  disminuirSecuencia() {
    this.secuencia--;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }
  async saltar(input, i) {
    const sigInput = input + i;
    let index = i;

    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    const unidad = (this.control.controls[i] as any).controls['uni'].value;
    const cantidad = (this.control.controls[i] as any).controls['can'].value;
    const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;

    if (i >= 10 && input === 'cod-') {
      this.addItem(i);
    }

    if (input === 'can-' && codigo !== '') {
      if (codigo === null) {
        this.enfocarInput('cod-' + i);
        this.selectContenido('cod-' + i);
      } else {
        const obj = { filtrarArticulo: codigo, index: i, metodo: 'venta', data: [], fecha_articulo: this.FechaConduce };

        this.desEnfocarInput('cod-' + i);
        this.abrirModal('buscarArticulo', obj);
      }
    }

    if (input === 'uni-') {
      if (cantidad !== '' && cantidad !== '0' && cantidad !== 0 && cantidad !== null && codigo !== '' && codigo !== null && codigo !== undefined) {
        this.checkCantidadExede(i, 'change', (res) => {
          if (res) {
            this.enfocarInput('can-' + index);
            this.selectContenido('can-' + index);
            setTimeout(() => {
              (this.control.controls[index] as any).controls['uni'].setValue(null);
            }, 2);
          } else {
            if (detalle_factura_id) {
              const sig_detalle_factura_id = (this.control.controls[index + 1] as any).controls['detalle_factura_id'].value;

              if (sig_detalle_factura_id) {
                this.enfocarInput('can-' + (index + 1));
              } else {
                this.enfocarInput('cod-' + (index + 1));
              }
            } else {
              this.enfocarInput('uni-' + index);
            }
          }
        });
      }
    }

    // if (input === 'uni-') {
    //   if (cantidad !== '' && cantidad !== '0' && cantidad !== 0 && cantidad !== null && codigo !== '' && codigo !== null && codigo !== undefined) {
    //     let excede = false;
    //     if (unidad && unidad !== '') {
    //       this.checkCantidadExede(i, 'change',res=>);
    //     }

    //     if (!excede) {

    //     } else {
    //       this.enfocarInput('can-' + index);
    //       GLOBAL.selectContenido('can-' + index);
    //       if (!detalle_factura_id) {
    //         setTimeout(() => {
    //           (this.control.controls[index] as any).controls['uni'].setValue(null);
    //         }, 2);
    //       }
    //     }
    //   }
    // }

    if (input === 'cod-') {
      index++;

      this.checkCantidadExede(i, 'saltar', (res) => {
        if (res) {
          this.enfocarInput('can-' + i);
          this.selectContenido('can-' + i);
          setTimeout(() => {
            (this.control.controls[i] as any).controls['uni'].setValue(null);
          }, 2);
        } else {
          if (unidad === '' || unidad === null) {
            setTimeout(() => {
              this.enfocarInput('uni-' + i);
            }, 5);
          } else {
            this.aumentarSecuencia();
            const sig_detalle_factura_id = (this.control.controls[index] as any).controls['detalle_factura_id'].value;

            if (sig_detalle_factura_id) {
              this.enfocarInput('can-' + index);
            } else {
              this.enfocarInput('cod-' + index);
            }
          }
        }
      });
    }

    //
    // if (input === 'cod-') {
    //   index++;
    //   this.checkCantidadExede(i, 'saltar', (res) => {
    //     if (res) {
    //       this.enfocarInput('can-' + i);
    //       GLOBAL.selectContenido('can-' + i);
    //       setTimeout(() => {
    //         (this.control.controls[i] as any).controls['uni'].setValue(null);
    //       }, 2);
    //     } else {
    //       if (unidad === '' || unidad === null) {
    //         setTimeout(() => {
    //           this.enfocarInput('uni-' + i);
    //         }, 5);
    //       } else {
    //         this.aumentarSecuencia();
    //         this.enfocarInput('cod-' + index);
    //       }
    //     }
    //   });
    // }
  }

  LLenarRowDespuesDeFiltro(obj) {
    const ARTICULO = obj.data;

    const i = obj.index;

    if (ARTICULO.existencia === 0) {
      if (ARTICULO.descripcion === 'Producto terminado') {
        this.dbServ.toastError('Producto agotado, debe de producir mas!!!', 'ERROR');
      } else {
        this.dbServ.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR');
      }

      setTimeout(() => {
        this.enfocarInput('cod-' + i);
        this.selectContenido('cod-' + i);
      }, 5);
    } else {
      const cantidades = ARTICULO.cantidades;

      if (ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
        if (ARTICULO.descripcion === 'Producto terminado') {
          this.dbServ.toastWarning(
            'Solo quedan ' +
              GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]) +
              ' ' +
              ARTICULO.medida_alerta +
              ' de este producto, debe de producir mas!!!',
            'AVISO',
          );
        } else {
          this.dbServ.toastWarning(
            'Solo quedan ' +
              GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]) +
              ' ' +
              ARTICULO.medida_alerta +
              ' de este producto, debe de aumentar el inventario!!!',
            'AVISO',
          );
        }
      }

      (this.control.controls[i] as any).controls['cod'].setValue(ARTICULO.codigo);
      (this.control.controls[i] as any).controls['des'].setValue(ARTICULO.nombre);
      (this.control.controls[i] as any).controls['articulo_id'].setValue(ARTICULO.id);

      if (ARTICULO.is_detallable) {
        this.llenarArrayUnidades(ARTICULO, true);
      } else {
        this.llenarArrayUnidades(ARTICULO, false);
      }
      const codigo = (this.control.controls[i] as any).controls['cod'].value;
      const cantidad = (this.control.controls[i] as any).controls['can'].value;
      const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;

      // if (!detalle_factura_id) {
      //   if (codigo && cantidad) {
      //     this.enfocarInput('uni-' + i);
      //   } else {
      //     this.enfocarInput('can-' + i);
      //   }
      // }
    }
  }

  // async checkMedidasArray(i) {
  //   const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;
  //   const codigo = (this.control.controls[i] as any).controls['cod'].value;
  //   if (codigo && detalle_factura_id) {
  //     let articulo;
  //     try {
  //       articulo = await this.dbServ.getArticulosFiltrados(codigo, 0, 0, true, false, 'todos').toPromise();
  //     } catch (error) {
  //       console.error(error);
  //     }

  //     if (articulo.is_detallable) {
  //       this.llenarArrayUnidades(articulo, true);
  //     } else {
  //       this.llenarArrayUnidades(articulo, false);
  //     }
  //   }
  // }

  llenarArrayUnidades(art, detallable) {
    this.drop = true;

    this.UnidadesArticulo = [];
    this.UnidadesArticulo.push({ value: 'Medida', cantidad: art.contenido[art.medida] });

    if (art.contenido_articulos.length === 0 || (art.descripcion !== 'Producto terminado' && art.vendido_en !== 'Saco')) {
      this.UnidadesArticulo.push({
        value: art.medida,
        precio: art.precio_principal,
        costo: art.costo_principal,
        cantidad: art.contenido[art.medida],
      });
    }

    if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
      if (art.vendido_en === 'Saco') {
        this.entrarSacosAUnidades();
      }
    }

    if (detallable) {
      this.articuloDetallable(art);
    }
  }

  articuloDetallable(art) {
    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, cantidad: art.contenido[element.medida] });
    });
  }

  entrarSacosAUnidades() {
    for (let i = 0; i < this.sacos.length; i++) {
      const saco = this.sacos[i];
      const valor = 'Saco de ' + saco + ' libras';
      this.UnidadesArticulo.push({ value: valor, cantidad: saco });
    }
  }
  // =============================================
  //  MODAL PARA FILTRAR CLIENTES
  // =============================================

  async abrirModalFiltro(nombre) {
    if (nombre || nombre === ' ') {
      const obj = { data: [], filtrarCliente: nombre };
      this.abrirModal('buscarCliente', obj);
    }
  }

  // =============================================
  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    const descripcion = (this.control.controls[i] as any).controls['des'].value;
    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    let articulo;
    try {
      articulo = await this.dbServ.getArticulosFiltrados(codigo, 0, 0, true, false, this.FechaConduce, 'todos').toPromise();
    } catch (error) {}

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
        if (unity === 'Saco' || unity === 'Libra') {
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

    try {
      const res = await this.dbServ.getIngredienteExcede(articulo.id, cantidad).toPromise();

      if (res.excede) {
        this.dbServ.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR', true);
        callback(true);
        // return true;
      } else {
        callback(false);
        // return false;
      }
    } catch (error) {
      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR', true);
      }
      callback(false);
    }
  }

  addItem(i): void {
    this.ARRAY_ROWARTICULOS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWARTICULOS.push(this.createItem(i));
  }

  removeItem(i: number) {
    this.control.removeAt(i);
  }

  verificarSecuencia(i, check?) {
    if (this.secuencia < i) {
      this.enfocarInput(this.inputSecuencia);
    }

    if (!check) {
      this.drop = false;
    }

    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;
    if (check && codigo !== '' && codigo !== null && codigo !== undefined) {
      if (!detalle_factura_id) {
        this.verificarRow(i);
        const obj = { filtrarArticulo: codigo, index: i, metodo: 'venta', data: [], fecha_articulo: this.FechaConduce };
        this.abrirModal('buscarArticulo', obj);
      }
    }
  }

  async selectMedidaChange(arg, i) {
    const indiceDetalle = _.findIndex(this.UnidadesArticulo, (o) => {
      return o.value === arg;
    });
    const unidad = this.UnidadesArticulo[indiceDetalle].value;

    this.checkCantidadExede(i, 'change', (res) => {
      if (res) {
        this.enfocarInput('can-' + i);
        this.selectContenido('can-' + i);
        setTimeout(() => {
          (this.control.controls[i] as any).controls['uni'].setValue(null);
        }, 250);
      } else {
        (this.control.controls[i] as any).controls['uni'].setValue(unidad);
      }
    });
  }

  async calculateCantidadEnUnidades(i) {
    const cantidad = (this.control.controls[i] as any).controls['can'].value;
    const unidad = (this.control.controls[i] as any).controls['uni'].value;
    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;
    let cantidadMinima = 1;
    let articulo;

    if (detalle_factura_id) {
      try {
        articulo = await this.dbServ.getArticulosFiltrados(codigo, 0, 0, true, false, this.FechaConduce, 'todos').toPromise();
      } catch (error) {}

      if (articulo.is_detallable) {
        this.llenarArrayUnidades(articulo, true);
      } else {
        this.llenarArrayUnidades(articulo, false);
      }
    }

    if (unidad && cantidad && this.UnidadesArticulo && this.UnidadesArticulo.length > 0) {
      cantidadMinima = this.UnidadesArticulo.filter((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad))[0].cantidad;
      (this.control.controls[i] as any).controls['cantidad_en_unidades'].setValue(cantidad * cantidadMinima);
    }
  }

  secuenciaDelDrop(arg) {
    return 'uni-' + arg;
  }

  verificarRow(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  createItem(i): FormGroup {
    return this.fb.group({
      id: [],
      detalle_factura_id: [],
      articulo_id: [null],
      cod: [null],
      uni: [null],
      des: [null],
      can: [null],
      max_can: [9007199254740991],
      can_original: [0],
      cantidad_en_unidades: [null],
      secuencia: [i],
    });
  }

  modalRemover(i) {
    const name = (this.control.controls[i] as any).controls['des'].value;
    const unidad = (this.control.controls[i] as any).controls['uni'].value;
    let obj = { nombre: name };

    if (unidad) obj['nombre']['name'] = `(${obj['nombre']['name']} (${unidad})`;

    if (name) {
      this.indexRemove = i;
      this.abrirModal('removerArticulo', obj);
    }
  }

  selectedRow(i, bool) {
    const lista = ['cod-' + i, 'can-' + i, 'uni-' + i, 'des-' + i, 'pre-' + i, 'tot-' + i, 'desc-' + i];
    lista.forEach((row) => {
      if (this.checkIfArticuloRow(i)) {
        if (bool) {
          GLOBAL.ModificarClass(row, 'inputOscuro', 'add');
        } else {
          GLOBAL.ModificarClass(row, 'inputOscuro', 'remove');
        }
      }
    });
  }

  async BuscarFacturasAdelantadas(id) {
    try {
      this.facturas_adelantadas = await this.dbServ
        .getFacturasByParams('1', id, 0, true, 0, 0, false)
        .pipe(
          map(
            (fact) =>
              (fact = fact.map((val) => {
                val.secuencia = _.padStart(val.numero_factura, 8, '0');
                val.fecha = moment(val.fecha_equivalente).format('DD-MM-YYYY');
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

      // if (this.facturas_adelantadas.length > 0) {
      //   this.calcularHeigth();
      // }
    } catch (error) {}
  }

  async SeleccionarFactruaAdelantada(factura) {
    if (factura) {
      factura.detalle_facturas.map((detalle) => {
        const existe = this.control.value.find((d) => d.id === detalle.id);
        if (existe) {
          detalle.select = true;
        } else {
          detalle.select = false;
        }
        return detalle;
      });
      this.abrirModal('seleccionar_articulos_adelantados', factura.detalle_facturas);
      // }
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

  abrirModalDinamicText(texto, type) {
    const obj = { texto_modal: texto };
    let tipo_modal;

    if (type === 1) tipo_modal = 'conduce_lleno';
    else if (type === 2) tipo_modal = 'imprimir_conduce';
    else tipo_modal = 'cancelar_conduce';

    this.abrirModal('dinamico_texto', obj, tipo_modal);
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

  llenarConduce(rows) {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];

      for (let i = 0; i < this.control.controls.length; i++) {
        const control = this.control.controls[i].value;

        const existe = this.control.value.find((d) => d.detalle_factura_id === row.id);

        if (control.des && control.cod) {
          if (!control.detalle_factura_id && control.articulo_id === row.articulo_id) {
            const splitUnidad = _.split(control.uni, ' ');

            if (row.peso_saco && row.peso_saco === splitUnidad[2]) {
              this.llenarFila(row, i);
            } else if (row.unidad === control.uni) {
              this.llenarFila(row, i);
            }
          }
        } else {
          if (!existe && row.destroy !== 1) {
            this.llenarFila(row, i);
          }
        }
      }
    }
    const sig_detalle_factura_id = (this.control.controls[0] as any).controls['detalle_factura_id'].value;

    if (sig_detalle_factura_id) {
      this.enfocarInput('can-0');
    } else {
      this.enfocarInput('cod-0');
    }
  }

  verSiExcede(i) {
    return this.rowsExcede.includes(i);
  }

  disableCamposFactAdelantadas(i) {
    let res = false;
    const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;
    if (detalle_factura_id) {
      res = true;
    }
    return res;
  }

  async llenarFila(element, i) {
    const cant_en_unidades_actual = element.cantidad_en_unidades - element.retirado;
    const multiplo = element.cantidad_en_unidades / element.cantidad;
    const cant_actual = cant_en_unidades_actual / multiplo;

    // const cant_en_unidades_actual = cant_en_unidades_actual * multiplo;

    (this.control.controls[i] as any).controls['detalle_factura_id'].setValue(element.id);
    (this.control.controls[i] as any).controls['articulo_id'].setValue(element.articulo_id);
    (this.control.controls[i] as any).controls['cod'].setValue(element.codigo);

    (this.control.controls[i] as any).controls['can'].setValue(cant_actual);
    (this.control.controls[i] as any).controls['max_can'].setValue(cant_actual);
    (this.control.controls[i] as any).controls['can_original'].setValue(element.cantidad);
    (this.control.controls[i] as any).controls['cantidad_en_unidades'].setValue(cant_en_unidades_actual);

    (this.control.controls[i] as any).controls['des'].setValue(_.capitalize(element.articulo));
    let uni = '';

    if (element.peso_saco) {
      uni = 'Saco de ' + element.peso_saco + ' libras';
    } else {
      uni = element.unidad;
    }

    (this.control.controls[i] as any).controls['uni'].setValue(uni);
    (this.control.controls[i] as any).controls['uni'].disable();

    setTimeout(async () => {
      this.checkCantidadExede(i, 'change', (res) => {
        if (res) {
          this.rowsExcede.push(i);
        }
      });
    }, 100);
    this.aumentarSecuencia();
  }

  excedeMaxCan(i) {
    const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;
    const max_can = (this.control.controls[i] as any).controls['max_can'].value;
    const can_original = (this.control.controls[i] as any).controls['can_original'].value;
    const can = (this.control.controls[i] as any).controls['can'].value;
    if (detalle_factura_id && can > max_can) {
      if (can_original > max_can) {
        this.dbServ.toastError('No puede introducir una cantidad mayor a la cantidad restante de la factura ', 'ERROR', true);
      } else {
        this.dbServ.toastError('No puede introducir una cantidad mayor a la cantidad de la factura ', 'ERROR', true);
      }
      (this.control.controls[i] as any).controls['can'].setValue(max_can);
      this.enfocarInput('can-' + i);
    }
  }

  getMaxCan(i) {
    const detalle_factura_id = (this.control.controls[i] as any).controls['detalle_factura_id'].value;
    const max_can = (this.control.controls[i] as any).controls['max_can'].value;
    if (detalle_factura_id) {
      return max_can;
    } else {
      return 9007199254740991;
    }
  }

  p() {
    for (let i = 0; i < this.control.value.length; i++) {
      const element = this.control.value[i];
      if (element.des) {
      } else {
        break;
      }
    }
  }
  async ParsearCuerpo() {
    this.CuerpoConduce = [];
    let res = true;

    // for (let i = 0; i < this.control.value.length; i++) {
    //   const element = this.control.value[i];
    for (let i = 0; i < this.control.controls.length; i++) {
      const control = this.control.controls[i] as any;

      const codigo_ = control.controls['cod'].value;
      const unidad_ = control.controls['uni'].value;
      const cantidad_ = control.controls['can'].value;

      if (codigo_ && unidad_ && cantidad_) {
        try {
          control['articulo'] = await this.dbServ.getArticulosFiltrados(codigo_, 0, 0, true, false, this.FechaConduce, 'todos').toPromise();
        } catch (error) {}

        // control['articulo'] = this.listaArticulos.filter((art) => art.codigo === control.cod)[0].id;

        this.CuerpoConduce.push({
          detalle_factura_id: control.controls['detalle_factura_id'].value ? control.controls['detalle_factura_id'].value : null,
          articulo_id: control.controls['articulo_id'].value,
          cantidad: cantidad_,
          cantidad_en_unidades: control.controls['cantidad_en_unidades'].value,
          unidad: unidad_,
        });
        this.checkCantidadExede(i, 'change', (res) => {
          if (res) {
            res = false;
          }
        });
      } else {
        break;
      }
    }
    return res;
  }

  async imprimirConduce() {
    if (!this.cliente) {
      this.dbServ.toastWarning('Conduce no tiene cliente', 'Aviso');
    } else {
      const cuerpoBien = await this.ParsearCuerpo();

      if (cuerpoBien) {
        if (this.CuerpoConduce.length === 0) {
          this.dbServ.toastWarning('Conduce no tiene Articulos', 'Aviso');
        } else {
          this.abrirModalDinamicText('Seguro que desea imprimir el conduce', 2);
        }
      }
    }
  }

  async sendData() {
    const empleado = this.fun.getUser();

    const cabecera_conduce = {};
    cabecera_conduce['user_id'] = empleado.id;
    cabecera_conduce['cliente_id'] = this.cliente.id;
    cabecera_conduce['numero_conduce'] = '';
    cabecera_conduce['detalle_conduces_attributes'] = this.CuerpoConduce;
    try {
      const res = await this.dbServ.createConduce(cabecera_conduce).toPromise();
      this.dbServ.toastSuccess('Conduce realizado.', 'CORRECTO');

      const obj = {
        data: res,
        type: 'conduce',
      };

      this.cancelarConduce(2);
      this.pdfServ.generatePdf(obj, (res) => {
        if (res.status === 'si') {
          const objBase = {
            base64: res.body,
            filename: res.file,
            type: 'conduce',
          };
          this._ipc.send('printBase64', objBase);
        }
      });
    } catch (error) {
      if (error.error) {
        this.dbServ.toastError(error.error.msg, 'ERROR', true);
      }
    }
  }

  ipcBase64Resonse(res) {
    if (res.status === 'si') {
    } else {
      this.dbServ.toastError(res.msg, 'ERROR', true);
    }
  }

  resetForm() {
    for (let i = 0; i < this.control.controls.length; i++) {
      const control = this.control.controls[i].value;

      if (control.des && control.cod) {
        (this.control.controls[i] as any).controls['detalle_factura_id'].setValue(null);
        (this.control.controls[i] as any).controls['articulo_id'].setValue(null);
        (this.control.controls[i] as any).controls['cod'].setValue(null);

        (this.control.controls[i] as any).controls['des'].setValue(null);
        (this.control.controls[i] as any).controls['can'].setValue(null);
        (this.control.controls[i] as any).controls['max_can'].setValue(9007199254740991);
        (this.control.controls[i] as any).controls['can_original'].setValue(0);
        (this.control.controls[i] as any).controls['cantidad_en_unidades'].setValue(null);
        (this.control.controls[i] as any).controls['uni'].setValue(null);
        (this.control.controls[i] as any).controls['uni'].enable();
      }
    }
  }

  borrar() {
    this.resetForm();
    this.cliente = undefined;
    this.facturas_adelantadas_wait = [];
    this.facturas_adelantadas = [];
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = 'uni-0';
    this.facturaAdelantadaSelected = undefined;
    this.rowsExcede = [];
  }

  cancelarConduce(secuencia) {
    if (secuencia === 1) {
      this.abrirModalDinamicText('Conduce no terminado, ¿Desea cancelarlo?', null);
    } else {
      this.borrar();
      (document.getElementById('clienteI') as any).value = '';
      setTimeout(() => {
        this.enfocarInput('clienteI');
      }, 10);
    }
  }
}
