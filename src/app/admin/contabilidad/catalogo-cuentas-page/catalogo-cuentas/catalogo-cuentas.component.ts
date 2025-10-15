import { DateUtils } from '@vjose1903/dateutils';
import { TablasService } from '@components/new_tablas/tablas.service';
import { tableCellType, table_config, table_info } from '@components/new_tablas/tabla-class';
import { CuentasContablesService } from './utils/cuentas-contables.service';
import { TreeNode } from 'primeng/api';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { CuentaContableC, CuentaContableI } from './cuentas-contables-form/cuentas_contables.utils';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CuentasContablesFormComponent } from './cuentas-contables-form/cuentas-contables-form.component';
import * as _ from 'lodash';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { confirmationButtons, ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'catalogo-cuentas',
  templateUrl: './catalogo-cuentas.component.html',
  styleUrls: ['./catalogo-cuentas.component.scss'],
  standalone: false,
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
  filter_target;

  fun = fun;
  tableCellType = tableCellType;
  table_config: table_config = {
    info: [
      { key: 'codigo', titulo: 'No. Cuenta', tipo: tableCellType.text, style: { width: '23%' } },
      { key: 'descripcion', titulo: 'Cuenta', tipo: tableCellType.text, style: {} },
      { key: 'origen', titulo: 'Origen', tipo: tableCellType.text, style: { 'text-align': 'center', width: '10%' } },
      { key: 'tipo', titulo: 'Tipo', tipo: tableCellType.text, style: { 'text-align': 'center', width: '10%' } },
      { key: 'status', titulo: 'Estado', tipo: tableCellType.tag, row_tag_color: 'status_tag_color', style: { 'text-align': 'center', width: '10%' } },
      {
        key: 'actions',
        titulo: 'Acciones',
        column_gap: '1rem',
        tipo: tableCellType.icon,
        style: { 'text-align': 'center', width: '11%' },
        iconsArray: [
          { id: 'btn_add_account', key: 'add_account', rowTooltip: 'add_account_tooltip', text_color: 'colorNegro', disable: [{ kind: 'campo', target: 'is_control', value: [false] }] },
          { id: 'btn_edit_account', key: 'edit_account', tooltip: 'Editar Cuenta', text_color: 'colorNegro' },
          { id: 'btn_deactivate_reactivate_account', key: 'deactivate_reactivate_account', rowTooltip: 'deactivate_reactivate_account_tooltip', text_color: 'colorNegro' },
        ],
      },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_cuentas_contables',
  };

  private dynamicModalServ: DynamicModalService = inject(DynamicModalService);
  private cuentasContablesServ: CuentasContablesService = inject(CuentasContablesService);
  public tServ: TablasService = inject(TablasService);

  constructor() {
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
      const res = await this.cuentaContableClass.getAll({ parameters: { filter_target: filter_target, include_fathers_tree: true, cuenta_control: true, cuenta_control_id: true, iterator: true } });

      this.listaCuentasContables.length = 0;
      let utils = { current_index: 0 };

      res.data.forEach((cuenta: CuentaContableI) => {
        const cuentaParsed: any = this.parseCuentasContables(fun.deepCloning(cuenta), utils);
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

    cuentaParsed.deactivate_reactivate_account = cuentaParsed.estado ? 'fa-solid fa-ban' : 'fa-regular fa-circle-check';
    cuentaParsed.deactivate_reactivate_account_tooltip = cuentaParsed.estado ? 'Desactivar Cuenta' : 'Reactivar Cuenta';

    cuentaParsed.status = cuentaParsed.estado ? 'ACTIVA' : 'DESACTIVA';
    cuentaParsed.status_tag_color = cuentaParsed.estado ? 'green' : 'red';

    cuentaParsed.add_account_tooltip = cuentaParsed.is_control ? 'Añadir Cuenta' : 'Solo se pueden añadir cuentas a las cuentas control';
    cuentaParsed.index = utils.current_index;

    cuentaParsed.customStyles = {
      codigo: { width: '23%' },
      status: { width: '10%' },
      actions: [
        { key: 'actions', isTd: true, estilos: 'width: 11% !important;' },
        { key: 'add_account', estilos: 'font-size: 1.1rem !important;' },
        { key: 'edit_account', estilos: 'font-size: 1.1rem !important' },
        { key: 'deactivate_reactivate_account', estilos: 'font-size: 1.1rem !important' },
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

  getValueForm(column: table_info, data) {
    switch (column.tipo) {
      case 'textList':
        return _.reduce(_.get(data, column.key), (acumulado, item) => acumulado + `${acumulado.length ? ',' : ''}  ${_.get(item, column.key_value)}`, '');

      case 'formatoNumero':
        return this.formatoNumero(_.get(data, column.key));

      case 'date':
        const fecha = DateUtils.format({ date: _.get(data, column.key), dateFormat: fun.hasValue(column.dateFormat) ? column.dateFormat : 'DD/MM/YYYY', include_hour: column.include_hour });
        return fecha;

      default:
        return _.get(data, column.key);
    }
  }

  calculateScroll() {
    const calculo = this.catalogoCuentasBody?.nativeElement?.offsetHeight - this.trTreeHead?.nativeElement?.offsetHeight;

    this.treeTableScrollHeight = `${calculo}px`;
  }

  filter(event: any) {
    this.filter_target = event.target.value;
    fun.awaitTyping({ event }).then(() => this.getCuentasContables(this.filter_target));
  }

  iconsClick(event) {
    const params = event.arg;
    let header = '';
    let inputs = null;

    if (params.columnKey == 'actions') {
      if (params.iconKey == 'add_account') {
        header = 'Registro cuenta contable';
        inputs = { data: params.data, dataOriginal: fun.deepCloning(params.data), method: 'add', cuenta_control: params.data.cuenta_control };
      }

      if (params.iconKey == 'edit_account') {
        header = 'Actualizar cuenta contable';
        inputs = { data: params.data, dataOriginal: fun.deepCloning(params.data), method: 'edit', cuenta_control: params.data.cuenta_control };
      }

      if (params.iconKey == 'add_account' || params.iconKey == 'edit_account') {
        const cuentasContablesModalConf = new DynamicModalClass();

        cuentasContablesModalConf.id = 'form_cuenta_contable';
        cuentasContablesModalConf.inputs = inputs;
        cuentasContablesModalConf.header = header;
        cuentasContablesModalConf.width = '35rem';
        cuentasContablesModalConf.component = CuentasContablesFormComponent;
        cuentasContablesModalConf.closableEsc = false;
        cuentasContablesModalConf.setCallback(this.processCuentaContableModal.bind(this));
        cuentasContablesModalConf.botones = [
          { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
          { id: 'btnAceptar', clase: 'btn btn-verde', label: 'Aceptar', disable: true },
        ];
        cuentasContablesModalConf.show();
      }

      if (params.iconKey == 'deactivate_reactivate_account') {
        const texto = params.data.estado
          ? `Seguro que desea <b class="negrita"> DESACTIVAR </b> la cuenta <b class="negrita">${params.data.descripcion}</b>`
          : `Seguro que desea <b class="negrita"> REACTIVAR </b> la cuenta <b class="negrita">${params.data.descripcion}</b>`;

        const onYes = () => {
          this.deactivateOrReactivateAccount(params.data);
        };

        this.dynamicModalServ.confirmationModal({
          id: 'deactivate_or_reactivate_account',
          texto: texto,
          btnKind: params.data.estado ? confirmationButtons.cancelarDesactivar : confirmationButtons.cancelarActivar,
          onYes: onYes.bind(this),
        });
      }
    }
  }

  processCuentaContableModal(arg: ICallbackModal) {
    if (arg.type == modalCloseType.onHide) return;

    this.requests(arg.data);
  }

  deactivateOrReactivateAccount(data) {
    this.cuentaContableClass.updateOne({ id: data.id }, { afterPath: 'deactivate_or_reactivate', parameters: { status: !data.estado } }).then(res => {
      this.getCuentasContables(this.filter_target);
    });
  }

  requests(data) {
    this.cuentaContableClass.createUpdateOne(data).then(res => {
      this.getCuentasContables(this.filter_target);
    });
  }
}
