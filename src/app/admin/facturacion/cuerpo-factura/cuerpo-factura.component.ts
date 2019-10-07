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
import { SELECCIONMODAL, SHOWMODAL, TIPOMODAL, DECISIONMODAL, OBJDEVUELTO, INDEXTOFOCUS } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  form: FormGroup;
  rowFactura: FormArray;
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

  subObjDevueltoModal: Subscription;
  subIndexToFocusModal: Subscription;
  @Output() sendCalculos = new EventEmitter<any>();

  constructor(private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {
    this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.form = this.fb.group({
      hide: [''],
      rowFactura: this.fb.array([this.createItem()]),
    });

    for (let index = 0; index <= 9; index++) {
      this.addItem();
    }

    this.shServ.getArticulos().subscribe(res => {
      this.listaArticulos = res;
    });

    this.subObjDevueltoModal = OBJDEVUELTO.subscribe(res => {
      this.clickRowModal(res);
    });
    this.subIndexToFocusModal = INDEXTOFOCUS.subscribe(res => {
      this.noArticuloEncontrado(res);
    });
  }

  ngOnDestroy() {
    this.subObjDevueltoModal.unsubscribe();
    this.subIndexToFocusModal.unsubscribe();
  }
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
      // console.log(nStr, '=======');

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
      cod: [''],
      can: [''],
      des: [''],
      uni: [''],
      pre: [''],
      tot: [''],
    });
  }

  addItem(): void {
    this.rowFactura = this.form.get('rowFactura') as FormArray;
    this.rowFactura.push(this.createItem());
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
      this.UnidadesArticulo = [];
      this.aumentarSecuencia();

      const medida = (this.control.controls[i] as any).controls['uni'].value;

      if (medida === '' || medida === null) {
        // this.enfocarInput('uni-' + (i - 1));
      } else {
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
        this.element.blur();
        codigo = (this.control.controls[i] as any).controls['cod'].value;
        const obj = { filtrar: codigo, index: i };
        this.filtrarArticulo(obj);
      }
    }
  }

  buscarArticuloPorCodigo(i, codigo) {
    this.inputDrop = 'uni-' + i;

    this.shServ.getOneArticuloByCodigo(codigo).subscribe(
      res => {
        this.rowActual = res;
        (this.control.controls[i] as any).controls['des'].setValue(res.nombre);

        if (res.Isdetallable) {
          this.drop = true;
          this.verificarRow(i);
          this.UnidadesArticulo = [];
          this.UnidadesArticulo.push({ value: res.medida, precio: res.precio });
          res.detallableArray.forEach(element => {
            this.UnidadesArticulo.push({ value: element.medidaDetalle, precio: element.precioDetalle });
          });
        } else {
          (this.control.controls[i] as any).controls['uni'].setValue(res.medida);
          (this.control.controls[i] as any).controls['pre'].setValue(this.formatearNumero(res.precio));
          this.drop = false;
        }
      },
      err => {
        this.shServ.toastError(err.error.mensaje, 'ERROR');
        this.enfocarInput('cod-' + i);
      },
    );
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

    if (precio !== '' && precio !== null) {
      const tot = precio * cantidad;
      (this.control.controls[i] as any).controls['tot'].setValue(this.formatearNumero(_.round(tot, 2)));
      this.calculosTotalesGenerales();
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
    TIPOMODAL.next('buscar');
    SELECCIONMODAL.next(obj);
    SHOWMODAL.next(true);
    // this.seleccionModal = arg;
    // this.showModal = true;
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
    if (arg.Isdetallable) {
      this.drop = true;
      this.UnidadesArticulo = [];
      this.UnidadesArticulo.push({ value: arg.medida, precio: arg.precio });
      arg.detallableArray.forEach(element => {
        this.UnidadesArticulo.push({ value: element.medidaDetalle, precio: element.precioDetalle });
      });
    } else {
      (this.control.controls[arg.index] as any).controls['uni'].setValue(arg.medida);
      (this.control.controls[arg.index] as any).controls['pre'].setValue(this.formatearNumero(arg.precio));
      this.drop = false;
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
