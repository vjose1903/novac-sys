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
export class CuerpoFacturaComponent implements OnInit {
  form: FormGroup;
  rowFactura: FormArray;
  listaArticulos: any;

  seleccionModal;
  showModal: boolean = false;
  modalSearch: boolean = true;

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

    if (input === 'can-') {
      codigo = _.parseInt(codigo);

      if (_.isInteger(codigo)) {
        codigo = (control.controls[i] as any).controls['cod'].value;
        this.shServ.getOneArticuloByCodigo(codigo).subscribe(
          res => {
            (control.controls[i] as any).controls['des'].setValue(res.nombre);
            (control.controls[i] as any).controls['pre'].setValue(res.precio);
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
    (control.controls[arg.index] as any).controls['pre'].setValue(arg.precio);

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
