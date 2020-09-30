import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy, OnChanges, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
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
  @Input() propietario;
  @Input() metodo;

  // subObjDevueltoModal: Subscription;
  // subIndexToFocusModal: Subscription;

  @Output() sendCalculos = new EventEmitter<any>();
  @Output() sendDescuento = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
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
      }
    });

    this.subObj = this.mServ.OBJDEVUELTO.subscribe((res) => {
      if (res && res.tipo_modal === 'buscarArticulo') {
        console.log('entro   ');

        this.LLenarRowDespuesDeFiltro(res);
      }
    });

    this.subArticuloFiltro = this.mServ.ARTICULOFILTRADOPORCODIGO.subscribe((res) => {
      if (res !== undefined && res !== null) {
        console.log(res);

        this.LLenarRowDespuesDeFiltro(res);
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
            fila.unidad = fila.uni;
            fila.precio = GLOBAL.desformatear(fila.pre);
            fila.costo = GLOBAL.desformatear(fila.costo);
            let obj;
            if (this.metodo === 'venta') {
              obj = _.omit(fila, ['cod', 'can', 'des', 'uni', 'pre', 'tot', 'costo', 'secuencia']);
            } else {
              obj = _.omit(fila, ['can', 'des', 'uni', 'tot', 'secuencia']);
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
    this.mServ.ModalTablaHeight(false);
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
  ngOnChanges() {}

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
  // =============================================
  //  RESETEAR FORMULARIO
  // =============================================
  RESETCUERPO() {
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
        this.setInputDrop(i);

        let excede = false;
        if (unidad && unidad !== '') {
          excede = await this.checkCantidadExede(i, unidad, 'change');
        }

        if (!excede) {
          const obj = { filtrarArticulo: codigo, index: i, metodo: this.metodo, data: [] };
          this.filtrarArticulo(obj);

          setTimeout(() => {
            this.enfocarInput(sigInput);
          }, 150);
        } else {
          this.enfocarInput('can-' + index);
          this.selectContenido('can-' + index);
          setTimeout(() => {
            (this.control.controls[index] as any).controls['uni'].setValue(null);
          }, 2);
        }
      }
    }

    if (input === 'cod-' || input === 'pre-') {
      let index = i;

      if (input === 'cod-') {
        index++;
      }

      const excede = await this.checkCantidadExede(i, unidad, 'saltar');

      if (!excede) {
        if (unidad === '' || unidad === null) {
          setTimeout(() => {
            this.enfocarInput('uni-' + i);
          }, 5);
        } else {
          this.aumentarSecuencia();
          if (this.metodo === 'venta') {
            this.enfocarInput('cod-' + index);
          } else {
            this.enfocarInput('pre-' + i);
          }
        }
      } else {
        this.enfocarInput('can-' + i);
        this.selectContenido('can-' + i);
        setTimeout(() => {
          (this.control.controls[i] as any).controls['uni'].setValue(null);
        }, 2);
      }
    }

    // if (input === 'can-' && codigo !== '') {
    //   codigo = _.parseInt(codigo);
    //   if (_.isInteger(codigo)) {
    //     codigo = (this.control.controls[i] as any).controls['cod'].value;
    //     this.buscarArticuloPorCodigo(i, codigo, input);
    //     this.enfocarInput(sigInput);
    //   } else {
    //     codigo = (this.control.controls[i] as any).controls['cod'].value;
    //     if (codigo === null) {
    //       this.enfocarInput('cod-' + i);
    //       this.selectContenido('cod-' + i);
    //     } else {
    //       const obj = { filtrar: codigo, index: i, metodo: this.metodo };
    //       this.filtrarArticulo(obj);
    //     }
    //   }
    // }
    if (input === 'can-' && codigo !== '') {
      if (codigo === null) {
        this.enfocarInput('cod-' + i);
        this.selectContenido('cod-' + i);
      } else {
        const obj = { filtrarArticulo: codigo, index: i, metodo: this.metodo, data: [] };
        this.desEnfocarInput('cod-' + i);
        this.filtrarArticulo(obj);
        // }
      }
    }
  }

  // buscarArticuloPorCodigo(i, codigo, input?) {
  //   let precioQuintal;
  //   this.inputDrop = 'uni-' + i;

  //   // const ARTICULO = this.listaArticulos.filter((articulo) => articulo.codigo === codigo);
  //   if (ARTICULO[0] === undefined) {
  //     this.dbServ.toastError('El codigo introducido no existe', 'ERROR');
  //     setTimeout(() => {
  //       this.enfocarInput('cod-' + i);
  //     }, 5);
  //     this.selectContenido('cod-' + i);
  //   } else {
  //     const cantidades = ARTICULO[0].cantidades;
  //     if (this.metodo === 'venta' && ARTICULO[0].existencia === 0) {
  //       if (ARTICULO[0].descripcion === 'Producto terminado') {
  //         this.dbServ.toastError('Producto agotado, debe de producir mas!!!', 'ERROR');
  //       } else {
  //         this.dbServ.toastError('Producto agotado, debe de comprar mas!!!', 'ERROR');
  //       }
  //       setTimeout(() => {
  //         this.enfocarInput('cod-' + i);
  //         this.selectContenido('cod-' + i);
  //       }, 5);
  //     } else {
  //       if (ARTICULO[0].existencia > 0 && ARTICULO[0].aviso_existencia > cantidades[ARTICULO[0].medida_alerta]) {
  //         if (input === 'can-') {
  //           this.dbServ.toastWarning(
  //             'Solo quedan ' + cantidades[ARTICULO[0].medida_alerta] + ' ' + ARTICULO[0].medida_alerta + ' de este producto, debe de aumentar el inventario!!!',
  //             'AVISO',
  //           );
  //         }
  //       }

  //       const arti = ARTICULO[0].contenido_articulos.filter((art) => art.medida === 'Quintal');

  //       if (arti.length !== 0) {
  //         precioQuintal = arti[0].precio;
  //       }

  //       if (ARTICULO[0].descripcion === 'Materia prima') {
  //         (this.control.controls[i] as any).controls['descuento_porciento'].disable();
  //       } else {
  //         (this.control.controls[i] as any).controls['descuento_porciento'].enable();
  //       }
  //       (this.control.controls[i] as any).controls['des'].setValue(ARTICULO[0].nombre);
  //       this.verificarRow(i);
  //       if (this.metodo === 'venta') {
  //         if (ARTICULO[0].is_detallable) {
  //           this.articulo_detallable(ARTICULO[0]);
  //         } else {
  //           this.articulo_no_detallable(ARTICULO[0]);
  //         }
  //       } else {
  //         this.articulo_detallable(ARTICULO[0]);
  //       }
  //     }
  //   }
  // }

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

  async checkCantidadExede(i, unidad, lugar) {
    let cantidad = 0;
    const descripcion = (this.control.controls[i] as any).controls['des'].value;
    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    let articulo;
    try {
      articulo = await this.dbServ.getArticulosFiltrados(codigo, 0, 0, true).toPromise();
    } catch (error) {}

    const cantidades = articulo.cantidades;

    const splitUnidad = _.split(unidad, ' ');
    let unidad_ = splitUnidad[0];
    unidad = splitUnidad[0];
    if (this.metodo === 'venta') {
      // if (unidad_ === 'Galón' || unidad_ === 'Saco' || unidad_ === 'Libra') {
      if (unidad_ === 'Saco' || unidad_ === 'Libra') {
        unidad_ = 'Libra';
      } else {
        unidad_ = 'Unidad';
      }
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
        // if (unity === 'Saco'||unity === 'Galón') {
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

    if (this.metodo === 'venta' && cantidad > cantidades[unidad_]) {
      this.dbServ.toastError('Cantidad introducida excede la cantidad en inventario', 'ERROR');
      return true;
    } else {
      return false;
    }
  }

  async selectMedidaChange(arg, i) {
    const indiceDetalle = _.findIndex(this.UnidadesArticulo, (o) => {
      return o.value === arg;
    });

    this.precioDetalle = this.UnidadesArticulo[indiceDetalle].precio;
    const costoDetalle = this.UnidadesArticulo[indiceDetalle].costo;
    const unidad = this.UnidadesArticulo[indiceDetalle].value;

    const excede = await this.checkCantidadExede(i, unidad, 'change');

    if (!excede) {
      (this.control.controls[i] as any).controls['uni'].setValue(unidad);
      (this.control.controls[i] as any).controls['pre'].setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(this.metodo === 'venta' ? this.precioDetalle : costoDetalle)));
      (this.control.controls[i] as any).controls['costo'].setValue(costoDetalle);
      this.calcularTotalRow(i);
    } else {
      this.enfocarInput('can-' + i);
      this.selectContenido('can-' + i);
      setTimeout(() => {
        (this.control.controls[i] as any).controls['uni'].setValue(null);
      }, 2);
    }
  }

  desEnfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.blur();
  }
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }
  selectContenido(arg) {
    this.element = document.getElementById(arg);
    this.element.select();
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
      this.setInputDrop(i);

      const obj = { filtrarArticulo: codigo, index: i, metodo: this.metodo, data: [] };
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
    let cantidadMinima = 1;
    console.log('unidad ', unidad);
    console.log('this.UnidadesArticulo ', this.UnidadesArticulo);

    if (unidad && this.UnidadesArticulo.length > 0) {
      cantidadMinima = this.UnidadesArticulo.filter((uni) => _.lowerCase(uni.value) === _.lowerCase(unidad))[0].cantidad;
    }
    console.log('cantidadMinima', cantidadMinima);

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
      if (splitPrecio.length > 2 || this.checkNumbers(enteros) || this.checkLongMillares(enteros) || this.checkNumbers(tempdecimales) || this.checkLongMillares(tempdecimales)) {
        this.dbServ.toastError('Precio introducido es invalido', 'ERROR');
        this.enfocarInput('pre-' + i);
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
    const precioTEMP = (this.control.controls[i] as any).controls['pre'].value;
    const precio = GLOBAL.desformatear(precioTEMP);
    const cantidad = (this.control.controls[i] as any).controls['can'].value;

    let descuento = (this.control.controls[i] as any).controls['descuento_porciento'].value;

    const total = precio * cantidad;
    let calculoDesc = 0;
    let nuevoTotal = 0;

    if (descuento === 0 || descuento === '0' || descuento === null || descuento === undefined) {
      (this.control.controls[i] as any).controls['descuento_porciento'].reset();
      const total = precio * cantidad;
      (this.control.controls[i] as any).controls['tot'].setValue(GLOBAL.formatearNumero(GLOBAL.redondearAdos(total)));
    }

    if (precio !== '' && precio !== null && cantidad !== '' && cantidad != null && descuento !== '' && descuento !== ' ' && descuento !== null && descuento !== undefined) {
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
  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================
  // abrirModal(arg) {
  //   const obj = arg;
  //   // this.listaArticulos.map()
  //   if (this.metodo === 'venta') {
  //     obj.data = this.listaArticulos;
  //   } else {
  //     obj.data = this.listaArticulos.filter((articulo) => articulo.suplidor_id === this.propietario.id);
  //   }

  //   this.mServ.modalTipo('buscar');
  //   this.mServ.ModalSeleccion(obj);
  //   this.mServ.mostrarModal(true);
  //   this.mServ.ModalTablaHeight(true);
  // }

  // filtrarArticulo(arg) {
  //   this.abrirModal(arg);
  // }
  async filtrarArticulo(arg) {
    await this.mServ.modalTipo('buscarArticulo');
    await this.mServ.ModalSeleccion(arg);
    await this.mServ.mostrarModal(true);
    await this.mServ.ModalTablaHeight(true);
  }

  reinicarVarModal() {
    this.modalSearch = false;
    this.showModal = false;
  }

  // clickRowModal(arg) {
  //   const index = _.findIndex(this.listaArticulos, (o: any) => {
  //     return o.codigo === arg.codigo;
  //   });
  //   // this.listaArticulos[index].seleccionado = true;

  //   const cantidades = arg.cantidades;

  //   if (arg.existencia > 0 && arg.aviso_existencia > cantidades[arg.medida_alerta]) {
  //     this.dbServ.toastWarning('Solo quedan ' + cantidades[arg.medida_alerta] + ' ' + arg.medida_alerta + ' de este producto, debe de aumentar el inventario!!!', 'AVISO');
  //   }

  //   (this.control.controls[arg.index] as any).controls['cod'].setValue(arg.codigo);
  //   (this.control.controls[arg.index] as any).controls['des'].setValue(arg.nombre);

  //   if (this.metodo === 'venta') {
  //     if (arg.descripcion === 'Materia prima') {
  //       (this.control.controls[arg.index] as any).controls['descuento_porciento'].disable();
  //     } else {
  //       (this.control.controls[arg.index] as any).controls['descuento_porciento'].enable();
  //     }
  //   }

  //   const arti = arg.medida;
  //   if (this.metodo === 'venta') {
  //     if (arg.is_detallable) {
  //       this.articulo_detallable(arg);
  //     } else {
  //       this.articulo_no_detallable(arg);
  //     }
  //   } else {
  //     this.articulo_detallable(arg);
  //   }
  //   const sigInput = 'can-' + arg.index;
  //   this.enfocarInput(sigInput);
  // }

  setInputDrop(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  LLenarRowDespuesDeFiltro(obj) {
    const ARTICULO = obj.data;

    const i = obj.index;

    if (this.metodo === 'venta' && ARTICULO.existencia === 0) {
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

      if (this.metodo === 'venta' && ARTICULO.existencia > 0 && ARTICULO.aviso_existencia > cantidades[ARTICULO.medida_alerta]) {
        if (ARTICULO.descripcion === 'Producto terminado') {
          this.dbServ.toastWarning(
            'Solo quedan ' + GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]) + ' ' + ARTICULO.medida_alerta + ' de este producto, debe de producir mas!!!',
            'AVISO',
          );
        } else {
          this.dbServ.toastWarning(
            'Solo quedan ' + GLOBAL.numFormatTwoDecimals(cantidades[ARTICULO.medida_alerta]) + ' ' + ARTICULO.medida_alerta + ' de este producto, debe de aumentar el inventario!!!',
            'AVISO',
          );
        }
      }

      (this.control.controls[i] as any).controls['cod'].setValue(ARTICULO.codigo);
      (this.control.controls[i] as any).controls['des'].setValue(ARTICULO.nombre);
      (this.control.controls[i] as any).controls['articulo_id'].setValue(ARTICULO.id);
      console.log('ARTICULO ', ARTICULO);

      if (this.metodo === 'venta') {
        if (ARTICULO.descripcion === 'Materia prima') {
          (this.control.controls[i] as any).controls['descuento_porciento'].disable();
        } else {
          (this.control.controls[i] as any).controls['descuento_porciento'].enable();
        }
      }

      this.setInputDrop(i);

      if (ARTICULO.is_detallable) {
        this.llenarArrayUnidades(ARTICULO, true);
      } else {
        this.llenarArrayUnidades(ARTICULO, false);
      }
      this.enfocarInput('can-' + i);
    }
  }

  llenarArrayUnidades(art, detallable) {
    this.drop = true;

    const precioPrincipal = this.metodo === 'venta' ? art.precio_principal : art.costo_principal;
    const costoPrincipal = art.costo_principal;
    this.drop = true;
    this.UnidadesArticulo = [];
    this.UnidadesArticulo.push({ value: 'Medida', precio: 0, costo: 0, cantidad: art.contenido[art.medida] });

    this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal, cantidad: art.contenido[art.medida] });
    // if (art.descripcion === 'Veterinaria' || art.descripcion === 'Otros') {
    // }

    // if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
    //   this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal, costo: art.costo_principal, cantidad: art.contenido[art.medida] });
    // }

    art.contenido_articulos.forEach((element) => {
      // if (element.referencia === null) {
      //   if (art.descripcion === 'Veterinaria') {
      //     this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: art.contenido[element.medida] });
      //   }
      // }
      if (art.descripcion === 'Producto terminado' || art.descripcion === 'Materia prima') {
        if (art.vendido_en === 'Saco' && this.metodo === 'venta') {
          this.entrarSacosAUnidades(precioPrincipal, costoPrincipal);
        } else {
          this.medidasCuandoCompra(art);
        }
      }
    });
    if (detallable) {
      this.articuloDetallable(art);
    }
  }

  medidasCuandoCompra(art) {
    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: art.contenido[element.medida] });
    });
  }

  articuloDetallable(art) {
    art.contenido_articulos.forEach((element) => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio, costo: element.costo, cantidad: art.contenido[element.medida] });
    });
  }

  entrarSacosAUnidades(precioQuintal, costoQuintal) {
    this.sacos.forEach((saco) => {
      const valor = 'Saco de ' + saco + ' libras';
      this.UnidadesArticulo.push({ value: valor, precio: this.calcularPrecioSaco(saco, precioQuintal), costo: this.calcularPrecioSaco(saco, costoQuintal), cantidad: saco });
    });
  }

  calcularPrecioSaco(cant, precio) {
    const res = (cant / 100) * precio;
    return GLOBAL.redondearAdos(res);
  }

  noArticuloEncontrado(arg) {
    this.dbServ.toastError('Articulo no creado', 'ERROR');
    console.log('aquiiiii ', arg);

    this.mServ.ModalIndex(undefined);
    setTimeout(() => {
      this.enfocarInput('cod-' + arg);
      this.mServ.mostrarModal(false);
    }, 100);

    // this.element = document.getElementById('cod-' + arg) as HTMLElement;
    // this.element.focus();
  }
}
