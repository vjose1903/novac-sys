import { TablasService } from './../../../components/new_tablas/tablas.service';
import { table_config } from './../../../components/new_tablas/tabla-class';
import { CuentasContablesService } from './utils/cuentas-contables.service';
import { TreeNode } from 'primeng/api';
import { fun } from './../../../../core/services/functions.service';
import { MixinClass } from './../../../../core/typescript/MixinClass';
import { CuentaContableC, CuentaContableI } from './../cuentas_contables';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CuentasContablesFormComponent } from './cuentas-contables-form/cuentas-contables-form.component';

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

  treeNodes: TreeNode[] = [];
  treeTableScrollHeight;
  seleccionado;

  fun = fun;

  table_config: table_config = {
    info: [
      { key: 'codigo', titulo: 'No. Cuenta', style: {} },
      { key: 'descripcion', titulo: 'Cuenta', style: {} },
      { key: 'origen', titulo: 'Origen', style: { 'text-align': 'center', width: '10%' } },
      { key: 'tipo', titulo: 'Tipo', style: { 'text-align': 'center', width: '10%' } },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '1rem',
        style: { 'text-align': 'center', width: '15%' },
        iconsArray: [
          { key: 'add_account', rowTooltip: 'add_account_tooltip', text_color: 'colorNegro', disable: [{ kind: 'campo', target: 'is_control', value: [false] }] },
          { key: 'edit_account', tooltip: 'Editar Cuenta', text_color: 'colorNegro' },
          { key: 'delete_account', tooltip: 'Eliminar Cuenta', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_cuentas_contables',
  };

  constructor(private cuentasContablesServ: CuentasContablesService, public tServ: TablasService) {
    super();
  }

  ngOnInit() {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.getCuentasContables();
  }

  async getCuentasContables(filter_target: string | null = null) {
    try {
      const res = await this.cuentaContableClass.getAll({ parameters: { filter_target: filter_target, include_fathers_tree: true, cuenta_control: true } });

      this.listaCuentasContables.length = 0;
      let utils = { current_index: 0 };

      res.data.forEach((cuenta: CuentaContableI) => {
        const cuentaParsed: any = this.parseCuentasContables(fun.duplicarJson(cuenta), utils);
        utils.current_index += 1;
        this.listaCuentasContables.push(cuentaParsed);
      });

      this.treeNodes = this.cuentasContablesServ.cuentasIterator(this.listaCuentasContables);

      setTimeout(() => this.calculateScroll(), 500);
    } catch (e) {}
  }

  parseCuentasContables(cuentaParsed, utils) {
    cuentaParsed.add_account = 'fa-solid fa-plus';
    cuentaParsed.edit_account = 'fas fa-pencil-alt';
    cuentaParsed.delete_account = 'far fa-trash-alt';

    cuentaParsed.add_account_tooltip = cuentaParsed.is_control ? 'Añadir Cuenta' : 'Solo se pueden añadir cuentas a las cuentas control';
    cuentaParsed.index = utils.current_index;

    cuentaParsed.customStyles = {
      estado_: { width: '5rem', 'font-size': '1.1rem' },
      actions: [
        { key: 'actions', isTd: true, estilos: 'width: 15% !important;' },
        { key: 'add_account', estilos: 'font-size: 1.2rem !important;' },
        { key: 'edit_account', estilos: 'font-size: 1.2rem !important' },
        { key: 'delete_account', estilos: 'font-size: 1.2rem !important' },
      ],
    };

    if (fun.hasValue(cuentaParsed.cuentas_contables)) {
      for (const cuenta_hija of cuentaParsed.cuentas_contables) {
        utils.current_index += 1;
        this.parseCuentasContables(cuenta_hija, utils);
      }
    }

    return cuentaParsed;
  }

  calculateScroll() {
    const calculo = this.catalogoCuentasBody?.nativeElement?.offsetHeight - this.trTreeHead?.nativeElement?.offsetHeight;

    this.treeTableScrollHeight = `${calculo}px`;
  }

  filter(event) {
    const search = event.target.value;
    fun.awaitTyping(event).then(() => this.getCuentasContables(search));
  }

  iconsClick(event) {
    const params = event.arg;
    let header = '';
    let inputs = null;
    console.log('params ', params);

    if (params.columnKey == 'actions') {
      if (params.iconKey == 'add_account') {
        header = 'Registro cuenta contable';
        inputs = { data: params.data, dataOriginal: fun.duplicarJson(params.data), method: 'add', cuenta_control: params.data.cuenta_control };
      }

      if (params.iconKey == 'edit_account') {
        header = 'Actualizar cuenta contable';
        inputs = { data: params.data, dataOriginal: fun.duplicarJson(params.data), method: 'edit', cuenta_control: params.data.cuenta_control };
      }

      if (params.iconKey == 'add_account' || params.iconKey == 'edit_account') {
        this.openNewModal({
          component: CuentasContablesFormComponent,
          inputs: inputs,
          id: 'form_cuenta_contable',
          header: header,
          width: '35rem',
          botones: { aceptar: { show: true, disable: true }, cancelar: { show: true, disable: false } },
        });
      }

      if (params.iconKey == 'delete_account') {
        console.log('ELIMINAR CUENTA');
      }
    }
  }
}
