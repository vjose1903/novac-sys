import { Injectable } from '@angular/core';
import { confirmationButtons } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { fun } from '@core/services/functions.service';

type FacturacionArchiveFlowContext = {
  factura_guardada: any;
  objArchivo: any;
  rellenando_factura_archivada: boolean;
  showDeactivationModal: {
    set(value: boolean): void;
  };
  dynamicModalServ: any;
  archiveCompareServ: {
    isSameArchivedFactura(currentFactura: any, archivedFactura: any): boolean;
  };
  archiveStorageServ: {
    exists(archivoId: any): boolean;
  };
  getDocumentoDescripcion(): any;
  getSideBarTabByKey(key: any): any;
  checkIfFacturacionEnProceso(): boolean;
  verificateArchivo(): Promise<any>;
  agregarFacturaALocalStorage(): void;
  cancelarFactura(args: { showConfirmationModal: boolean; goToFinder: boolean }): void;
  procesoRelleno(factura: any): Promise<void>;
  actualizarLayServFactGuardada(factura: any): void;
};

@Injectable({
  providedIn: 'root',
})
export class FacturacionArchiveFlowService {
  fillArchivedFactura(ctx: FacturacionArchiveFlowContext, factura: any): void {
    if (!fun.hasValue(factura)) return;

    if (ctx.factura_guardada?.archivo_id == factura.archivo_id) {
      fun.toastWarning(`Ya esta ${ctx.getSideBarTabByKey(ctx.factura_guardada.tipo)['singleTitle']} esta seleccionada.`, 'AVISO');
      return;
    }

    this.checkSituaciones(ctx, { goOut: false }).then(result => {
      if (!result.factura_en_proceso) {
        this.refillArchivedFactura(ctx, factura);
        return;
      }

      if (!result.abrirModal) {
        this.refillArchivedFactura(ctx, factura);
        return;
      }

      ctx.dynamicModalServ.confirmationModal({
        id: 'archivar_factura',
        texto: result.texto_modal,
        btnKind: confirmationButtons.siNoCancelar,
        onYes: () => {
          ctx.agregarFacturaALocalStorage();
          this.refillArchivedFactura(ctx, factura);
        },
        onNo: () => this.refillArchivedFactura(ctx, factura),
      });
    });
  }

  refillArchivedFactura(ctx: FacturacionArchiveFlowContext, factura: any): Promise<void> {
    ctx.rellenando_factura_archivada = true;
    ctx.showDeactivationModal.set(false);

    return ctx.procesoRelleno(factura).then(
      () => {
        ctx.actualizarLayServFactGuardada(factura);
        ctx.rellenando_factura_archivada = false;
        ctx.showDeactivationModal.set(true);
      },
      error => {
        ctx.rellenando_factura_archivada = false;
        ctx.showDeactivationModal.set(true);
        throw error;
      }
    );
  }

  checkSituaciones(ctx: FacturacionArchiveFlowContext, args: { goOut: boolean }): Promise<{ factura_en_proceso: boolean; abrirModal?: boolean; texto_modal?: string; archivo_id?: any }> {
    const { goOut } = args;

    return new Promise(resolve => {
      const documento = ctx.getDocumentoDescripcion();

      ctx.verificateArchivo().then(() => {
        if (!ctx.checkIfFacturacionEnProceso()) {
          resolve({ factura_en_proceso: false });
          return;
        }

        let textoModal = '';
        let abrirModal = true;

        if (ctx.factura_guardada?.archivo_id) {
          if (ctx.archiveCompareServ.isSameArchivedFactura(ctx.objArchivo.factura_en_turno, ctx.objArchivo.factura_en_turno_storage)) {
            fun.toastWarning(`La ${documento.descripcion} que estaba realizando esta archivada para poder utilizarla luego.`, 'AVISO');
            abrirModal = false;
          } else {
            textoModal = `La <strong>${documento.descripcion}</strong> que esta en proceso ya se encuentra archivada <strong>¿desea sobreescribirla?</strong>`;
          }
        } else if (goOut) {
          textoModal = `Estas a punto de salir del modulo de facturación, <strong> ¿desea guardar la ${documento.descripcion} que esta en proceso, para continuarla luego?</strong>`;
        } else {
          textoModal = `¿Desea guardar la <strong> ${documento.descripcion}</strong> que esta en proceso, para continuarla luego?`;
        }

        resolve({ factura_en_proceso: true, abrirModal, texto_modal: textoModal });
      });
    });
  }

  archiveCurrentFactura(ctx: FacturacionArchiveFlowContext): void {
    const documento = ctx.getDocumentoDescripcion();

    if (!ctx.checkIfFacturacionEnProceso()) {
      fun.toastWarning(`Debe de iniciar una ${documento.descripcion} para archivarla.`, 'AVISO');
      return;
    }

    ctx.verificateArchivo().then(() => {
      const isGuardada = ctx.factura_guardada?.archivo_id ? ctx.archiveStorageServ.exists(ctx.factura_guardada?.archivo_id) : false;
      const textoModal = isGuardada ? `Esta <strong>${documento.descripcion}</strong> ya esta archivada ¿desea sobreescribirla?` : `¿Seguro que desea archivar esta <strong>${documento.descripcion}</strong> para continuarla luego?`;

      ctx.dynamicModalServ.confirmationModal({
        id: 'archivar_factura',
        texto: textoModal,
        btnKind: confirmationButtons.siNo,
        onYes: () => this.processArchiveCurrentFactura(ctx),
      });
    });
  }

  private processArchiveCurrentFactura(ctx: FacturacionArchiveFlowContext): void {
    ctx.agregarFacturaALocalStorage();
    ctx.cancelarFactura({ showConfirmationModal: false, goToFinder: false });
  }
}
