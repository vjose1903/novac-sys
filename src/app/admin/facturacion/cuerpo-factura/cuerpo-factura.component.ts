import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy, OnChanges, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
// import { SELECCIONMODAL, SHOWMODAL, TIPOMODAL, DECISIONMODAL, OBJDEVUELTO, INDEXTOFOCUS } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { ModalService } from '../../../components/modal/modal.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { ObservableServcie } from '../../../core/services/observables.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  form: FormGroup;
  ARRAY_ROWFACTURAS;
  listaArticulos: any;

  seleccionModal;
  showModal = false;
  modalSearch = true;
  UnidadesArticulo = [];
  drop = false;

  indiceDetalle;
  precioDetalle;
  TOTAL = 0;
  ITBIS = 0;
  rowActual;

  secuencia = 0;
  inputSecuencia = 'cod-0';
  inputDrop = 'uni-0';
  control;
  llevaDescuento;

  sacos = [25, 50, 100];

  @Input() propietario;
  @Input() metodo;

  // subObjDevueltoModal: Subscription;
  // subIndexToFocusModal: Subscription;

  @Output() sendCalculos = new EventEmitter<any>();
  @Output() sendDescuento = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();
  DESCUENTO = 0;
  listaDeDescuentos = [];

  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private mServ: ModalService, private fb: FormBuilder, private route: ActivatedRoute) {
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  redondearAdos(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }
  ngOnInit() {
    console.log('this.metodo');
    console.log(this.metodo);
    console.log('this.propietario');
    console.log(this.propietario);

    this.form = this.fb.group({
      rowFactura: this.fb.array([this.createItem(0)]),
    });

    this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as FormArray;

    for (let index = 1; index <= 22; index++) {
      this.addItem(index);
    }

    this.artServ.ARTICULOS.subscribe(res => {
      if (res !== undefined && res !== null) {
        this.listaArticulos = res;
      }
    });
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

    this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res !== undefined && res !== null && res.tipoModal !== 'buscarCliente') {
        this.clickRowModal(res);
      }
    });

    this.mServ.PRESSESC.subscribe(res => {
      if (res !== undefined && res !== null) {
        this.enfocarInput('cod-' + res);
      }
    });

    this.mServ.INDEXTOFOCUS.subscribe(res => {
      if (res !== undefined && res !== null) {
        this.noArticuloEncontrado(res);
      }
    });

    this.form.valueChanges.subscribe(res => {
      const detalle_factura = [];
      if (res !== undefined && res !== null) {
        const obj = {};

        res.rowFactura.forEach(fila => {
          const articulo = this.listaArticulos.filter(art => art.codigo === fila.cod);

          if (fila !== undefined && articulo.length > 0) {
            fila.articulo_id = articulo[0].id;
            fila.cantidad = fila.can;
            fila.total = this.desformatear(fila.tot);
            fila.descuento = fila.desc ? (fila.desc !== null ? fila.desc : 0) : 0;
            fila.itbis = 0;
            fila.unidad = fila.uni;
            const lol = _.omit(fila, ['cod', 'can', 'des', 'uni', 'pre', 'desc', 'tot', 'secuencia']);

            detalle_factura.push(JSON.parse(JSON.stringify(lol)));
          }
        });
        this.getCuerpoFactura.emit(JSON.stringify(detalle_factura));
      }
    });
  }

  ngOnDestroy() {}
  ngAfterViewInit() {
    this.control = <FormArray>this.form.controls['rowFactura'];
  }
  ngOnChanges() {}

  readPrecio() {
    let res = true;
    if (this.metodo === 'compra' && this.propietario !== null) {
      res = false;
    }
    return res;
  }
  // =============================================
  //  RESETEAR FORMULARIO
  // =============================================
  RESETCUERPO() {
    this.form.reset();
  }

  // =============================================
  //  FORMATEAR LOS NUMEROS
  // =============================================

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
      const formateado = x1 + x2;
      return formateado;
    }
  }

  desformatear(sTnum) {
    let temp = 0;

    if (sTnum !== null) {
      if (sTnum !== undefined) {
        const x = sTnum.split(',');
        if (x.length === 1) {
          temp += parseFloat(x[0]);
          return temp;
        } else if (x.length >= 2) {
          let joined = '';
          joined = _.join(x, '');
          temp += parseFloat(joined);

          return temp;
        }
      }
    } else {
      return sTnum;
    }
  }

  // =============================================
  //  CREAR MAS INPUTS PARA FACTURA
  // =============================================

  createItem(i): FormGroup {
    return this.fb.group({
      id: [],
      cod: [null],
      can: [null],
      des: [null],
      uni: [null],
      pre: [null],
      desc: [null],
      tot: [null],
      secuencia: [i],
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

  element: HTMLElement;

  saltar(e, input, i, elemento) {
    const sigInput = input + i;

    this.enfocarInput(sigInput);

    if (i >= 10 && input === 'cod-') {
      this.addItem(i);
    }

    let codigo = (this.control.controls[i] as any).controls['cod'].value;

    if (input === 'cod-') {
      const unidad = (this.control.controls[i - 1] as any).controls['uni'].value;

      if (unidad === '' || unidad === null) {
        setTimeout(() => {
          this.enfocarInput('uni-' + (i - 1));
        }, 5);
      } else {
        this.UnidadesArticulo = [];
        this.aumentarSecuencia();
      }
    }
    if (codigo === '') {
      this.enfocarInput('cod-' + i);
    }
    if (input === 'can-' && codigo !== '') {
      codigo = _.parseInt(codigo);
      if (_.isInteger(codigo)) {
        codigo = (this.control.controls[i] as any).controls['cod'].value;
        this.buscarArticuloPorCodigo(i, codigo);
      } else {
        this.element = document.getElementById('can-' + i) as HTMLElement;
        this.element.blur();
        codigo = (this.control.controls[i] as any).controls['cod'].value;
        const obj = { filtrar: codigo, index: i };
        this.filtrarArticulo(obj);
      }
    }
  }

  buscarArticuloPorCodigo(i, codigo) {
    let precioLibra;
    this.inputDrop = 'uni-' + i;
    // const ls = this.TodosLosSorteos.filter(val => val.loteria_id === idLoteria);
    const ARTICULO = this.listaArticulos.filter(articulo => articulo.codigo === codigo);
    if (ARTICULO[0] === undefined) {
      this.dbServ.toastError('El codigo introducido no existe', 'ERROR');
      this.enfocarInput('cod-' + i);
    } else {
      console.log(ARTICULO[0]);

      const Libra = ARTICULO[0].contenido_articulos.filter(art => art.medida === 'Libra');
      console.log(Libra.length);

      if (Libra.length !== 0) {
        precioLibra = Libra[0].precio;
      }

      if (ARTICULO[0].descripcion === 'Materia prima') {
        (this.control.controls[i] as any).controls['desc'].disable();
      } else {
        (this.control.controls[i] as any).controls['desc'].enable();
      }
      (this.control.controls[i] as any).controls['des'].setValue(ARTICULO[0].nombre);
      this.verificarRow(i);

      if (ARTICULO[0].is_detallable) {
        this.articulo_detallable(ARTICULO[0], precioLibra);
      } else {
        this.articulo_no_detallable(ARTICULO[0], precioLibra);
      }
    }
  }

  articulo_detallable(art, precioLibra) {
    this.drop = true;
    this.UnidadesArticulo = [];
    if (art.descripcion === 'Veterinaria') {
      this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal });
    }

    art.contenido_articulos.forEach(element => {
      this.UnidadesArticulo.push({ value: element.medida, precio: element.precio });
    });
    if (art.descripcion !== 'Veterinaria') {
      this.entrarSacosAUnidades(precioLibra);
    }
  }

  articulo_no_detallable(art, precioLibra) {
    this.drop = true;
    this.UnidadesArticulo = [];
    if (art.descripcion === 'Veterinaria') {
      this.UnidadesArticulo.push({ value: art.medida, precio: art.precio_principal });
    }
    art.contenido_articulos.forEach(element => {
      if (element.referencia === null) {
        if (art.descripcion === 'Veterinaria') {
          this.UnidadesArticulo.push({ value: element.medida, precio: element.precio });
        }
      }
      if (art.descripcion !== 'Veterinaria') {
        this.entrarSacosAUnidades(precioLibra);
      }
    });
  }

  aumentarSecuencia() {
    this.secuencia++;
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
    this.drop = false;
  }

  verificarRow(arg) {
    this.inputDrop = 'uni-' + arg;
  }

  selectMedidaChange(arg, i) {
    this.indiceDetalle = _.findIndex(this.UnidadesArticulo, function(o) {
      return o.value === arg;
    });

    this.precioDetalle = this.UnidadesArticulo[this.indiceDetalle].precio;
    const unidad = this.UnidadesArticulo[this.indiceDetalle].value;

    (this.control.controls[i] as any).controls['uni'].setValue(unidad);
    (this.control.controls[i] as any).controls['pre'].setValue(this.formatearNumero(this.redondearAdos(this.precioDetalle)));
    this.calcularTotalRow(i);
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }

  verificarSecuencia(i, input?) {
    if (this.secuencia < i) {
      this.enfocarInput(this.inputSecuencia);
    }

    if (!input) {
      this.drop = false;
    }

    const codigo = (this.control.controls[i] as any).controls['cod'].value;
    if (input === 'unidad' && codigo !== '') {
      this.verificarRow(i);
      this.buscarArticuloPorCodigo(i, codigo);
    }
  }

  secuenciaDelDrop(arg) {
    return 'uni-' + arg;
  }

  calcularTotalRow(i) {
    const precioTEMP = (this.control.controls[i] as any).controls['pre'].value;
    const precio = this.desformatear(precioTEMP);
    const cantidad = (this.control.controls[i] as any).controls['can'].value;

    if (precio !== null && cantidad !== '' && cantidad != null) {
      const tot = precio * cantidad;
      (this.control.controls[i] as any).controls['tot'].setValue(this.formatearNumero(this.redondearAdos(tot)));
      this.calculosTotalesGenerales();
    }
  }

  calcularDescuento(i) {
    const precioTEMP = (this.control.controls[i] as any).controls['pre'].value;
    const precio = this.desformatear(precioTEMP);
    const cantidad = (this.control.controls[i] as any).controls['can'].value;

    let descuento = (this.control.controls[i] as any).controls['desc'].value;

    const total = precio * cantidad;
    let calculoDesc = 0;
    let nuevoTotal = 0;

    if (descuento === 0 || descuento === '0' || descuento === null || descuento === undefined) {
      (this.control.controls[i] as any).controls['desc'].reset();
      const total = precio * cantidad;
      (this.control.controls[i] as any).controls['tot'].setValue(this.formatearNumero(this.redondearAdos(total)));
    }

    if (precio !== '' && precio !== null && cantidad !== '' && cantidad != null && descuento !== '' && descuento !== null && descuento !== null && descuento !== undefined) {
      descuento = descuento / 100;
      calculoDesc = precio * descuento * cantidad;
      nuevoTotal = total - calculoDesc;

      (this.control.controls[i] as any).controls['tot'].setValue(this.formatearNumero(this.redondearAdos(nuevoTotal)));
      this.calculosTotalesGenerales();
      this.calculosDescuentoGeneral(calculoDesc, i);
      this.aumentarSecuencia();
    }
  }

  calculosDescuentoGeneral(descuento, i) {
    let acuDesc = 0;
    const obj = { fila: i, desc: this.redondearAdos(descuento) };
    const index = _.findIndex(this.listaDeDescuentos, (o: any) => {
      return o.fila === obj.fila;
    });

    if (index !== -1) {
      this.listaDeDescuentos[index] = obj;
    } else {
      this.listaDeDescuentos.push(obj);
    }
    this.listaDeDescuentos.forEach(element => {
      acuDesc = acuDesc + element.desc;
    });

    this.sendDescuento.emit(acuDesc);
  }

  calculosTotalesGenerales() {
    let temp = 0;

    for (let index = 0; index < this.control.length; index++) {
      const acu = (this.control.controls[index] as any).controls['tot'].value;
      if (acu) {
        temp += this.desformatear(acu);
      }
    }

    if (temp !== this.TOTAL) {
      this.TOTAL = temp;

      const obj = {
        Total: this.redondearAdos(this.TOTAL),
        ITBIS: '',
      };
      this.sendCalculos.emit(obj);
    }
  }

  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================
  abrirModal(arg) {
    const obj = arg;
    obj.listaArticulos = this.listaArticulos;
    this.mServ.modalTipo('buscar');
    this.mServ.ModalSeleccion(obj);
    this.mServ.mostrarModal(true);
  }

  filtrarArticulo(arg) {
    this.abrirModal(arg);
  }

  reinicarVarModal() {
    this.modalSearch = false;
    this.showModal = false;
  }

  clickRowModal(arg) {
    let precioLibra;
    const index = _.findIndex(this.listaArticulos, (o: any) => {
      return o.codigo === arg.codigo;
    });
    // this.listaArticulos[index].seleccionado = true;
    (this.control.controls[arg.index] as any).controls['cod'].setValue(arg.codigo);
    (this.control.controls[arg.index] as any).controls['des'].setValue(arg.nombre);
    if (arg.descripcion === 'Materia prima') {
      (this.control.controls[arg.index] as any).controls['desc'].disable();
    } else {
      (this.control.controls[arg.index] as any).controls['desc'].enable();
    }
    this.rowActual = arg;

    const Libra = arg.contenido_articulos.filter(art => art.medida === 'Libra');

    if (Libra.length !== 0) {
      precioLibra = Libra[0].precio;
    }
    console.log(Libra);

    if (arg.is_detallable) {
      this.articulo_detallable(arg, precioLibra);
    } else {
      this.articulo_no_detallable(arg, precioLibra);
    }

    const sigInput = 'can-' + arg.index;
    this.enfocarInput(sigInput);
  }

  entrarSacosAUnidades(precioLibra) {
    this.sacos.forEach(saco => {
      const valor = 'Saco de ' + saco + ' libras';

      this.UnidadesArticulo.push({ value: valor, precio: this.calcularPrecioSaco(saco, precioLibra) });
    });
  }

  calcularPrecioSaco(cant, precio) {
    const res = cant * precio;
    return this.redondearAdos(res);
  }

  noArticuloEncontrado(arg) {
    this.dbServ.toastError('Articulo no existe', 'ERROR');
    this.enfocarInput('cod-' + arg);
    // this.element = document.getElementById('cod-' + arg) as HTMLElement;
    // this.element.focus();
  }
}
