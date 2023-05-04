import { CuentasContablesService } from './utils/cuentas-contables.service';
import { TreeNode } from 'primeng/api';
import { fun } from './../../../../core/services/functions.service';
import { MixinClass } from './../../../../core/typescript/MixinClass';
import { CuentaContableC, CuentaContableI } from './../cuentas_contables';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'catalogo-cuentas',
  templateUrl: './catalogo-cuentas.component.html',
  styleUrls: ['./catalogo-cuentas.component.scss'],
})
export class CatalogoCuentasComponent extends MixinClass implements OnInit {
  @ViewChild('catalogoCuentasBody', { static: false }) catalogoCuentasBody: ElementRef;
  @ViewChild('trTreeHead', { static: false }) trTreeHead: ElementRef;
  @ViewChild('trTreeBody', { static: false }) trTreeBody: ElementRef;

  cuentaContableClass = new CuentaContableC();

  listaCuentasContables: Array<CuentaContableI> = [];
  copyListaCuentasContables: Array<CuentaContableI> = [];

  cols: any[];

  treeNodes: TreeNode[] = [];
  treeTableScrollHeight;

  constructor(private cuentasContablesServ: CuentasContablesService) {
    super();
  }

  ngOnInit() {
    this.necesarioStart();
  }

  async necesarioStart() {
    this.parseTreeTable();
    await this.getCuentasContables();
  }

  parseTreeTable() {
    this.cols = [
      { field: 'codigo', header: 'No. Cuenta', style: {} },
      { field: 'descripcion', header: 'Cuenta', style: {} },
      { field: 'origen', header: 'Origen', style: { 'text-align': 'center', width: '10%' } },
      { field: 'tipo', header: 'Tipo', style: { 'text-align': 'center', width: '10%' } },
      { field: null, header: 'Acciones', style: { 'text-align': 'center', width: '15%' } },
    ];
  }

  async getCuentasContables() {
    try {
      const res = await this.cuentaContableClass.getAll({ parameters: { is_for_tree_table: true } });
      console.log('res.data --> ', res.data);

      this.listaCuentasContables.length = 0;
      this.copyListaCuentasContables.length = 0;

      res.data.forEach((cuenta: CuentaContableI) => {
        this.listaCuentasContables.push(cuenta);
      });

      this.copyListaCuentasContables = fun.duplicarJson(this.listaCuentasContables);
      this.treeNodes = this.cuentasContablesServ.cuentasIterator(this.listaCuentasContables);
      // console.log('this.treeNodes--> ', this.treeNodes);

      // console.log('this.listaCuentasContables --> ', this.listaCuentasContables);
      setTimeout(() => this.calculateScroll(), 500);
    } catch (e) {}
  }

  calculateScroll() {
    const calculo = this.catalogoCuentasBody?.nativeElement?.offsetHeight - this.trTreeHead?.nativeElement?.offsetHeight;

    this.treeTableScrollHeight = `${calculo}px`;
    console.log('this.treeTableScrollHeight ', this.treeTableScrollHeight);
  }
}
