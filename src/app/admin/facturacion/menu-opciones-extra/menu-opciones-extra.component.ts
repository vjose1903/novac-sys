import { HtmlElementsService } from './../../../core/services/html-elements.service';
import { Router } from '@angular/router';
import { ModalComponentI } from './../../components/modal/modal-class';
import { ClienteC } from './../../registros/registro-clientes/cliente';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { tableCellType, table_config } from './../../components/new_tablas/tabla-class';
import { FacturaC, tipoDocFacturacion } from './../factura';
import { TablasService } from './../../components/new_tablas/tablas.service';
import { fun } from './../../../core/services/functions.service';
import { Component, OnInit, inject } from '@angular/core';
import { ModalI } from '../../components/modal/modal-class';
import * as _ from 'lodash';

@Component({
  selector: 'app-menu-opciones-extra',
  templateUrl: './menu-opciones-extra.component.html',
  styleUrls: ['./menu-opciones-extra.component.scss'],
})
export class MenuOpcionesExtraComponent extends MixinClass implements OnInit, ModalI {
  constructor(private tServ: TablasService, private router: Router) {
    super();
  }

  modalComponent: ModalComponentI = {};
  inputs: any;

  filter_key;
  filter_value = '';
  documentos = [];
  listaClientes = [];
  clienteSelected;

  filter_options = {
    todos: '0',
    cliente: '1',
    numero_documento: '3',
  };

  tipo_documento_selected;

  tipos_filtro = [
    { key: this.filter_options.todos, label: 'Todos' },
    { key: this.filter_options.cliente, label: 'Cliente' },
    { key: this.filter_options.numero_documento, label: 'Número de Documento' },
  ];

  table_config;

  tablaComponent;

  table_notas_config: table_config = {
    info: [
      { titulo: 'No. Doc.', tooltip: 'Número de documento', tipo: tableCellType.text, key: 'secuencia', estilos: [{ width: '7rem' }] },
      { titulo: 'Cliente', tipo: tableCellType.text, key: 'cliente.nombre', estilos: [{ 'text-align': 'start' }, { 'padding-left': '1rem' }, { width: '45%' }] },
      { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente', estilos: [{ width: '6rem' }] },
      { titulo: 'Total', tipo: tableCellType.formatoNumero, key: 'total_factura' },
      {
        titulo: 'Acciones',
        tipo: tableCellType.icon,
        key: 'actions',
        estilos: [{ width: '9%' }],
        iconsArray: [
          { key: 'view', tooltip: 'Ver Documento', text_color: 'viewColor' },
          { key: 'rellenar_factura', tooltip: 'Crear Factura desde Cotización', disable: [{ kind: 'has_value', target: 'fecha_completada' }] },
        ],
      },
    ],
    focusRow: true,
    colores: true,
    id_tabla: 'lista_documentos',
    padre_functions: { data_request: (params) => this.buscarDocumentos(params) },
    obj_paginate: { show: true, showTotal: true, is_local: false },
  };

  facturaClass = new FacturaC();
  clienteClass = new ClienteC();

  htmlServ = inject(HtmlElementsService);

  ngOnInit(): void {
    this.filter_key = this.filter_options.todos;
    this.buscarDocumentos(this.tServ.obj_paginate.default);
  }

  selectFiltro() {
    this.clienteSelected = undefined;
    this.filter_value = '';

    if (this.filter_key == this.filter_options.todos) {
      this.buscarDocumentos(this.tServ.obj_paginate.default);
    } else {
      setTimeout(() => fun.enfocarInput('valorI'), 100);
    }
  }

  desenfocarValor() {
    fun.desEnfocarInput('valorI');
  }

  async checkNumeroPreFactura() {
    if (this.filter_value.length < 8 || this.filter_value.includes('_')) fun.toastWarning('Numero de Pre-venta incompleto', 'Aviso');
    else this.buscarDocumentos(this.tServ.obj_paginate.default);
  }

  async getClientes(arg) {
    if (typeof this.clienteSelected == 'string' && fun.hasValue(arg.value)) {
      fun.awaitTyping().then((res) => {
        const extra = { afterPath: `filtro/${arg.value}`, parameters: { paginado: false } };

        this.clienteClass.getAll(extra).then((res) => {
          res['data'].map((cliente) => {
            cliente.documentos_de_identidad.map((docu) => {
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

  async buscarDocumentos(params?: { per_page?: number; page?: number; search?: string }) {
    try {
      this.documentos.length = 0;

      const args = { campo: this.filter_key, valor: this.filter_value, tipo_factura_id: 0, adelantada: false, page: params.page, per_page: params.per_page, paginado: true, tipo: this.inputs.code, pagada: false, estado: true };
      const res = await this.facturaClass.getFacturasByParams(args);

      res['data'].forEach((fact) => {
        fact.secuencia = String(fact.numero_factura).padStart(8, '0');

        fact.viewColor = 'gris-claro';
        fact.view = 'far fa-eye-slash';
        fact.rellenar_factura = 'fas fa-external-link-alt';
        fact.iconsMoveEvents = [{ key: 'view', hover: ['fa-eye', 'text-black'], leave: ['fa-eye-slash', 'text-gris-claro'] }];

        fact.customStyles = {
          secuencia: { width: '7rem' },
          'cliente.nombre': { 'text-align': 'start', 'padding-left': '1rem', width: '45%' },
          fecha_equivalente: { width: '6rem' },

          actions: [
            { key: 'actions', isTd: true, estilos: 'width: 8% !important;' },
            { key: 'view', estilos: 'font-size: 1.1rem !important;' },
            { key: 'rellenar_factura', estilos: 'font-size: 1.1rem !important; margin:  0rem 0.8rem !important;' },
          ],
        };

        this.documentos.push(fact);
      });

      this.documentos = this.documentos.sort((a, b) => fun.compare(a, b, 'fecha_equivalente', 'desc'));

      if (this.documentos.length > 0) {
        setTimeout(() => this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]), 100);
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
        this.facturaClass.parseDataToPdf(params.data).then((factura_parsed) => {
          this.mostrarFactura(factura_parsed, this.inputs.code == tipoDocFacturacion.cotizacion ? 'cotizacion' : 'facturacion');
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

    let botonesDinamicos = [{ clase: 'btn btn-blanco', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false as any }];

    if (this.inputs.code == tipoDocFacturacion.cotizacion) {
      botonesDinamicos.push({
        clase: 'btn btn-gris ml-2',
        function: (instance) => {
          instance.dismissModal(instance.id);
          this.tableClickIcon({ id_tabla: 'mostrar_documento', columnKey: 'actions', iconKey: 'rellenar_factura', data: dataFactura });
        },
        label: 'Facturar',
        disable: { function: () => fun.hasValue(dataFactura.fecha_completada) },
      });
    }

    const dataModal = { id: 'mostrarDocumento', header: 'MOSTRAR DOCUMENTO' };

    this.facturaClass.handleMostrarFactura(toPDFData, dataModal, botonesDinamicos).then((obj_modal) => this.openNewModal(obj_modal));
  }

  pasar_a_facturacion(documento_selected) {
    this.modalComponent.closeModal(this.modalComponent.id);

    this.router.navigateByUrl('/').then((res) => {
      this.router.navigateByUrl(`/admin/factura/venta/bill_from_${this.inputs.code}/${documento_selected.id}`);
    });
  }

  btn_aceptar() {}
}
