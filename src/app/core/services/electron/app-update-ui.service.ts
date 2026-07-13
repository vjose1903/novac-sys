import { Injectable, NgZone, inject, signal } from '@angular/core';
import { DynamicModalClass } from '@components/dynamic-modal/config/dynamic-modal.class';
import { modalActionsE } from '@components/dynamic-modal/config/dynamic-modal.interface';
import { DesktopUpdateProgress, DesktopUpdateState } from '@electron/shared-electron-angular';
import { Environment } from '@environments/environment';
import { fun } from '@services/functions.service';
import { IpcService } from '@services/ipc.service';

interface UpdateProgressView {
  transferred: number;
  total: number;
  percent: number;
  bytesPerSecond: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppUpdateUiService {
  private readonly ipc = inject(IpcService);
  private readonly zone = inject(NgZone);
  private lastHandledAvailableVersion: string | null = null;
  private progressEvents = 0;
  private initialized = false;

  readonly visible = signal(false);
  readonly progress = signal<UpdateProgressView | null>(null);
  readonly isDevelopment = !Environment.production;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.ipc.updateState$.subscribe(state => this.handleUpdateState(state));
  }

  setVisible(visible: boolean): void {
    this.visible.set(visible);
  }

  private handleUpdateState(state: DesktopUpdateState): void {
    this.zone.run(() => {
      switch (state.status) {
        case 'checking':
          this.resetProgress();
          break;
        case 'available':
          this.resetProgress();
          this.visible.set(false);
          if (state.source === 'manual') break;
          if (state.updateInfo?.version && this.lastHandledAvailableVersion !== state.updateInfo.version) {
            this.lastHandledAvailableVersion = state.updateInfo.version;
            this.showAvailableUpdateModal(state.updateInfo);
          }
          break;
        case 'downloading':
          if (!state.progress) this.resetProgress();
          this.visible.set(true);
          if (state.progress) this.updateDownloadProgress(state.progress);
          break;
        case 'downloaded':
        case 'installing':
          this.visible.set(true);
          break;
        case 'not-available':
          this.resetProgress();
          this.visible.set(false);
          break;
        case 'error':
          this.resetProgress();
          this.visible.set(false);
          fun.toastError(state.error?.message || state.message || 'Error en la actualización', 'ERROR');
          break;
      }
    });
  }

  private showAvailableUpdateModal(info: any): void {
    const updateModalConf = new DynamicModalClass();

    updateModalConf.id = 'actualizar_app';
    updateModalConf.width = '40rem';
    updateModalConf.header = 'ACTUALIZACIÓN DISPONIBLE';
    updateModalConf.html = `
      <div class="d-flex align-items-center gap-3 p-3 bg-body-tertiary rounded-3">
        <div class="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-primary-subtle text-primary" style="width: 3rem; height: 3rem">
          <i class="pi pi-download" aria-hidden="true"></i>
        </div>
        <div>
          <h5 class="mb-1 text-secondary">Nueva versión disponible</h5>
          <p class="mb-2 text-body-secondary">Hay una actualización de Novac System lista para descargar e instalar.</p>
          <span class="d-inline-flex align-items-center px-3 py-1 rounded-pill bg-primary-subtle text-primary border border-primary-subtle" style="font-size: 0.8rem; font-weight: 500">
            <span>Versión disponible: <strong>${info.version}</strong></span>
          </span>
        </div>
      </div>
    `;
    updateModalConf.closable = true;
    updateModalConf.closableEsc = true;
    updateModalConf.botones = [
      { id: 'cancelUpdateBtn', clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
      { id: 'updateBtn', clase: 'btn btn-verde', label: 'Actualizar', disable: false, function: instance => this.startUpdateDownload(instance, updateModalConf), showProcess: true },
    ];
    updateModalConf.disableAllButtonsIfAnyProcessing = true;
    updateModalConf.show();
  }

  private startUpdateDownload(modalInstance: DynamicModalClass, updateModalConf: DynamicModalClass): void {
    const updateBtn = updateModalConf.botones.find(btn => btn.id === 'updateBtn');

    this.ipc
      .downloadUpdate()
      .then(res => {
        fun.setTimeout(() => {
          if (res.started) {
            modalInstance.close();
            this.visible.set(true);
          } else {
            fun.toastInfo(res.message, 'INFORMACIÓN');
          }

          if (updateBtn) updateBtn.processing = false;
        }, 0);
      })
      .catch(error => {
        if (updateBtn) updateBtn.processing = false;
        fun.toastError(error?.message || 'No se pudo iniciar la descarga de la actualización', 'ERROR');
      });
  }

  private updateDownloadProgress(progress: DesktopUpdateProgress): void {
    if (this.progressEvents === 0) this.visible.set(true);
    this.progressEvents += 1;

    this.progress.set({
      ...progress,
      transferred: parseFloat(fun.roundNumberToDecimal(progress.transferred / 1000000)),
      total: parseFloat(fun.roundNumberToDecimal(progress.total / 1000000)),
      percent: parseFloat(fun.roundNumberToDecimal(progress.percent)),
    });
  }

  private resetProgress(): void {
    this.progressEvents = 0;
    this.progress.set(null);
  }
}
