import { Component, OnInit, ViewChildren, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { SharedService } from '../../../core/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent implements OnInit, OnChanges {
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
  TOTAL;
  ITBIS;
  rowActual;

  secuencia = 0;
  inputSecuencia = 'cod-0';
  inputDrop = 'uni-0';

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
  }

  ngOnChanges() {
    this.inputSecuencia = 'cod-' + this.secuencia;
    this.inputDrop = 'uni-' + this.secuencia;
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
    const control = <FormArray>this.form.controls['rowFactura'];
    control.removeAt(i);
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
    this.element = document.getElementById(sigInput) as HTMLElement;
    this.element.focus();

    if (i >= 10 && input === 'cod-') {
      this.addItem();
    }

    const control = <FormArray>this.form.controls['rowFactura'];
    let codigo = (control.controls[i] as any).controls['cod'].value;

    if (input === 'cod-') {
      this.UnidadesArticulo = [];
      // this.indiceDetalle = _.indexOf(this.listaArticulos, '');
      // (control.controls[i] as any).controls['pre'].setValue(res.precio);
      this.secuencia++;
      console.log(this.secuencia, '##############');
    }
    if (codigo === '') {
      this.element = document.getElementById('cod-' + i) as HTMLElement;
      this.element.focus();
    }
    if (input === 'can-' && codigo !== '') {
      codigo = _.parseInt(codigo);

      if (_.isInteger(codigo)) {
        codigo = (control.controls[i] as any).controls['cod'].value;
        this.shServ.getOneArticuloByCodigo(codigo).subscribe(
          res => {
            this.rowActual = res;
            (control.controls[i] as any).controls['des'].setValue(res.nombre);

            if (res.Isdetallable) {
              this.drop = true;
              this.UnidadesArticulo = [];
              this.UnidadesArticulo.push({ value: res.medida, precio: res.precio });
              res.detallableArray.forEach(element => {
                this.UnidadesArticulo.push({ value: element.medidaDetalle, precio: element.precioDetalle });
              });
            } else {
              (control.controls[i] as any).controls['uni'].setValue(res.medida);
              (control.controls[i] as any).controls['pre'].setValue(res.precio);
              this.drop = false;
            }
          },
          err => {
            this.shServ.toastError(err.error.mensaje, 'ERROR');
            this.element = document.getElementById('cod-' + i) as HTMLElement;
            this.element.focus();
          },
        );
      } else {
        this.element.blur();
        codigo = (control.controls[i] as any).controls['cod'].value;
        const obj = { filtrar: codigo, index: i };
        this.filtrarArticulo(obj);
        // console.log('debe de filtrar');
      }
    }
  }

  mostrarVerificador(arg) {
    console.log(this.inputDrop);
    console.log(this.secuenciaDelDrop(arg));
  }

  selectMedidaChange(arg, i) {
    // console.log(arg);
    const control = <FormArray>this.form.controls['rowFactura'];
    console.log(arg);

    this.indiceDetalle = _.findIndex(this.UnidadesArticulo, function(o) {
      return o.value === arg;
    });

    // console.log(this.rowActual, 'se supone que es el articulo seleccionado');
    // console.log(this.UnidadesArticulo, 'se supone que es el el array detallable');
    // console.log(this.indiceDetalle, 'se supone que es el indice');
    // console.log(this.UnidadesArticulo[this.indiceDetalle], 'se supone que es el precio');
    this.precioDetalle = this.UnidadesArticulo[this.indiceDetalle].precio;
    const unidad = this.UnidadesArticulo[this.indiceDetalle].value;

    (control.controls[i] as any).controls['uni'].setValue(unidad);
    (control.controls[i] as any).controls['pre'].setValue(this.precioDetalle);
  }

  verificarSecuencia() {
    this.element = document.getElementById(this.inputSecuencia) as HTMLElement;
    this.element.focus();
  }
  secuenciaDelDrop(arg) {
    return 'uni-' + arg;
  }

  // =============================================
  //  MODAL PARA FILTRAR ARTICULOS
  // =============================================
  abrirModal(arg) {
    this.seleccionModal = arg;
    this.showModal = true;
  }

  filtrarArticulo(arg) {
    this.abrirModal(arg);
    this.modalSearch = true;
  }

  reinicarVarModal() {
    this.modalSearch = false;
    this.showModal = false;
  }

  clickRowModal(arg) {
    const control = <FormArray>this.form.controls['rowFactura'];
    (control.controls[arg.index] as any).controls['cod'].setValue(arg.codigo);
    (control.controls[arg.index] as any).controls['des'].setValue(arg.nombre);
    this.rowActual = arg;
    if (arg.Isdetallable) {
      this.drop = true;
      this.UnidadesArticulo = [];
      this.UnidadesArticulo.push({ value: arg.medida, precio: arg.precio });
      arg.detallableArray.forEach(element => {
        this.UnidadesArticulo.push({ value: element.medidaDetalle, precio: element.precioDetalle });
      });
    } else {
      (control.controls[arg.index] as any).controls['uni'].setValue(arg.medida);
      (control.controls[arg.index] as any).controls['pre'].setValue(arg.precio);
      this.drop = false;
    }

    const sigInput = 'can-' + arg.index;
    this.element = document.getElementById(sigInput) as HTMLElement;
    this.element.focus();
  }
  noArticuloEncontrado(arg) {
    this.shServ.toastError('Articulo no existe', 'ERROR');
    this.element = document.getElementById('cod-' + arg) as HTMLElement;
    this.element.focus();
  }
}
