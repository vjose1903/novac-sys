import { Component, OnInit, ComponentFactoryResolver, ViewChildren, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { modalsConfigurations, ModalService } from './modal.service';
import { ModalDirective } from './modal.directive';
import * as _ from 'lodash';
import { fun } from '../../../core/services/functions.service';
import { IModalConfiguration, IReturnData } from './modal-class';

@Component({
  selector: 'app-new-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class NewModalComponent implements OnInit, OnDestroy {
  @ViewChildren(ModalDirective) modal_receptor: ModalDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cdRef: ChangeDetectorRef, public mServ: ModalService) {}

  subConfig: Subscription;

  defaultModalConfig: IModalConfiguration = {
    show: false,
    component: undefined,
    width: '40rem',
    height: undefined,
    inputs: undefined,
    header: '',
    html: undefined,
    position: 'center',
    componentInstance: undefined,
    closable: true,
    closableEsc: false,
    transitionOptions: '0ms',
    contentStyleClass: '0ms',
    botones: { aceptar: { show: true, disable: false }, cancelar: { show: true, disable: false } },
    returnDataFromModal: (arg?) => {},

    dismissModal: (modalId: string, dataToReturn?: IReturnData) => {
      this.closeModal(modalId, dataToReturn);
    },
  };

  get modalsConfig() {
    return this.mServ.modalsConfig;
  }

  ngOnInit(): void {
    this.subConfig = modalsConfigurations.subscribe((res) => {
      if (res && res.show) {
        this.renderizarComponente(res);
      } else {
        this.closeModal(res.id);
      }
    });
  }

  ngOnDestroy(): void {
    if(this.subConfig) this.subConfig.unsubscribe();
  }

  findModalConfigById(modalId): IModalConfiguration {
    const modal: IModalConfiguration = this.mServ.findModalConfigById(modalId);
    return modal;
  }

  closeModal(modalId, dataToReturn?: IReturnData) {
    this.onHideModal(modalId);

    if (dataToReturn) {
      const modal: IModalConfiguration = this.mServ.findModalConfigById(modalId);
      if (fun.hasValue(modal) && fun.hasValue(modal.returnDataFromModal)) modal.returnDataFromModal(dataToReturn);
    }
    this.mServ.modalsConfig = _.remove(this.modalsConfig, (config) => config.id !== modalId);
  }

  handleConfig(config: IModalConfiguration) {
    const modalConfig = config;
    modalConfig.dismissModal = this.defaultModalConfig.dismissModal;
    this.mServ.modalsConfig.push(modalConfig);
  }

  searchInArray(array, source, target) {
    return _.find(array, (config) => config[source] === target);
  }

  changeModalConfig(array, modalId) {
    const modal = _.find(this.modalsConfig, (config) => config.id === modalId);

    array.forEach((element) => {
      const key = _.keys(element)[0];
      modal[key] = element[key];
    });

    this.cdRef.detectChanges();
  }

  renderizarComponente(config) {
    this.handleConfig(config);

    const currentConfig = this.searchInArray(this.modalsConfig, 'id', config.id);

    if (currentConfig.component) {
      setTimeout(() => {
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(currentConfig.component as any);

        const currentReceptor = this.searchInArray(this.modal_receptor['_results'], 'modalId', config.id);

        let viewContainerRef = currentReceptor.viewContainerRef;

        viewContainerRef.clear();
        viewContainerRef.remove();

        const componente = viewContainerRef.createComponent(componentFactory);

        componente['instance'].inputs = config.inputs;

        componente['instance'].modalComponent = this;
        componente['instance'].modalComponent.id = config.id;

        currentConfig.componentInstance = componente['instance'];
      }, 1);
    }
  }

  disabledButton(btnConfig) {
    let res = false;

    if (fun.objHas(btnConfig, 'disable')) {
      if (typeof btnConfig.disable == 'boolean') return btnConfig.disable;
      res = btnConfig.disable['function']();
    }

    return res;
  }

  getButtonTooltip(btnConfig) {
    return fun.objHas(btnConfig, 'tooltip') && fun.hasValue(btnConfig.tooltip) ? btnConfig.tooltip : '';
  }

  onHideModal(modalId) {
    const modal: IModalConfiguration = _.find(this.modalsConfig, (config) => config.id === modalId);
    if (modal) modal.onHideModal(modal);
  }

  cancelarOrAceptar(id_, reason: 'aceptar' | 'cancelar') {
    if (reason == 'cancelar') {
      modalsConfigurations.next({ show: false, id: id_ });
      return;
    }

    const modal: IModalConfiguration = _.find(this.modalsConfig, (config) => config.id === id_);

    if (modal.componentInstance && modal?.componentInstance?.btn_aceptar) {
      modal.componentInstance.btn_aceptar();
    } else {
      const bool = reason == 'aceptar';
      modal.dismissModal(modal.id, { bool: bool, inputs: modal.inputs, modalId: modal.id });
    }
  }

  dynamicFunction(modalId, btnConfig) {
    const modal: IModalConfiguration = this.mServ.findModalConfigById(modalId);

    if (fun.objHas(btnConfig, 'functioInOtherComponent')) modal['componentInstance'][btnConfig['functioInOtherComponent']]();
    else btnConfig['function'](modal);
  }

  hasValue(arg) {
    return fun.hasValue(arg);
  }

  hasAnyBtn(modalId: any) {
    const modal: IModalConfiguration = this.mServ.findModalConfigById(modalId);
    const botones_show = modal?.botones?.aceptar?.show || modal?.botones?.cancelar?.show || modal?.botones?.dinamico;
    return botones_show;
  }
}
