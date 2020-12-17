import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  OnChanges,
  ElementRef,
} from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import * as _ from 'lodash';
import { DBservice } from '../../../core/services/bdservice.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { ModalService } from '../../components/modal/modal.service';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  form: FormGroup;
  ARRAY_ROWFACTURAS;

  seleccionModal;
  showModal = false;
  modalSearch = true;
  UnidadesArticulo = [];
  drop = false;

  precioDetalle;
  TOTAL = 0;
  ITBIS = 0;

  secuencia = 0;
  inputSecuencia = 'cod-0';
  inputDrop = 'uni-0';
  control;
  llevaDescuento;
  DESCUENTO = 0;
  listaDeDescuentos = [];

  sacos = [25, 50, 100];
  indexRemove;

  @Input() factura;
  @Input() action;
  @Input() FechaFactura;
  @Input() propietario;
  @Input() metodo;

  // subObjDevueltoModal: Subscription;
  // subIndexToFocusModal: Subscription;

  @Output() sendCalculos = new EventEmitter<any>();
  @Output() sendDescuento = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  @Output() getFechaFactura = new EventEmitter<any>();
  subDeci: Subscription;
  subObj: Subscription;
  subArticuloFiltro: Subscription;
  subEsc: Subscription;
  subInde: Subscription;
  tipoModal: string;

  constructor(private dbServ: DBservice, private mServ: ModalService, private fb: FormBuilder, private route: ActivatedRoute) {
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.form = this.fb.group({
      rowFactura: this.fb.array([this.createItem(0)]),
    });

    this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as FormArray;

    for (let index = 1; index <= 22; index++) {
      this.addItem(index);
    }

    // .pipe(
    //   map(art => {
    //     if (art !== undefined) {
    //       art = art.map(obj => {
    //         obj.seleccionado = false;
    //         return obj;
    //       });
    //       return art;
    //     }
    //   }),
    // )

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (this.tipoModal === 'removerArticulo' && res) {
        this.procesoQuitarArticulo();
        this.mServ.ModalDecision(undefined);
      }
    });

    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipo_modal === 'buscarArticulo') {
        this.LLenarRowDespuesDeFiltro(res);
      }
    });

    this.subArticuloFiltro = this.mServ.ARTICULOFILTRADOPORCODIGO.subscribe((res) => {
      if (res && res.tipo_modal === 'buscarArticulo') {
        this.LLenarRowDespuesDeFiltro(res);
      }
    });

    this.subEsc = this.mServ.PRESSESC.subscribe((res) => {
      if (res !== undefined && res !== null) {
        GLOBAL.enfocarInput('cod-' + res);
      }
    });

    this.subInde = this.mServ.INDEXTOFOCUS.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.noArticuloEncontrado(res);
      }
    });

    this.form.valueChanges.subscribe((res) => {
      const detalle_factura = [];
      if (res !== undefined && res !== null) {
        res.rowFactura.forEach((fila) => {
          if (fila !== undefined) {
            fila.articulo_id = fila.articulo_id;
            fila.cantidad = fila.can;
            fila.total = GLOBAL.desformatear(fila.tot);
            fila.descuento_valor = fila.descuento_valor ? (fila.descuento_valor !== null ? fila.descuento_valor : 0) : 0;
            fila.descuento_porciento = fila.descuento_porciento ? (fila.descuento_porciento !== null ? fila.descuento_porciento : 0) : 0;
            fila.itbis = 0;
            fila.calcular_saco = fila.calcular_saco;
            fila.unidad = fila.uni;
            fila.precio = GLOBAL.desformatear(fila.pre);
            fila.costo = GLOBAL.desformatear(fila.costo);
            let obj;
            if (this.metodo === 'venta') {
              obj = _.omit(fila, ['cod', 'can', 'des', 'uni', 'pre', 'tot', 'costo', 'secuencia', 'verificado']);
            } else {
              obj = _.omit(fila, ['can', 'des', 'uni', 'tot', 'secuencia', 'verificado']);
            }

            if (fila.cantidad && fila.unidad) {
              detalle_factura.push(JSON.parse(JSON.stringify(obj)));
            }
          }
        });

        this.getCuerpoFactura.emit(JSON.stringify(detalle_factura));
      }
    });
  }

  ngOnDestroy() {
    this.RESETCUERPO();
    this.subDeci.unsubscribe();
    this.subObj.unsubscribe();
    this.subEsc.unsubscribe();
    this.subInde.unsubscribe();
    this.subArticuloFiltro.unsubscribe();

    this.mServ.modalTipo(undefined);
    this.mServ.ModalSeleccion(undefined);
    this.mServ.mostrarModal(false);
    // this.mServ.ModalTablaHeight(false);
  }

  ngAfterViewInit() {
    this.control = this.form.controls['rowFactura'] as FormArray;
  }

  async procesoQuitarArticulo() {
    await this.sacarDescuento(this.indexRemove);
    await this.removeItem(this.indexRemove);
    await this.calculosTotalesGenerales();
    await this.disminuirSecuencia();
  }

  ngOnChanges(simpleChanges) {
    if (simpleChanges.factura && simpleChanges.factura.currentValue && this.action === 'update' && _.hasIn(this.factura, 'id')) {
      this.llenarFactura(this.factura.detalle_facturas);
    }
  }

  readPrecio() {
    let res = true;
    if (this.metodo === 'compra' && this.propietario !== null) {
      res = false;
    }
    return res;
  }

  readDescuento() {
    let res = true;
    if (this.metodo === 'venta' && this.propietario !== null) {
      res = false;
    }
    return res;
  }

  ModificarClass(item, clase, action) {
    if (action === 'add') {
      document.getElementById(item).classList.add(clase);
    } else {
      document.getElementById(item).classList.remove(clase);
    }
  }

  async calcularSacoEnRow(i, row, articulo, lugar, callback = (arg) => {}) {
    console.log('i--> ', i);
    console.log('row--> ', row);
    console.log('articulo--> ', articulo);
    console.log('lugar--> ', lugar);

    try {
      const operacion = row.calcular_saco;
      const se_calcula = row.se_calcula_saco;
      const row_unidad = (this.control.controls[i] as any).controls['uni'].value;
      let calculo = 0;

      if (row_unidad === articulo.medida) {
        calculo = articulo.precio_principal;
      } else {
        const splitUnidad = _.split(row_unidad, ' ');
        let unity = splitUnidad[0];
        let peso = 100 / Number(splitUnidad[2]);

        if (unity === 'Saco') {
          calculo = articulo.precio_principal / peso;
        } else {
          calculo = articulo.contenido_articulos[0].precio;
        }
      }

      const descripcion = (this.control.controls[i] as any).controls['des'].value;

      if (operacion) {
        const res = await this.dbServ.getArticulosFiltrados('Saco sistema', 1, 1, true, false, this.FechaFactura, 'todos').toPromise();
        const precio_saco = res.data[0].precio_principal;
        const precio = calculo + precio_saco;
        (this.control.controls[i] as any).controls['des'].setValue(`${articulo.nombre}`);
        (this.control.controls[i] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(precio));
      } else {
        const precio = calculo;
        (this.control.controls[i] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(precio));
        console.log('lugar ==> ', lugar);

        if (se_calcula || lugar === 'select') {
          (this.control.controls[i] as any).controls['des'].setValue(`${descripcion}*`);
        }
      }
      callback(true);
    } catch (error) {
      this.dbServ.toastError('Error calculando el precio del saco', 'ERROR');
      callback(false);
    }
  }

  async CalculoSacos(i, lugar, e?) {
    let articulo;
    try {
      const unidad = (this.control.controls[i] as any).controls['uni'].value;

      if (e) {
        e.stopPropagation();
      }
      if (this.metodo === 'venta') {
        const codigo = (this.control.controls[i] as any).controls['cod'].value;
        articulo = await this.dbServ.getArticulosFiltrados(codigo, 0, 0, true, false, this.FechaFactura, 'todos').toPromise();

        if (articulo.calcular_saco) {
          const row = (this.control.controls[i] as any).value;

          if (unidad) {
            this.calcularSacoEnRow(i, row, articulo, lugar, (res) => {
              if (res) {
                this.calcularTotalRow(i);
              }
            });
          } else {
            this.dbServ.toastWarning('Para calcular los sacos debe de seleccionar una unidad', 'AVISO', true);

            (this.control.controls[i] as any).controls['calcular_saco'].setValue(true);
          }
        } else {
          if (e) {
            this.dbServ.toastError('A este articulo no se le calculan los sacos', 'ERROR', true);
          }
          (this.control.controls[i] as any).controls['calcular_saco'].setValue(false);
        }
      }
    } catch (error) {}
  }

  selectedRow(i, bool) {
    const lista = ['cod-' + i, 'can-' + i, 'uni-' + i, 'des-' + i, 'pre-' + i, 'desc-' + i, 'tot-' + i];
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

  enfocarInput(arg) {
    GLOBAL.enfocarInput(arg);
  }
  // =============================================
  //  RESETEAR FORMULARIO
  // =============================================
  RESETCUERPO() {
    for (let i = 0; i < this.control.controls.length; i++) {
      (this.control.controls[i] as any).controls['descuento_porciento'].enable();
    }

    this.form.reset();
    this.TOTAL = 0;
    this.ITBIS = 0;
    this.secuencia = 0;
    this.inputSecuencia = 'cod-0';
    this.inputDrop = 'uni-0';
    this.DESCUENTO = 0;
    this.drop = false;
    this.listaDeDescuentos = [];
  }

  // =============================================
  //  CREAR MAS INPUTS PARA FACTURA
  // =============================================

  createItem(i): FormGroup {
    return this.fb.group({
      id: [],
      articulo_id: [],
      cod: [null],
      can: [null],
      des: [null],
      uni: [null],
      pre: [null],
      costo: [null],
      descuento_porciento: [null],
      descuento_valor: [null],
      tot: [null],
      secuencia: [i],
      cantidad_en_unidades: [0],
      is_materia_prima: [false],
      calcular_saco: [false],
      verificado: [false],
    });
  }

  addItem(i): void {
    this.ARRAY_ROWFACTURAS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWFACTURAS.push(this.createItem(i));
  }

  removeItem(i: number) {
    this.control.removeAt(i);
  }

  // =============================================
  //  MODIFICAR FACTURA
  // =============================================
  async llenarFactura(rows) {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      let articulo;
      try {
        articulo = await this.dbServ.getArticulosFiltrados(row.codigo, 0, 0, true, false, this.FechaFactura, 'todos').toPromise();
        const cant_en_unidades_actual = row.cantidad_en_unidades;
        const multiplo = row.cantidad_en_unidades / row.cantidad;
        const cant_actual = cant_en_unidades_actual / multiplo;

        (this.control.controls[j] as any).controls['pre'].setValue(GLOBAL.numFormatTwoDecimals(row.precio));
        (this.control.controls[j] as any).controls['costo'].setValue(GLOBAL.numFormatTwoDecimals(row.costo));

        (this.control.controls[j] as any).controls['descuento_porciento'].setValue(row.descuento_porciento > 0 ? row.descuento_porciento : null);
        (this.control.controls[j] as any).controls['descuento_valor'].setValue(row.descuento_valor);
        (this.control.controls[j] as any).controls['tot'].setValue(GLOBAL.numFormatTwoDecimals(row.total));

        (this.control.controls[j] as any).controls['articulo_id'].setValue(row.articulo_id);
        (this.control.controls[j] as any).controls['cod'].setValue(row.codigo);

        (this.control.controls[j] as any).controls['can'].setValue(cant_actual);
        (this.control.controls[j] as any).controls['cantidad_en_unidades'].setValue(cant_en_unidades_actual);

        (this.control.controls[j] as any).controls['des'].setValue(_.capitalize(row.articulo));

        (this.control.controls[j] as any).controls['calcular_saco'].setValue(row.calcular_saco);

        if (row.tipo === 'Materia prima') {
          (this.control.controls[j] as any).controls['descuento_porciento'].disable({ onlySelf: true });
          (this.control.controls[j] as any).controls['is_materia_prima'].setValue(true);
        } else {
          (this.control.controls[j] as any).controls['descuento_porciento'].enable();
          (this.control.controls[j] as any).controls['is_materia_prima'].setValue(false);
        }

        let uni = '';
        if (row.peso_saco) {
          uni = 'Saco de ' + row.peso_saco + ' libras';
        } else {
          uni = row.unidad;
        }

        (this.control.controls[j] as any).controls['uni'].setValue(uni);

        // if (row.calcular_saco) {

        try {
          this.calcularSacoEnRow(j, row, articulo, 'llenarFact', (res) => {
            if (res) {
              this.calcularTotalRow(j);
            }
          });
        } catch (error) {}
        // } else {
        //   this.calcularTotalRow(j);
        // }

        this.aumentarSecuencia();
      } catch (error) {}
    }
  }

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    window.history.back();
  }

  element: any;

  async saltar(e, input, i) {
    const sigInput = input + i;
    const index = i;

    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    const unidad = (this.control.controls[i] as any).controls['uni'].value;
    const cantidad = (this.control.controls[i] as any).controls['can'].value;

    if (i >= 10 && input === 'cod-') {
      this.addItem(i);
    }

    if (input === 'uni-') {
      if (cantidad !== '' && cantidad !== '0' && cantidad !== 0 && cantidad !== null && codigo !== '' && codigo !== null && codigo !== undefined) {
        this.checkCantidadExede(i, 'change', (res) => {
          if (res) {
            GLOBAL.enfocarInput('can-' + index);
            GLOBAL.selectContenido('can-' + index);
            setTimeout(() => {
              (this.control.controls[index] as any).controls['uni'].setValue(null);
            }, 2);
          } else {
            // const obj = { filtrarArticulo: codigo, index: i, metodo: this.metodo, data: [], fecha_articulo: this.FechaFactura };
            // this.filtrarArticulo(obj, true, sigInput);
            this.setInputDrop(i);
            GLOBAL.enfocarInput('uni-' + index);
          }
        });
      }
    }

    if (input === 'cod-' || input === 'pre-') {
      let index = i;

      if (input === 'cod-') {
        index++;
      }

      this.checkCantidadExede(i, 'saltar', (res) => {
        if (res) {
          GLOBAL.enfocarInput('can-' + i);
          GLOBAL.selectContenido('can-' + i);
          setTimeout(() => {
            (this.control.controls[i] as any).controls['uni'].setValue(null);
          }, 2);
        } else {
          if (unidad === '' || unidad === null) {
            setTimeout(() => {
              GLOBAL.enfocarInput('uni-' + i);
            }, 5);
          } else {
            this.aumentarSecuencia();
            if (this.metodo === 'venta') {
              GLOBAL.enfocarInput('cod-' + index);
            } else {
              GLOBAL.enfocarInput('pre-' + i);
            }
          }
        }
      });
    }

    if (input === 'can-' && codigo !== '') {
      if (codigo === null) {
        GLOBAL.enfocarInput('cod-' + i);
        GLOBAL.selectContenido('cod-' + i);
      } else {
        const obj = { filtrarArticulo: codigo, index: i, metodo: this.metodo, data: [], fecha_articulo: this.FechaFactura };

        GLOBAL.desEnfocarInput('cod-' + i);
        this.filtrarArticulo(obj);
        // }
      }
    }
  }

  articulo_detallable(art) {
    const precioQuintal = this.metodo === 'venta' ? art.precio_principal : art.costo_principal;
    const costoQuintal = art.costo_principal;
    this.drop = true;
    this.UnidadesArticulo = [];

    if (this.metodo === 'venta') {
      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
        this.entrarSacosAUnidades(precioQuintal, costoQuintal);
      }
    } else {
      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
        this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
        this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal });
      }
    }

    if (art.descripcion === 'Veterinaria' || art.descripcion === 'Otros') {
      this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
      this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal });
    }

    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo });
    });
  }

  articulo_no_detallable(art) {
    const precioQuintal = this.metodo === 'venta' ? art.precio_principal : art.costo_principal;
    const costoQuintal = art.costo_principal;
    this.drop = true;
    this.UnidadesArticulo = [];

    if (art.descripcion === 'Veterinaria' || art.descripcion === 'Otros') {
      this.UnidadesArticulo.push({ value: 'Medida', precio: 0 });
      this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal });
    }
    art.contenido_articulos.forEach((element) => {
      if (element.referencia === null) {
        if (art.descripcion === 'Veterinaria') {
          this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo });
        }
      }
      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
        this.entrarSacosAUnidades(precioQuintal, costoQuintal);
      }
    });
  }

  aumentarSecuencia() {
    this.secuencia++;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }

  disminuirSecuencia() {
    this.secuencia--;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }

  verificarRow(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  async checkCantidadExede(i, lugar, callback = (arg) => {}) {
    let cantidad = 0;
    const descripcion = (this.control.controls[i] as any).controls['des'].value;
    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    let articulo;
    try {
      articulo = await this.dbServ.getArticulosFiltrados(codigo, 0, 0, true, false, this.FechaFactura, 'todos').toPromise();
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

      if (this.metodo === 'venta' && res.excede) {
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
      } else {
        this.dbServ.toastError('Error en el servidor, contactar con el desarrollador', 'ERROR', true);
      }
      callback(false);
    }
  }

  async selectMedidaChange(arg, i) {
    const indiceDetalle = _.findIndex(this.UnidadesArticulo, (o) => {
      return o.value === arg;
    });

    this.precioDetalle = this.UnidadesArticulo[indiceDetalle].precio;
    const costoDetalle = this.UnidadesArticulo[indiceDetalle].costo;
    const unidad = this.UnidadesArticulo[indiceDetalle].value;

    this.checkCantidadExede(i, 'change', (res) => {
      if (res) {
        GLOBAL.enfocarInput('can-' + i);
        GLOBAL.selectContenido('can-' + i);
        setTimeout(() => {
          (this.control.controls[i] as any).controls['uni'].setValue(null);
        }, 250);
      } else {
        (this.control.controls[i] as any).controls['uni'].setValue(unidad);
        (this.control.controls[i] as any).controls['pre'].setValue(
          GLOBAL.formatearNumero(GLOBAL.redondearAdos(this.metodo === 'venta' ? this.precioDetalle : costoDetalle)),
        );
        (this.control.controls[i] as any).controls['costo'].setValue(costoDetalle);

        if (this.metodo === 'venta') {
          this.CalculoSacos(i, 'select', undefined);
        }
        this.calcularTotalRow(i);
      }
    });
  }

  verificarSecuencia(i, input?) {
    if (this.secuencia < i) {
      GLOBAL.enfocarInput(this.inputSecuencia);
    }

    if (!input) {
      this.drop = false;
    }

    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    if (input === 'unidad' && codigo !== '' && codigo !== null && codigo !== undefined) {
      this.setInputDrop(i);

      const obj = { filtrarArticulo: codigo, index: i, metodo: this.metodo, data: [], fecha_articulo: this.FechaFactura };
      this.filtrarArticulo(obj);
    }
  }

  secuenciaDelDrop(arg) {
    return 'uni-' + arg;
  }

  calcularTotalRow(i) {
    const precioTEMP = (this.control.controls[i] as any).controls['pre'].value;
    const precio = GLOBAL.desformatear(precioTEMP);
    const cantidad = (this.control.controls[i] as any).controls['can'].value;
    const unidad = (this.control.controls[i] as any).controls['uni'].value;
    // const calcular_saco = (this.control.controls[i] as any).controls['calcular_saco'].value;
    let cantidadMinima = 1;

    if (unidad && this.UnidadesArticulo.length > 0) {
      cantidadMinima = this.UnidadesArticulo.filter((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad))[0].cantidad;
    }

    if (precio && cantidad) {
      const tot = precio * cantidad;
      (this.control.controls[i] as any).controls['tot'].setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(tot)));

      (this.control.controls[i] as any).controls['cantidad_en_unidades'].setValue(cantidad * cantidadMinima);

      this.calculosTotalesGenerales();
    }
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

  revisarPrecio(i) {
    const precioTEMPO = (this.control.controls[i] as any).controls['pre'].value;
    if (precioTEMPO !== null && precioTEMPO !== undefined && precioTEMPO !== '' && precioTEMPO !== ' ') {
      const splitPrecio = _.split(precioTEMPO, '.');
      let precioTEMP;
      let enteros = splitPrecio[0];
      let tempdecimales = splitPrecio[1];
      if (tempdecimales === undefined) {
        tempdecimales = '00';
      }
      //
      if (
        splitPrecio.length > 2 ||
        this.checkNumbers(enteros) ||
        this.checkLongMillares(enteros) ||
        this.checkNumbers(tempdecimales) ||
        this.checkLongMillares(tempdecimales)
      ) {
        this.dbServ.toastError('Precio introducido es invalido', 'ERROR', true);
        GLOBAL.enfocarInput('pre-' + i);
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
        this.calcularTotalRow(i);
      }

      (this.control.controls[i] as any).controls['pre'].setValue(GLOBAL.formatearNumero(precioTEMP));
    }
  }

  calcularDescuento(i) {
    const codido = (this.control.controls[i] as any).controls['cod'].value;
    const precioTEMP = (this.control.controls[i] as any).controls['pre'].value;
    const precio = GLOBAL.desformatear(precioTEMP);
    const cantidad = (this.control.controls[i] as any).controls['can'].value;

    let descuento = (this.control.controls[i] as any).controls['descuento_porciento'].value;

    const total = precio * cantidad;
    let calculoDesc = 0;
    let nuevoTotal = 0;

    if (codido && (descuento === 0 || descuento === '0' || descuento === null || descuento === undefined)) {
      (this.control.controls[i] as any).controls['descuento_porciento'].reset();
      const total = precio * cantidad;
      (this.control.controls[i] as any).controls['tot'].setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(total)));
    }

    if (codido && precio && cantidad && descuento) {
      descuento = descuento / 100;

      calculoDesc = precio * descuento * cantidad;
      (this.control.controls[i] as any).controls['descuento_valor'].setValue(calculoDesc);
      nuevoTotal = total - calculoDesc;

      (this.control.controls[i] as any).controls['tot'].setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(nuevoTotal)));
      this.calculosTotalesGenerales();
      this.calculosDescuentoGeneral(calculoDesc, i);
      this.aumentarSecuencia();
    }
  }

  sacarDescuento(i) {
    let acuDesc = 0;
    const index = _.findIndex(this.listaDeDescuentos, (o: any) => {
      return o.fila === i;
    });
    if (index !== -1) {
      _.pullAt(this.listaDeDescuentos, index);
      this.listaDeDescuentos.forEach((element) => {
        acuDesc = acuDesc + element.desc;
      });

      this.sendDescuento.emit(acuDesc);
    }
  }
  calculosDescuentoGeneral(descuento, i) {
    let acuDesc = 0;
    const obj = { fila: i, desc: descuento };
    const index = _.findIndex(this.listaDeDescuentos, (o: any) => {
      return o.fila === obj.fila;
    });

    if (index !== -1) {
      this.listaDeDescuentos[index] = obj;
    } else {
      this.listaDeDescuentos.push(obj);
    }
    this.listaDeDescuentos.forEach((element) => {
      acuDesc = acuDesc + element.desc;
    });

    this.sendDescuento.emit(acuDesc);
  }

  calculosTotalesGenerales() {
    let temp = 0;

    for (let index = 0; index < this.control.length; index++) {
      const acu = (this.control.controls[index] as any).controls['tot'].value;
      if (acu) {
        temp += GLOBAL.desformatear(acu);
      }
    }

    if (temp !== this.TOTAL) {
      this.TOTAL = temp;

      const obj = {
        Total: GLOBAL.redondearAdos(this.TOTAL),
        ITBIS: '',
      };
      this.sendCalculos.emit(obj);
    }
  }
  modalRemover(i, e?) {
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
    if (e) {
      e.stopPropagation();
    }
  }
  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================

  async filtrarArticulo(arg, is_saltar = false, sigInput = '') {
    await this.mServ.modalTipo('buscarArticulo');
    await this.mServ.ModalSeleccion(arg);
    await this.mServ.mostrarModal(true);
    // await this.mServ.ModalTablaHeight(true);

    if (is_saltar) {
      GLOBAL.enfocarInput(sigInput);
    }
  }

  reinicarVarModal() {
    this.modalSearch = false;
    this.showModal = false;
  }

  setInputDrop(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  LLenarRowDespuesDeFiltro(obj) {
    const ARTICULO = obj.data;

    const i = obj.index;

    if (this.metodo === 'venta' && ARTICULO.existencia === 0) {
      if (ARTICULO.descripcion === 'Producto terminado') {
        this.dbServ.toastError('Producto agotado, debe de producir mas!!!', 'ERROR', true);
      } else {
        this.dbServ.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR', true);
      }

      setTimeout(() => {
        GLOBAL.enfocarInput('cod-' + i);
        GLOBAL.selectContenido('cod-' + i);
      }, 5);
    } else {
      const cantidades = ARTICULO.cantidades;

      if (this.metodo === 'venta' && ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
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
      (this.control.controls[i] as any).controls['calcular_saco'].setValue(ARTICULO.calcular_saco);

      if (this.metodo === 'venta') {
        if (ARTICULO.descripcion === 'Materia prima') {
          (this.control.controls[i] as any).controls['descuento_porciento'].disable({ onlySelf: true });
          (this.control.controls[i] as any).controls['is_materia_prima'].setValue(true);
        } else {
          (this.control.controls[i] as any).controls['descuento_porciento'].enable();
          (this.control.controls[i] as any).controls['is_materia_prima'].setValue(false);
        }
      }

      this.setInputDrop(i);

      this.llenarArrayUnidades(ARTICULO, i);
      const codigo = (this.control.controls[i] as any).controls['cod'].value;
      const cantidad = (this.control.controls[i] as any).controls['can'].value;

      // if (codigo && cantidad) {
      //   GLOBAL.enfocarInput('uni-' + i);
      // } else {
      GLOBAL.enfocarInput('can-' + i);
      // }
    }
  }

  async llenarArrayUnidades(art?, i?) {
    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    if (codigo) {
      if (!art) {
        if (codigo) art = await this.dbServ.getArticulosFiltrados(codigo, 0, 0, true, false, this.FechaFactura, 'todos').toPromise();
      }

      const detallable = art.is_detallable;
      this.drop = true;

      const precioPrincipal = this.metodo === 'venta' ? art.precio_principal : art.costo_principal;
      const costoPrincipal = art.costo_principal;
      this.drop = true;
      this.UnidadesArticulo = [];
      this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: art.contenido[art.medida] });

      if (this.metodo === 'venta' && (art.contenido_articulos.length === 0 || art.medida !== 'Quintal')) {
        this.UnidadesArticulo.push({
          value: art.medida,
          precio: art.precio_principal,
          costo: art.costo_principal,
          cantidad: art.contenido[art.medida],
        });
      }

      if (this.metodo === 'compra') {
        this.medidasCuandoCompra(art);
      }

      if (this.metodo === 'venta' && (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima')) {
        if (art.vendido_en === 'Saco' && art.calcular_saco) {
          this.entrarSacosAUnidades(precioPrincipal, costoPrincipal);
        }
      }

      if (detallable) {
        this.articuloDetallable(art);
      }
    }
  }

  articuloDetallable(art) {
    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: art.contenido[element.medida] });
    });
  }

  entrarSacosAUnidades(precioQuintal, costoQuintal) {
    this.sacos.forEach((saco) => {
      const valor = 'Saco de ' + saco + ' libras';
      this.UnidadesArticulo.push({
        value: valor,
        precio: this.calcularPrecioSaco(saco, precioQuintal),
        costo: this.calcularPrecioSaco(saco, costoQuintal),
        cantidad: saco,
      });
    });
  }

  calcularPrecioSaco(cant, precio) {
    const res = (cant / 100) * precio;
    return GLOBAL.redondearAdos(res);
  }

  medidasCuandoCompra(art) {
    this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal, cantidad: art.contenido[art.medida] });

    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: art.contenido[element.medida] });
    });
  }

  noArticuloEncontrado(arg) {
    this.dbServ.toastError('Articulo no creado', 'ERROR', true);

    this.mServ.ModalIndex(undefined);
    setTimeout(() => {
      GLOBAL.enfocarInput('cod-' + arg);
      this.mServ.mostrarModal(false);
    }, 100);

    // this.element = document.getElementById('cod-' + arg) as HTMLElement;
    // this.element.focus();
  }
}
