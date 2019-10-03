import { Component, OnInit, ViewChildren, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { SharedService } from '../../../core/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

@Component({
  selector: 'app-cuerpo-factura',
  templateUrl: './cuerpo-factura.component.html',
  styleUrls: ['./cuerpo-factura.component.scss'],
})
export class CuerpoFacturaComponent implements OnInit, OnChanges, AfterViewInit {
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
  control;
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
  ngAfterViewInit() {
    this.control = <FormArray>this.form.controls['rowFactura'];
  }

  ngOnChanges() {}

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
    this.control = <FormArray>this.form.controls['rowFactura'];
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
        this.enfocarInput('uni-' + (i - 1));
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
    // console.log(codigo);

    this.shServ.getOneArticuloByCodigo(codigo).subscribe(
      res => {
        this.rowActual = res;
        (this.control.controls[i] as any).controls['des'].setValue(res.nombre);

        if (res.Isdetallable) {
          this.drop = true;
          this.UnidadesArticulo = [];
          this.UnidadesArticulo.push({ value: res.medida, precio: res.precio });
          res.detallableArray.forEach(element => {
            this.UnidadesArticulo.push({ value: element.medidaDetalle, precio: element.precioDetalle });
          });
        } else {
          (this.control.controls[i] as any).controls['uni'].setValue(res.medida);
          (this.control.controls[i] as any).controls['pre'].setValue(res.precio);
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
    this.control = <FormArray>this.form.controls['rowFactura'];

    this.indiceDetalle = _.findIndex(this.UnidadesArticulo, function(o) {
      return o.value === arg;
    });

    this.precioDetalle = this.UnidadesArticulo[this.indiceDetalle].precio;
    const unidad = this.UnidadesArticulo[this.indiceDetalle].value;

    (this.control.controls[i] as any).controls['uni'].setValue(unidad);
    (this.control.controls[i] as any).controls['pre'].setValue(this.precioDetalle);
  }

  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }

  verificarSecuencia(i, input?) {
    if (this.secuencia < i) {
      this.enfocarInput(this.inputSecuencia);
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
    this.control = <FormArray>this.form.controls['rowFactura'];
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
      (this.control.controls[arg.index] as any).controls['pre'].setValue(arg.precio);
      this.drop = false;
    }

    const sigInput = 'can-' + arg.index;
    this.enfocarInput(sigInput);
    // this.element = document.getElementById(sigInput) as HTMLElement;
    // this.element.focus();
  }
  noArticuloEncontrado(arg) {
    this.shServ.toastError('Articulo no existe', 'ERROR');
    this.enfocarInput('cod-' + arg);
    // this.element = document.getElementById('cod-' + arg) as HTMLElement;
    // this.element.focus();
  }
}
