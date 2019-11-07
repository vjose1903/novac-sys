import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  OnChanges,
  ElementRef,
} from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { SharedService } from '../../../core/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
// import { SELECCIONMODAL, SHOWMODAL, TIPOMODAL, DECISIONMODAL, OBJDEVUELTO, INDEXTOFOCUS } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { ModalService } from '../../../components/modal/modal.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { ArticulosService } from '../../../core/services/articulos.service';

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

  @Input() propietario;

  // subObjDevueltoModal: Subscription;
  // subIndexToFocusModal: Subscription;

  @Output() sendCalculos = new EventEmitter<any>();
  @Output() getCuerpoFactura = new EventEmitter<any>();

  constructor(
    private artServ: ArticulosService,
    private dbServ: DBservice,
    private mServ: ModalService,
    private shServ: SharedService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
  ) {
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.form = this.fb.group({
      rowFactura: this.fb.array([this.createItem()]),
    });

    this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as FormArray;

    for (let index = 0; index <= 9; index++) {
      this.addItem();
    }

    this.artServ.ARTICULOS.subscribe(res => {
      this.listaArticulos = res;
    });

    this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res !== undefined && res.tipoModal !== 'buscarCliente') {
        this.clickRowModal(res);
      }
    });

    this.mServ.PRESSESC.subscribe(res => {
      if (res !== undefined) {
        this.enfocarInput('cod-' + res);
      }
    });

    this.mServ.INDEXTOFOCUS.subscribe(res => {
      if (res !== undefined) {
        this.noArticuloEncontrado(res);
      }
    });

    this.form.valueChanges.subscribe(res => {
      if (res !== undefined) {
        this.getCuerpoFactura.emit(JSON.stringify(res.rowFactura));
      }
    });
  }

  ngOnDestroy() {}
  ngAfterViewInit() {
    this.control = <FormArray>this.form.controls['rowFactura'];
  }
  ngOnChanges() {}

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
  }

  // =============================================
  //  CREAR MAS INPUTS PARA FACTURA
  // =============================================

  createItem(): FormGroup {
    return this.fb.group({
      cod: [null],
      can: [null],
      des: [null],
      uni: [null],
      pre: [null],
      desc: [null],
      tot: [null],
    });
  }

  addItem(): void {
    this.ARRAY_ROWFACTURAS = this.form.get('rowFactura') as FormArray;
    this.ARRAY_ROWFACTURAS.push(this.createItem());
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
      this.addItem();
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
    this.inputDrop = 'uni-' + i;
    // const ls = this.TodosLosSorteos.filter(val => val.loteria_id === idLoteria);
    const ARTICULO = this.listaArticulos.filter(articulo => articulo.codigo === codigo);
    if (ARTICULO[0] === undefined) {
      this.shServ.toastError('El codigo introducido no existe', 'ERROR');
      this.enfocarInput('cod-' + i);
    } else {
      (this.control.controls[i] as any).controls['des'].setValue(ARTICULO[0].nombre);
      this.verificarRow(i);
      if (ARTICULO[0].is_detallable) {
        this.drop = true;
        this.UnidadesArticulo = [];
        this.UnidadesArticulo.push({ value: ARTICULO[0].medida, precio: ARTICULO[0].precio_principal });
        ARTICULO[0].contenido_articulos.forEach(element => {
          this.UnidadesArticulo.push({ value: element.medida, precio: element.precio });
        });
      } else {
        this.drop = true;
        this.UnidadesArticulo = [];
        this.UnidadesArticulo.push({ value: ARTICULO[0].medida, precio: ARTICULO[0].precio_principal });
        ARTICULO[0].contenido_articulos.forEach(element => {
          if (element.referencia === null) {
            this.UnidadesArticulo.push({ value: element.medida, precio: element.precio });
          }
        });
        // this.enfocarInput('cod-' + this.secuencia);
        // (this.control.controls[i] as any).controls['uni'].setValue(ARTICULO[0].medida);
        // (this.control.controls[i] as any).controls['pre'].setValue(this.formatearNumero(ARTICULO[0].precio_principal));
        // this.drop = false;
      }
    }
    console.log(ARTICULO[0]);
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
    (this.control.controls[i] as any).controls['pre'].setValue(this.formatearNumero(this.precioDetalle));
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
    const precio = (this.control.controls[i] as any).controls['pre'].value;
    const cantidad = (this.control.controls[i] as any).controls['can'].value;

    if (precio !== '' && precio !== null && cantidad !== '' && cantidad != null) {
      const tot = precio * cantidad;
      (this.control.controls[i] as any).controls['tot'].setValue(this.formatearNumero(_.round(tot, 2)));
      this.calculosTotalesGenerales();
    }
  }

  calcularDescuento(i) {
    const precio = (this.control.controls[i] as any).controls['pre'].value;
    const cantidad = (this.control.controls[i] as any).controls['can'].value;

    let descuento = (this.control.controls[i] as any).controls['desc'].value;
    const total = precio * cantidad;
    let calculoDesc = 0;
    let nuevoTotal = 0;

    if (descuento === 0 || descuento === '0') {
      (this.control.controls[i] as any).controls['desc'].reset();
    }

    if (precio !== '' && precio !== null && cantidad !== '' && cantidad != null && descuento !== '' && descuento !== null) {
      descuento = descuento / 100;
      calculoDesc = precio * descuento * cantidad;
      nuevoTotal = total - calculoDesc;

      (this.control.controls[i] as any).controls['tot'].setValue(this.formatearNumero(_.round(nuevoTotal, 2)));
      this.calculosTotalesGenerales();
      this.aumentarSecuencia();
    }
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
        Total: _.round(this.TOTAL, 2),
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
    (this.control.controls[arg.index] as any).controls['cod'].setValue(arg.codigo);
    (this.control.controls[arg.index] as any).controls['des'].setValue(arg.nombre);
    this.rowActual = arg;
    if (arg.is_detallable) {
      this.drop = true;
      this.UnidadesArticulo = [];
      this.UnidadesArticulo.push({ value: arg.medida, precio: arg.precio_principal });
      arg.contenido_articulos.forEach(element => {
        this.UnidadesArticulo.push({ value: element.medida, precio: element.precio });
      });
    } else {
      this.drop = true;
      this.UnidadesArticulo = [];
      this.UnidadesArticulo.push({ value: arg.medida, precio: arg.precio_principal });
      arg.contenido_articulos.forEach(element => {
        if (element.referencia === null) {
          this.UnidadesArticulo.push({ value: element.medida, precio: element.precio });
        }
      });
      // (this.control.controls[arg.index] as any).controls['uni'].setValue(arg.medida);
      // (this.control.controls[arg.index] as any).controls['pre'].setValue(this.formatearNumero(arg.precio));
      // this.drop = false;
    }

    const sigInput = 'can-' + arg.index;
    this.enfocarInput(sigInput);
  }

  noArticuloEncontrado(arg) {
    this.shServ.toastError('Articulo no existe', 'ERROR');
    this.enfocarInput('cod-' + arg);
    // this.element = document.getElementById('cod-' + arg) as HTMLElement;
    // this.element.focus();
  }
}
