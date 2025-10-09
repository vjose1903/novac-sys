import { HtmlElementsService } from '@core/services/html-elements.service';
import { Router } from '@angular/router';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { MixinClass } from '@core/typescript/MixinClass';
import { default_per_page, table_config } from '@components/new_tablas/tabla-class';
import { FacturaC, FacturasI, request_factura_campo, tipoDocFacturacion } from './../factura';
import { TablasService } from '@components/new_tablas/tablas.service';
import { fun } from '@core/services/functions.service';
import { Component, inject, ViewChild, ElementRef, Input, signal, AfterViewInit, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { IButtonDynamic, IDynamicModal, IModalConfiguration, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

@Component({
  selector: 'app-menu-opciones-extra',
  templateUrl: './menu-opciones-extra.component.html',
  styleUrls: ['./menu-opciones-extra.component.scss'],
  standalone: false,
})
export class MenuOpcionesExtraComponent extends MixinClass implements OnInit, IDynamicModal {
  @ViewChild('dropdownCliente') dropdownCliente: ElementRef;

  constructor(
    private tServ: TablasService,
    private router: Router
  ) {
    super();
  }

  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;
  @Input() code!: tipoDocFacturacion;

  filter_value = '';
  documentos = signal<FacturasI[]>([]);
  listaClientes = [];
  clienteSelected;

  filter_options = {
    todos: request_factura_campo.todas,
    cliente: request_factura_campo.cliente_id,
    numero_documento: request_factura_campo.numero_factura,
  };

  filter_key = this.filter_options.todos;

  tipo_documento_selected;
  tipos_filtro = [
    { key: this.filter_options.todos, label: 'Todos' },
    { key: this.filter_options.cliente, label: 'Cliente' },
    { key: this.filter_options.numero_documento, label: 'No. de Cotización' },
  ];

  tablaComponent: any = undefined;

  table_config: table_config = {
    info: [
      { titulo: 'No. Doc.', tooltip: 'Número de documento', tipo: 'text', key: 'secuencia', style: { width: '7rem' } },
      { titulo: 'Cliente', tipo: 'text', key: 'cliente.nombre_completo', style: { 'text-align': 'start', 'padding-left': '1rem', width: '45%' } },
      { titulo: 'Fecha', tipo: 'date', key: 'fecha_equivalente', style: { width: '6rem' } },
      { titulo: 'Total', tipo: 'formatoNumero', key: 'total_factura' },
      {
        titulo: 'Acciones',
        tipo: 'icon',
        key: 'actions',
        style: { width: '9%' },
        iconsArray: [
          { key: 'view', tooltip: 'Ver Documento', text_color: 'viewColor' },
          { key: 'rellenar_factura', tooltip: 'Crear Factura desde Cotización', disable: [{ kind: 'has_value', target: 'fecha_completada' }] },
        ],
      },
    ],
    focusRow: true,
    colores: true,
    id_tabla: 'lista_documentos',
    padre_functions: { data_request: params => this.buscarDocumentos(params) },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
  };

  facturaClass = new FacturaC();
  clienteClass = new ClienteC();

  htmlServ = inject(HtmlElementsService);

  ngOnInit(): void {
    this.buscarDocumentos(this.tServ.obj_paginate.default);
  }

  selectFiltro() {
    this.clearFilterValues();

    if (this.filter_key == this.filter_options.todos) {
      this.showAllDocuments();
    } else {
      fun.setTimeout(() => fun.enfocarInput('valorI'), 100);
    }
  }

  dropdownClienteAction(action: 'show' | 'hide') {
    requestAnimationFrame(() => {
      this.tServ.blockRowMovement = action === 'show';
      if (action === 'hide') fun.desEnfocarInput('valorI');
    });
  }

  clearFilterValues() {
    this.clienteSelected = null;
    this.filter_value = '';
  }

  showAllDocuments() {
    this.buscarDocumentos(this.tServ.obj_paginate.default);
  }

  clearFilters() {
    const currentFilterKey = this.filter_key;
    this.filter_key = this.filter_options.todos;
    this.clearFilterValues();
    this.clearClienteFilter();
    this.showAllDocuments();

    this.filter_key = currentFilterKey;
  }

  async checkNumeroPreFactura(evento) {
    requestAnimationFrame(() => {
      if (this.filter_value.length < 8 || this.filter_value.includes('_')) fun.toastWarning('Numero de Pre-venta incompleto', 'Aviso');
      else this.buscarDocumentos(this.tServ.obj_paginate.default);
      evento.stopPropagation();
      evento.preventDefault();
    });
  }

  async getClientes(arg) {
    if (typeof this.clienteSelected == 'string' && arg.value && arg.value !== '') {
      fun.awaitTyping().then(res => {
        const extra = { afterPath: `filtro/${arg.value}`, parameters: { paginado: false } };

        this.clienteClass.getAll(extra).then(res => {
          res['data'].map(cliente => {
            cliente.documentos_de_identidad.map(docu => {
              if (docu.principal) cliente.documento_identidad = docu.documento;
            });
            return cliente;
          });

          this.listaClientes = res['data'];
        });
      });
    } else {
      if (typeof this.clienteSelected == 'object' && fun.hasValue(this.clienteSelected?.id)) {
        this.filter_value = this.clienteSelected.id;
        this.buscarDocumentos(this.tServ.obj_paginate.default);
      }
    }
  }

  clearClienteFilter() {
    this.listaClientes.length = 0;
  }

  async buscarDocumentos(params?: { per_page: number; page: number; search: string }) {
    try {
      this.documentos.set([]);

      const args = { campo: this.filter_key, valor: this.filter_value, tipo_factura_id: 0, adelantada: false, page: params.page, per_page: params.per_page, paginado: true, tipo: this.code, pagada: false, estado: true };
      const res = await this.facturaClass.getFacturasByParams(args);

      const documentos = res['data'].map(fact => {
        fact.secuencia = fact.numero_factura.toString().padStart(8, '0');

        fact.viewColor = 'gris-claro';
        fact.view = 'far fa-eye-slash';
        fact.rellenar_factura = 'fas fa-external-link-alt';
        fact.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];

        fact.customStyles = {
          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 8% !important;' },
            { key: 'view', estilos: 'font-size: 1.1rem !important;' },
            { key: 'rellenar_factura', estilos: 'font-size: 1.1rem !important; margin:  0rem 0.8rem !important;' },
          ],
        };

        return fact;
      });

      this.documentos.set(documentos.sort((a, b) => fun.compare(a, b, 'id', 'desc')));

      if (this.documentos().length > 0) {
        fun.setTimeout(() => {
          if (this.tablaComponent) this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
        }, 100);
      } else {
        if (this.filter_key == this.filter_options.cliente) {
          fun.toastError('Este cliente no tiene facturas del tipo seleccionada', 'ERROR');
        } else if (this.filter_key == this.filter_options.numero_documento) {
          fun.toastError('No existen facturas con este número.', 'ERROR');
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  tableClickIcon(params) {
    if (params.columnKey == 'actions') {
      if (params.iconKey == 'view') {
        this.facturaClass.parseDataToPdf(params.data).then(factura_parsed => {
          this.mostrarFactura(factura_parsed, this.code == tipoDocFacturacion.cotizacion ? 'cotizacion' : 'facturacion');
        });
      }

      if (params.iconKey == 'rellenar_factura') {
        this.pasar_a_facturacion(params.data);
      }
    }
  }

  tableClickRow(event) {
    this.pasar_a_facturacion(event.data);
  }

  mostrarFactura(dataFactura, type) {
    const toPDFData = { data: dataFactura, type: type };

    let botonesDinamicos: IButtonDynamic[] = [{ clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false as any }];

    if (this.code == tipoDocFacturacion.cotizacion) {
      botonesDinamicos.push({
        clase: 'btn btn-gris',
        function: instance => {
          this.tableClickIcon({ id_tabla: 'mostrar_documento', columnKey: 'actions', iconKey: 'rellenar_factura', data: dataFactura });
          instance.close();
        },
        label: 'Facturar',
        disable: { function: () => fun.hasValue(dataFactura.fecha_completada) },
      });
    }

    const dataModal = { id: 'mostrarDocumento', header: 'MOSTRAR DOCUMENTO', show_estado: false };

    this.facturaClass.handleMostrarFactura(toPDFData, dataModal, botonesDinamicos);
  }

  pasar_a_facturacion(documento_selected) {
    this.modalConfig.close();

    console.log(this.code);

    // this.router.navigateByUrl(`/admin/factura/venta/bill_from_cotizacion/${cotizacion.id}`);

    this.router.navigateByUrl(`/admin/factura/venta/bill_from_${this.code}/${documento_selected.id}`);
  }

  btn_aceptar() {}
}
