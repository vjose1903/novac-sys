import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { DynamicModalClass } from './config/dynamic-modal.class';
import { IButtonDynamic, ICallbackModal, IModalConfiguration, modalActionsE, modalCloseType } from './config/dynamic-modal.interface';
import { DynamicModalDirective } from './dynamic-modal.directive';
import { fun } from '@services/functions.service';
import { Ss } from '@services/singleton.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'dynamic-modal',
  templateUrl: './dynamic-modal.component.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule, TooltipModule, DynamicModalDirective],
  styleUrls: ['./dynamic-modal.component.scss'],
})
export class DynamicModalComponent implements OnInit, OnDestroy {
  @ViewChildren(DynamicModalDirective) modalReceptor!: QueryList<DynamicModalDirective>;

  constructor(private sanitizer: DomSanitizer) {}

  subModalConfig!: Subscription;

  get modalsConfig(): DynamicModalClass[] {
    return Ss.dynamicModalService.modalsConfigurations;
  }

  ngOnInit(): void {
    this.subModalConfig = Ss.dynamicModalService.modalsConfigurations$.subscribe((dynamicModal: any) => {
      if (dynamicModal && dynamicModal.visible) {
        this.renderizarComponente(dynamicModal);
      } else {
        if (dynamicModal && dynamicModal.id) this.handleCloseModal(dynamicModal.id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subModalConfig) this.subModalConfig.unsubscribe();
  }

  handleCloseModal(modalId: string, dataToReturn?: ICallbackModal) {
    const modal: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(modalId);
    if (modal) {
      if (dataToReturn && modal.returnData) modal.returnData({ data: dataToReturn, modalId: modalId, type: modalCloseType.returnData });
      if (modal.hideModal) modal.hideModal({ modalId, type: modalCloseType.onHide });

      Ss.dynamicModalService.modalsConfigurations = this.modalsConfig.filter(modalConfig => modalConfig.id != modalId);
    }
  }

  sanitizeHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  confirmToClose(modalId: string, dataToReturn?: ICallbackModal) {
    const modal: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(modalId);

    let showConfirmAlert = true;

    if (modal && modal['componentInstance'] && modal['componentInstance']['showConfirmAlert']) {
      showConfirmAlert = modal['componentInstance']['showConfirmAlert']();
    }

    if (showConfirmAlert && modal.comfirmToClose && modal.id) {
      const confirmationConfig = {
        id: `closeConfirm-${modal.id}`,
        callback: (data: ICallbackModal) => this.handleCloseModal(modal.id || '', dataToReturn),
      };

      Ss.dynamicModalService.closeConfirmModal(confirmationConfig);
    } else {
      this.handleCloseModal(modal.id || '', dataToReturn);
    }
  }

  handleConfig(dynamicModal: DynamicModalClass) {
    if (dynamicModal.id && typeof dynamicModal.id == 'string') {
      const previousModalWithId: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(dynamicModal.id, false);

      if (fun.hasValue(previousModalWithId) && dynamicModal.id == previousModalWithId.id) {
        throw new Error(`Ya existe un modal con el id: ${dynamicModal.id}`);
      } else {
        Ss.dynamicModalService.modalsConfigurations.push(dynamicModal);
      }
    } else {
      throw new Error('Para mostrar un modal debe de especificar el id');
    }
  }

  changeModalConfig(newConfig: IModalConfiguration, modalId: string) {
    const currentModalConfig: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(modalId);

    for (const key in newConfig) {
      if (Object.prototype.hasOwnProperty.call(newConfig, key)) {
        if (key in currentModalConfig) {
          currentModalConfig[key] = newConfig[key];
        }
      }
    }
  }

  searchInArray(array, source, target) {
    return array.find(config => config[source] === target);
  }

  renderizarComponente(config) {
    return new Promise<void>((resolve, reject) => {
      this.handleConfig(config);

      const currentConfig: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(config.id);

      if (!currentConfig.component) {
        resolve();
        return;
      }

      fun.setTimeout(() => {
        const currentReceptor = this.modalReceptor['_results'].find((receptor: any) => receptor.modalReceptorId == config.id);
        if (!currentReceptor) {
          resolve();
          return;
        }

        const viewContainerRef = currentReceptor.viewContainerRef;
        viewContainerRef.clear();
        viewContainerRef.remove();

        // Crear componente usando la nueva API
        const componente = viewContainerRef.createComponent(currentConfig.component);

        // Configurar modalConfig
        this.setComponentInput(componente, 'modalConfig', currentConfig);

        // Pasar inputs si existen
        if (config.inputs) {
          componente.instance.inputs = config.inputs;
          Object.keys(config.inputs).forEach(key => {
            this.setComponentInput(componente, key, config.inputs[key]);
          });
        }

        // Forzar inicialización completa del componente y sus hijos
        this.initializeComponent(componente);

        currentConfig.componentInstance = componente.instance;
        currentConfig.modalWrapper = this;

        resolve();
      }, 1);
    });
  }

  private setComponentInput(componente: any, key: string, value: any): void {
    if (componente.setInput) {
      componente.setInput(key, value);
    } else {
      componente.instance[key] = value;
    }
  }

  private initializeComponent(componente: any): void {
    componente.changeDetectorRef.detectChanges();

    // Segundo ciclo de detección para componentes hijos
    fun.setTimeout(() => {
      componente.changeDetectorRef.detectChanges();
    }, 100);
  }

  changeStateButton(params: { modalId: string; btnId: string; disable: boolean }) {
    const currentModalConfig: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(params.modalId);

    const buttonToChange = currentModalConfig.botones?.find(button => button.id === params.btnId);
    if (buttonToChange) buttonToChange.disable = params.disable;
  }

  getButtonState(btnConfig: IButtonDynamic) {
    let res = false;

    if (btnConfig.disable && fun.objHas(btnConfig, 'disable')) {
      if (typeof btnConfig.disable == 'boolean') return btnConfig.disable;
      res = btnConfig.disable.function();
    }

    return res;
  }

  getButtonTooltip(btnConfig: IButtonDynamic) {
    return fun.objHas(btnConfig, 'tooltip') && btnConfig.tooltip ? btnConfig.tooltip : '';
  }

  async dynamicFunction(modalConfig: DynamicModalClass, buttonConfig: IButtonDynamic) {
    if (modalConfig.id) {
      const modal: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(modalConfig.id);

      if (buttonConfig.action) {
        if (buttonConfig.action === modalActionsE.close) modal.close();
      } else {
        if (modal['componentInstance'] && buttonConfig.functionInOtherComponent && (modal['componentInstance'] as any)[buttonConfig.functionInOtherComponent]) {
          await (modal['componentInstance'] as any)[buttonConfig.functionInOtherComponent]();
        } else {
          if (buttonConfig.function) buttonConfig.function(modal);
        }
      }
    }
  }

  hasAnyBtn(dynamicModal: DynamicModalClass) {
    if (dynamicModal.id) {
      const modal: DynamicModalClass = Ss.dynamicModalService.findModalConfigById(dynamicModal.id);

      return modal?.botones && modal?.botones?.length > 0;
    } else {
      return false;
    }
  }
}
