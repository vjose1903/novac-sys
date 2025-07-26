import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
// import { EFontAwesomeIcon, fontAwesome } from '../../typescript/fontawesome';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { DynamicModalClass } from './config/dynamic-modal.class';
import { IModalConfiguration, CallbackFunction, confirmBtnConfig, confirmationButtons, modalActionsE } from './config/dynamic-modal.interface';

@Injectable({
  providedIn: 'root',
})
export class DynamicModalService {
  modalsConfigurations: Array<DynamicModalClass> = [];

  private modalsConfigurationsSource = new BehaviorSubject<DynamicModalClass | null>(null);
  modalsConfigurations$ = this.modalsConfigurationsSource.asObservable();

  updateModalConfig(modalConfig: DynamicModalClass): void {
    this.modalsConfigurationsSource.next(modalConfig);
  }

  someModalIsOpen(type: 'least_one'): boolean {
    let res = false;
    if (type == 'least_one') res = this.modalsConfigurations.length >= 1;
    return res;
  }

  findModalConfigById(modalId: string, throwError = true): DynamicModalClass {
    const config = this.modalsConfigurations.find((config: DynamicModalClass) => config.id === modalId);

    if (!config && throwError) {
      // throw new Error(`No se encontró ninguna configuración de modal con el ID: ${modalId}`);
    }

    return config ? config : new DynamicModalClass();
  }

  confirmationModal(params: {
    id: string;
    texto: string;
    header: string;
    btnKind?: confirmationButtons;
    width?: string;
    iconName?: string | null;
    iconSize?: string;
    iconColor?: string;
    closableClickOutside?: boolean;
    showCancelarBtn?: boolean;
    showReasonInput?: boolean;
    onNo?: () => void | Promise<void>;
    onYes?: () => void | Promise<void>;
  }) {
    const { id, texto, header, btnKind = confirmationButtons.cancelarContinuar, width = '40vw', iconName, iconSize, iconColor, closableClickOutside, showCancelarBtn, showReasonInput = false, onNo, onYes } = params;

    const inputs = { html: texto, iconName, iconSize, iconColor, showReasonInput, onYes };

    const confirmationModal = new DynamicModalClass();
    confirmationModal.id = id;
    confirmationModal.inputs = inputs;
    confirmationModal.header = header;
    confirmationModal.width = width;
    confirmationModal.component = ConfirmationComponent;
    confirmationModal.closableClickOutside = closableClickOutside;
    confirmationModal.botones = [];

    const currentBtnConfig = confirmBtnConfig[btnKind];

    // Configurar botón de cancelar si es necesario
    if (showCancelarBtn && currentBtnConfig.noBtn) {
      const { noBtn } = currentBtnConfig;
      confirmationModal.botones.push({
        id: noBtn.id,
        clase: noBtn.clase,
        function: async () => {
          if (onNo) await onNo();
          confirmationModal.close();
        },
        label: noBtn.label,
        disable: false,
        iconName: noBtn.icon,
        iconSize: '20px',
        iconColor: 'white',
        showProcess: noBtn.showProcess,
      });
    }

    // Configurar botón de confirmar
    if (currentBtnConfig.siBtn) {
      const { siBtn } = currentBtnConfig;
      confirmationModal.botones.push({
        id: siBtn.id,
        clase: siBtn.clase,
        functionInOtherComponent: 'submit',
        label: siBtn.label,
        disable: false,
        iconName: siBtn.icon,
        iconSize: '20px',
        iconColor: 'white',
        showProcess: siBtn.showProcess,
      });
    }

    confirmationModal.show();
  }

  closeConfirmModal(params: { id: string;  width?: string , onYes?: () => void | Promise<void>, onNo?: () => void | Promise<void>}) {
    const config = {
      id: params.id,
      width: params.width,
      onYes: params.onYes,
      onNo: params.onNo,
      texto: 'Se observa que ha registrado información pero no la ha guardado. Es necesario que guarde la información para que pueda ser almacenada. <strong> ¿Desea Continuar? </strong>',
      header: 'Alerta',
      iconName: 'fa-solid fa-triangle-exclamation',
      iconColor: '#E2A03F',
      closableClickOutside: true,
      showCancelarBtn: true,
      btnKind: confirmationButtons.continuarOSalir,
    };
    
    this.confirmationModal(config);
  }
}
