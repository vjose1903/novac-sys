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
    callback?: CallbackFunction;
    closableClickOutside?: boolean;
    showCancelarBtn?: boolean;
    showReasonInput?: boolean;
  }) {
    params.btnKind = params.btnKind ? params.btnKind : confirmationButtons.cancelarContinuar;
    params.showReasonInput = params.showReasonInput ? params.showReasonInput : false;

    const inputs = { html: params.texto, iconName: params.iconName, iconSize: params.iconSize, iconColor: params.iconColor, showReasonInput: params.showReasonInput, callback: params.callback };

    const config: IModalConfiguration = {
      id: params.id,
      inputs: inputs,
      header: params.header,
      width: params.width || '40vw',
      component: ConfirmationComponent,
      closableClickOutside: params.closableClickOutside,
      botones: [],
    };

    const currentBtnConfig = confirmBtnConfig[params.btnKind];

    ////console.log("currentBtnConfig ", currentBtnConfig);

    if (config.botones) {
      if (params.showCancelarBtn && currentBtnConfig.noBtn)
        config.botones.push({
          id: currentBtnConfig.noBtn.id,
          clase: currentBtnConfig.noBtn.clase,
          action: modalActionsE.close,
          label: currentBtnConfig.noBtn.label,
          disable: false,
          iconName: currentBtnConfig.noBtn.icon,
          iconSize: '20px',
          iconColor: 'white',
          showProcess: currentBtnConfig.noBtn.showProcess,
        });
      if (params.callback || currentBtnConfig.siBtn)
        config.botones.push({
          id: currentBtnConfig.siBtn.id,
          clase: currentBtnConfig.siBtn.clase,
          functionInOtherComponent: 'submit',
          label: currentBtnConfig.siBtn.label,
          disable: false,
          iconName: currentBtnConfig.siBtn.icon,
          iconSize: '20px',
          iconColor: 'white',
          showProcess: currentBtnConfig.siBtn.showProcess,
        });
    }

    const confirmationModal = new DynamicModalClass(config);
    confirmationModal.show();
  }

  closeConfirmModal(params: { id: string; callback?: CallbackFunction; width?: string }) {
    const config = {
      id: params.id,
      width: params.width,
      callback: params.callback,
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
