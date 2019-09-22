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

    const control = <FormArray>this.form.controls['rowFactura'];
    let codigo = (control.controls[i] as any).controls['cod'].value;

    if (i >= 10 && input === 'cod-') {
      this.addItem();
    }

    if (input === 'can-') {
      codigo = _.parseInt(codigo);

      if (_.isInteger(codigo)) {
        // console.log('es un codigo');
      } else {
        codigo = (control.controls[i] as any).controls['cod'].value;
        this.filtrarArticulo(codigo);
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
}
