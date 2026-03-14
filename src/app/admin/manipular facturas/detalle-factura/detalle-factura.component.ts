import { Component, inject, Input, OnInit } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { serie, TrackStatusEnum } from '@core/typescript/constantes';
import { ModalDetalleFacturaI } from './detalle-factura.model';
import { MessageTask } from '@core/models/message-task';
import { ELECTRON_OPEN_WEB_BROWSER } from '../../../../../electron/shared-electron-angular';
import { IpcService } from '@core/services/ipc.service';
import { DateUtils } from '@vjose1903/dateutils';
import { ICallbackModal, IDynamicModal, IModalConfiguration, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { FacturaC, tipoDocFacturacion } from '@admin/facturacion/factura';
import { LoaderService } from '../../../loader/loader.service';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';
import { NotaC } from '../notas-cred-deb/notas';

interface FacturaAfectada {
  key: string;
  facturaId: number | null;
  numero: string;
}

interface PdfModalRestoreConfig {
  id: string;
  header: string;
  width?: string;
  height?: string;
  show_estado?: boolean;
  pdfType: string;
  documento: string;
}

interface ModalRestoreState {
  sourceData: any;
  documento: string;
  restoreSourcePdfModal: boolean;
  restoreDetalle: boolean;
  sourcePdfModalConfig: PdfModalRestoreConfig | null;
}

@Component({
  selector: 'app-detalle-factura',
  templateUrl: './detalle-factura.component.html',
  styleUrls: ['./detalle-factura.component.scss'],
  standalone: false,
})
export class DetalleFacturaComponent implements OnInit, IDynamicModal {
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;
  @Input() data!: any;
  @Input() documento!: string;

  TrackStatusEnum = TrackStatusEnum;
  serie = serie;
  fun = fun;
  facturasAfectadas: FacturaAfectada[] = [];
  facturaLoadingKey: string | null = null;
  detalles: ModalDetalleFacturaI[] = [
    { label: 'Forma de pago', key: 'forma_pago', tipo: 'string', div_clase: 'col-12 col-md-6 p-0 ' },
    { label: 'Fecha', key: 'fecha_equivalente', tipo: 'date', div_clase: 'col-12 col-md-6 p-0 ps-md-3' },
    { label: 'Comprobante', key: 'numero_comprobante', tipo: 'tag', div_clase: 'col-12 p-0', clase_string: 'text-black mb-0', bg_tag: '#bfbfbf' },
  ];
  facturaClass = new FacturaC();
  notaClass = new NotaC();
  _ipc = inject(IpcService);
  loadServ = inject(LoaderService);
  dynamicModalServ = inject(DynamicModalService);
  modalRestoreState: ModalRestoreState | null = null;

  constructor() {}

  ngOnInit(): void {
    this.validateDetails();
    this.validateElectronicInfoceDetails();
    this.loadFacturasAfectadas();
  }

  validateDetails() {
    if (this.documento == 'recibo') {
      this.detalles = this.detalles.filter(d => d.key != 'numero_comprobante');
    }

    if (this.documento == 'nota') {
      this.detalles = this.detalles
        .filter(d => d.key != 'forma_pago')
        .map(item => {
          if (item.key == 'fecha_equivalente') return { ...item, div_clase: 'col-12 col-md-6 p-0' };
          if (item.key == 'numero_comprobante') return { ...item, div_clase: 'col-12 col-md-6 p-0 ps-md-3' };

          return { ...item, label: item.label.replace('Forma de pago', 'Tipo de nota') };
        });
    }
  }

  validateElectronicInfoceDetails() {
    if (this.data?.serie == serie.electronica) {
      const is_aceptada = this.data.is_aceptada;

      this.detalles.push({
        label: 'Estado Ecf',
        key: 'is_aceptada',
        tipo: 'tag',
        div_clase: 'col-12 ps-0',
        clase_string: is_aceptada == TrackStatusEnum.ACCEPTED ? 'text-success' : is_aceptada == TrackStatusEnum.CONDITIONAL_ACCEPTED ? 'text-warning' : is_aceptada == TrackStatusEnum.REJECTED ? 'text-danger' : 'text-secondary',
        bg_tag: is_aceptada == TrackStatusEnum.ACCEPTED ? '#98ff98' : is_aceptada == TrackStatusEnum.CONDITIONAL_ACCEPTED ? '#ffff98' : is_aceptada == TrackStatusEnum.REJECTED ? '#fb9898' : '#bfbfbf',
      });
    }
  }

  loadFacturasAfectadas() {
    if (!this.showFacturasAfectadasSection()) return;

    const detallesAfectacion = this.documento == 'nota' ? this.getDetallesNota() : this.getDetallesRecibo();
    const facturasMap = new Map<string, FacturaAfectada>();

    detallesAfectacion.forEach(detalle => {
      const facturaId = this.getFacturaId(detalle);
      const numero = this.getFacturaAfectada(detalle);

      if (!fun.hasValue(numero) && !fun.hasValue(facturaId)) return;

      const key = fun.hasValue(facturaId) ? `id-${facturaId}` : `num-${numero}`;
      if (facturasMap.has(key)) return;

      facturasMap.set(key, { key, facturaId, numero: numero || `ID ${facturaId}` });
    });

    const facturas = Array.from(facturasMap.values());
    this.facturasAfectadas = this.documento == 'nota' ? facturas.slice(0, 1) : facturas;
  }

  getDetallesRecibo() {
    if (Array.isArray(this.data?.contenido_reporte)) return this.data.contenido_reporte;
    if (Array.isArray(this.data?.detalle_recibos)) return this.data.detalle_recibos;
    return [];
  }

  getDetallesNota() {
    if (Array.isArray(this.data?.facturas_aplicadas)) return this.data.facturas_aplicadas;
    if (Array.isArray(this.data?.contenido_reporte)) return this.data.contenido_reporte;
    return [];
  }

  getFacturaAfectada(detalle) {
    const comprobante =
      detalle?.cabecera_factura?.numero_comprobante ||
      detalle?.comprobante_fiscal ||
      detalle?.numero_comprobante ||
      this.data?.document_reference?.document_referenced?.numero_comprobante ||
      this.getComprobanteFromDescripcion(detalle?.descripcion);

    return fun.hasValue(comprobante) ? `${comprobante}`.trim() : null;
  }

  getFacturaId(detalle): number | null {
    const facturaId = detalle?.cabecera_factura_id ?? detalle?.cabecera_factura?.id ?? null;
    if (!fun.hasValue(facturaId)) return null;

    const facturaIdNum = Number(facturaId);
    return Number.isNaN(facturaIdNum) ? null : facturaIdNum;
  }

  getComprobanteFromDescripcion(descripcion: any) {
    if (!fun.hasValue(descripcion)) return null;
    const [, comprobante] = `${descripcion}`.trim().split(' ');
    return fun.hasValue(comprobante) ? comprobante.trim() : null;
  }

  showFacturasAfectadasSection() {
    return this.documento == 'recibo' || this.documento == 'nota';
  }

  showFacturasCount() {
    return this.documento == 'recibo';
  }

  getFacturasAfectadasSubtitle() {
    if (this.documento == 'recibo') return 'Facturas que recibieron pagos con este recibo';
    if (this.documento == 'nota') return `Facturas afectadas por la ${this.getTipoNotaLabel()}`;
    return 'Facturas afectadas';
  }

  getFacturasAfectadasEmptyMessage() {
    if (this.documento == 'nota') return `No se encontró factura afectada para esta ${this.getTipoNotaLabel()}.`;
    return 'No hay facturas afectadas para este recibo.';
  }

  getTipoNotaLabel() {
    const tipoBase = [this.data?.tipo, this.data?.tipo_factura, this.data?.tipo_pdf, this.data?.descripcion, this.data?.titulo]
      .filter(value => fun.hasValue(value))
      .map(value => fun.normalizarTexto(`${value}`.toLowerCase()))
      .join(' ');

    if (tipoBase.includes('credito')) return 'nota de crédito';
    if (tipoBase.includes('debito')) return 'nota de débito';
    return 'nota';
  }

  async verFacturaAfectada(factura: FacturaAfectada) {
    if (!factura.facturaId) {
      fun.toastError('No se encontró la factura afectada', 'ERROR');
      return;
    }

    try {
      this.facturaLoadingKey = factura.key;
      this.loadServ.isLoading.next(true);

      const facturaPdfData = await this.getFacturaPdfData(factura.facturaId);
      this.prepareModalRestoreState();
      await this.openFacturaAfectadaModal(factura.facturaId, facturaPdfData);
    } catch (error: any) {
      if (!error?.handled) {
        const msg = error?.error?.msg || 'No se pudo obtener la factura afectada';
        fun.toastError(msg, 'ERROR');
      }

      await this.restoreModalsAfterFacturaClose();
    } finally {
      this.facturaLoadingKey = null;
      this.loadServ.isLoading.next(false);
    }
  }

  async getFacturaPdfData(facturaId: number) {
    const res = await this.facturaClass.getFacturaById(facturaId);
    const facturaDb = res?.data ?? res;
    const facturaParsed = await this.facturaClass.parseDataToPdf(facturaDb);

    return { data: facturaParsed, type: this.getFacturaPdfType(facturaDb?.tipo), documento: 'factura' };
  }

  getFacturaPdfType(tipo) {
    if (tipo == tipoDocFacturacion.cotizacion) return 'cotizacion';
    if (tipo == tipoDocFacturacion.pre_venta) return 'pre_venta';
    return 'facturacion';
  }

  prepareModalRestoreState() {
    const sourcePdfModalConfig = this.getSourcePdfModalConfig();
    const restoreSourcePdfModal = sourcePdfModalConfig ? this.closeModalById(sourcePdfModalConfig.id) : false;
    const restoreDetalle = this.closeModalById('detalle_factura');

    if (!restoreSourcePdfModal && !restoreDetalle) {
      this.modalRestoreState = null;
      return;
    }

    this.modalRestoreState = {
      sourceData: fun.deepCloning(this.data),
      documento: this.documento || 'recibo',
      restoreSourcePdfModal,
      restoreDetalle,
      sourcePdfModalConfig,
    };
  }

  getSourcePdfModalConfig(): PdfModalRestoreConfig | null {
    if (this.documento == 'recibo') {
      return {
        id: 'revision_recibo',
        header: 'Revisión de recibo de ingreso',
        width: '57rem',
        height: '40rem',
        show_estado: false,
        pdfType: 'recibo_ingreso',
        documento: 'recibo',
      };
    }

    if (this.documento == 'nota') {
      return {
        id: 'pdfViewer-modal',
        header: 'MOSTRAR NOTA',
        width: '57rem',
        height: '70vh',
        show_estado: true,
        pdfType: 'nota',
        documento: 'nota',
      };
    }

    return null;
  }

  closeModalById(modalId: string): boolean {
    const modalConfig = this.dynamicModalServ.findModalConfigById(modalId, false);
    if (modalConfig?.id) {
      modalConfig.close();
      return true;
    }

    return false;
  }

  openFacturaAfectadaModal(facturaId: number, facturaPdfData) {
    const dataModal = {
      id: `pdfViewer-modal-factura-afectada-${facturaId}-${Date.now()}`,
      header: 'MOSTRAR FACTURA',
      show_estado: true,
      callback: (args: ICallbackModal) => this.handleFacturaAfectadaModalCallback(args),
    };

    return this.facturaClass.handleMostrarFactura(facturaPdfData, dataModal, [{ clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false }]).catch(error => {
      throw { ...error, handled: true };
    });
  }

  async handleFacturaAfectadaModalCallback(args: ICallbackModal) {
    if (args.type != modalCloseType.onHide) return;
    await this.restoreModalsAfterFacturaClose();
  }

  async restoreModalsAfterFacturaClose() {
    const restoreState = this.modalRestoreState;
    this.cleanTemporalState();

    if (!restoreState) return;

    if (restoreState.restoreSourcePdfModal && restoreState.sourcePdfModalConfig) {
      this.loadServ.isLoading.next(true);
      try {
        await this.openSourcePdfModal(restoreState.sourceData, restoreState.sourcePdfModalConfig);
      } catch (error) {
        console.error(error);
      } finally {
        this.loadServ.isLoading.next(false);
      }
    }

    if (restoreState.restoreDetalle) {
      this.facturaClass.modalVerDetalles(restoreState.sourceData, restoreState.documento);
    }
  }

  async openSourcePdfModal(sourceData, sourcePdfModalConfig: PdfModalRestoreConfig) {
    const toPDFData = await this.getSourceToPdfData(sourceData, sourcePdfModalConfig);
    const dataModal = {
      id: sourcePdfModalConfig.id,
      header: sourcePdfModalConfig.header,
      width: sourcePdfModalConfig.width,
      height: sourcePdfModalConfig.height,
      show_estado: sourcePdfModalConfig.show_estado,
    };

    return this.facturaClass.handleMostrarFactura(toPDFData, dataModal, [{ clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false }]);
  }

  async getSourceToPdfData(sourceData, sourcePdfModalConfig: PdfModalRestoreConfig) {
    if (sourcePdfModalConfig.pdfType == 'nota') {
      try {
        const notaParsed = await this.notaClass.parseDataToPdf(sourceData);
        return { data: notaParsed, type: 'nota', documento: sourcePdfModalConfig.documento };
      } catch (error) {
        return { data: sourceData, type: 'nota', documento: sourcePdfModalConfig.documento };
      }
    }

    return { data: sourceData, type: sourcePdfModalConfig.pdfType, documento: sourcePdfModalConfig.documento };
  }

  cleanTemporalState() {
    this.modalRestoreState = null;
  }

  openBrowser() {
    const task = new MessageTask(ELECTRON_OPEN_WEB_BROWSER, { url: this.data.qr_url_dgii });

    this._ipc.sendTask(task).catch(err => {
      if (err.msg) fun.toastError(err.msg, 'ERROR');
      else fun.toastError('Error buscar el estado de la factura', 'ERROR');
      console.error(err);
    });
  }

  getValue(config) {
    let value = fun.getProperty(this.data, config.key);

    if (config.tipo == 'number') value = fun.roundNumberToDecimal(value);
    if (config.tipo == 'date') value = DateUtils.format({ date: value, dateFormat: 'dd/MM/yyyy', include_hour: true, hourFormat: 'hh:mm a', separator: ' ' });

    if (config.transform) value = config.transform(value);
    return value;
  }

  submit() {
    throw new Error('Method not implemented.');
  }
}
