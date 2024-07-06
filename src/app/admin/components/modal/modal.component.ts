import { Component, OnInit, ComponentFactoryResolver, ViewChildren, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { modalsConfigurations, ModalService } from './modal.service';
import { ModalDirective } from './modal.directive';
import * as _ from 'lodash';
import { fun } from '../../../core/services/functions.service';
import { BtnTypeE, ConfigureModalI, IReturnData } from './modal-class';

@Component({
  selector: 'app-new-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class NewModalComponent implements OnInit, OnDestroy {
  @ViewChildren(ModalDirective) modal_receptor: ModalDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cdRef: ChangeDetectorRef, public mServ: ModalService) {}

  private destroy$ = new Subject<void>();

  defaultModalConfig: ConfigureModalI = {
    show: false,
    component: undefined,
    width: '40rem',
    height: undefined,
    inputs: undefined,
    header: '',
    html: undefined,
    position: 'center',
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
    modalsConfigurations.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res && res.show) {
        this.renderizarComponente(res);
      } else {
        this.resetConfig(res.id, (res as any).accion);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.destroy$) this.destroy$.next();
    if (this.destroy$) this.destroy$.complete();
  }

  resetConfig(id_, accion) {
    const modal = _.find(this.modalsConfig, (config) => config.id === id_);

    const data = { modal: modal, accion: accion };

    if (modal && typeof modal.onHide == 'function') modal.onHide(data);

    this.mServ.modalsConfig = _.remove(this.modalsConfig, (config) => config.id !== id_);
  }

  findModalConfigById(modalId: string): ConfigureModalI {
    const modal: ConfigureModalI = this.mServ.findModalConfigById(modalId);
    return modal;
  }

  closeModal(modalId: string, dataToReturn?: IReturnData) {
    if (dataToReturn) {
      const modal: ConfigureModalI = this.mServ.findModalConfigById(modalId);
      if (fun.hasValue(modal) && fun.hasValue(modal.returnDataFromModal)) modal.returnDataFromModal({ ...dataToReturn, modalId: modalId });
    }
    this.onHideModal(modalId);
    this.mServ.modalsConfig = _.remove(this.modalsConfig, (config) => config.id !== modalId);
  }

  handleConfig(config: ConfigureModalI) {
    const modalConfig = config;
    modalConfig.dismissModal = this.defaultModalConfig.dismissModal;
    this.mServ.modalsConfig.push(modalConfig);
  }

  searchInArray(array, source, target) {
    return _.find(array, (config) => config[source] === target);
  }

  changeModalConfig(array, modalId: string) {
    const modal: ConfigureModalI = this.mServ.findModalConfigById(modalId);

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

        currentConfig['componentInstance'] = componente['instance'];
      }, 1);
    }
  }

  changeStateButton(params: { modalId: string; btnId: string; disable: boolean }) {
    const modal: ConfigureModalI = this.mServ.findModalConfigById(params.modalId);
    const botones = [];

    for (const key in modal.botones) {
      const currentBtnInfo = modal.botones[key];

      if (key == BtnTypeE.dinamico) {
        botones.push(...currentBtnInfo);
      } else {
        botones.push(currentBtnInfo);
      }
    }

    const buttonToChange = botones.find((button) => button.btnId === params.btnId);

    if (buttonToChange) buttonToChange.disable = params.disable;
  }

  buttonIsDisabled(btnConfig) {
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

  onHideModal(modalId: string) {
    const modal: ConfigureModalI = this.mServ.findModalConfigById(modalId);
    if (modal && modal.onHideModal) modal.onHideModal(modal);
  }

  cancelarAndAceptar(bool, modalId, accion?) {
    if (!bool) {
      modalsConfigurations.next({ show: false, id: modalId, accion: accion ? accion : 'cancelar' } as any);
      return;
    }

    const modal: ConfigureModalI = this.mServ.findModalConfigById(modalId);

    if (modal['componentInstance']) {
      modal['componentInstance'].btn_aceptar();
    } else {
      modal.dismissModal(modal.id, { bool: bool, inputs: modal.inputs, modalId: modal.id });
    }
  }

  dynamicFunction(modalId: string, btnConfig) {
    const modal: ConfigureModalI = this.mServ.findModalConfigById(modalId);

    if (fun.objHas(btnConfig, 'functionInOtherComponent')) modal['componentInstance'][btnConfig['functionInOtherComponent']]();
    else btnConfig['function'](modal);
  }

  hasValue(arg) {
    return fun.hasValue(arg);
  }

  hasAnyBtn(modalId: string) {
    const modal: ConfigureModalI = this.mServ.findModalConfigById(modalId);
    const botones_show = modal?.botones?.aceptar?.show || modal?.botones?.cancelar?.show || modal?.botones?.dinamico;
    return botones_show;
  }
}
