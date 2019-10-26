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

  // subObjDevueltoModal: Subscription;
  // subIndexToFocusModal: Subscription;

  @Output() sendCalculos = new EventEmitter<any>();

  constructor(private dbServ: DBservice, private mServ: ModalService, private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {
    // this.rowFactura = new FormArray([new FormControl()]);
  }

  ngOnInit() {
    this.form = this.fb.group({
      hide: [''],
      rowFactura: this.fb.array([this.createItem()]),
    });

    this.ARRAY_ROWFACTURAS = this.form['rowFactura'] as FormArray;

    for (let index = 0; index <= 9; index++) {
      this.addItem();
    }

    this.dbServ.getArticulos().subscribe(res => {
      this.listaArticulos = res;
    });

    this.mServ.OBJDEVUELTO.subscribe(res => {
      if (res !== undefined) {
        this.clickRowModal(res);
      }
    });

    this.mServ.INDEXTOFOCUS.subscribe(res => {
      if (res !== undefined) {
        this.noArticuloEncontrado(res);
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
      cod: [''],
      can: [''],
      des: [''],
      uni: [''],
      pre: [''],
      tot: [''],
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

      if (unidad === '') {
        setTimeout(() => {
          this.enfocarInput('uni-' + (i - 1));
        }, 1);
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
      if (ARTICULO[0].Isdetallable) {
        this.drop = true;
        this.verificarRow(i);
        this.UnidadesArticulo = [];
        this.UnidadesArticulo.push({ value: ARTICULO[0].medida, precio: ARTICULO[0].precio_principal });
        ARTICULO[0].detallableArray.forEach(element => {
          this.UnidadesArticulo.push({ value: element.medidaDetalle, precio: element.precioDetalle });
        });
      } else {
        this.enfocarInput('cod-' + this.secuencia);
        (this.control.controls[i] as any).controls['uni'].setValue(ARTICULO[0].medida);
        (this.control.controls[i] as any).controls['pre'].setValue(this.formatearNumero(ARTICULO[0].precio_principal));
        this.drop = false;
      }
    }
    console.log(ARTICULO[0]);

    // this.shServ.getOneArticuloByCodigo(codigo).subscribe(
    //   res => {
    //     this.rowActual = res;
    //     (this.control.controls[i] as any).controls['des'].setValue(res.nombre);

    //     if (res.Isdetallable) {
    //       this.drop = true;
    //       this.verificarRow(i);
    //       this.UnidadesArticulo = [];
    //       this.UnidadesArticulo.push({ value: res.medida, precio: res.precio });
    //       res.detallableArray.forEach(element => {
    //         this.UnidadesArticulo.push({ value: element.medidaDetalle, precio: element.precioDetalle });
    //       });
    //     } else {
    //       this.enfocarInput('cod-' + this.secuencia);
    //       (this.control.controls[i] as any).controls['uni'].setValue(res.medida);
    //       (this.control.controls[i] as any).controls['pre'].setValue(this.formatearNumero(res.precio));
    //       this.drop = false;
    //     }
    //   },
    //   err => {
    //     this.shServ.toastError(err.error.mensaje, 'ERROR');
    //     this.enfocarInput('cod-' + i);
    //   },
    // );
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
