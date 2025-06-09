import { Component, OnInit, ComponentFactoryResolver, ViewChildren, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MODALCONFIG, ModalService } from './modal.service';
import { ModalDirective } from './modal.directive';
import * as _ from 'lodash';
import { fun } from '@core/services/functions.service';

@Component({
    selector: 'app-new-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: false
})
export class NewModalComponent implements OnInit, OnDestroy {
  @ViewChildren(ModalDirective) modal_receptor: ModalDirective;
  fun = fun;
  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cdRef: ChangeDetectorRef, public mServ: ModalService) {}

  private destroy$ = new Subject<void>();

  defaultModalConfig: any = {
    show: false,
    component: undefined,
    width: '40rem',
    height: undefined,
    inputs: undefined,
    header: '',
    html: undefined,
    position: 'center',
    instance: undefined,
    closable: true,
    closableEsc: false,
    transitionOptions: '0ms',
    contentStyleClass: '0ms',
    botones: { aceptar: { show: true, disable: false }, cancelar: { show: true, disable: false } },

    returnDataFromModal: (arg?) => {},

    closeModal: (id, accion) => {
      this.cancelarAndAceptar(false, id, accion);
    },
  };

  get modalsConfig() {
    return this.mServ.modalsConfig;
  }

  ngOnInit(): void {
    MODALCONFIG.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res && res.show) {
        this.renderizarComponente(res).then(() =>
          setTimeout(() => {
            fun.enfocarInput(`focusElement-${res.id}`);
          }, 0),
        );
      } else {
        this.resetConfig(res.id, res.accion);
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

  handleConfig(config) {
    const modalConfig = config;
    modalConfig['closeModal'] = this.defaultModalConfig.closeModal;
    this.modalsConfig.push(modalConfig);
  }

  searchInArray(array, source, target) {
    return _.find(array, (config) => config[source] === target);
  }

  changeConfig(array, id_modal) {
    const modal = _.find(this.modalsConfig, (config) => config.id === id_modal);

    array.forEach((element) => {
      const key = _.keys(element)[0];
      modal[key] = element[key];
    });

    this.cdRef.detectChanges();
  }

  renderizarComponente(config) {
    return new Promise<void>((resolve, reject) => {
      this.handleConfig(config);

      const currentConfig = this.searchInArray(this.modalsConfig, 'id', config.id);

      if (currentConfig.component) {
        setTimeout(() => {
          let componentFactory = this.componentFactoryResolver.resolveComponentFactory(currentConfig.component as any);

          const currentReceptor = this.searchInArray(this.modal_receptor['_results'], 'modal_id', config.id);

          let viewContainerRef = currentReceptor.viewContainerRef;

          viewContainerRef.clear();
          viewContainerRef.remove();

          const componente = viewContainerRef.createComponent(componentFactory);

          componente['instance'].inputs = config['inputs'];

          if (componente['instance'].modal) componente['instance'].modal = { instance: this, component_id: config.id };

          currentConfig['instance'] = componente['instance'];

          resolve();
        }, 1);
      }
    });
  }

  checkModalStyle(config) {
    // const currentReceptor = this.searchInArray(this.modal_receptor['_results'], 'modal_id', config.id);
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

  onHideModal(id_) {
    MODALCONFIG.next({ show: false, id: id_ });
  }

  cancelarAndAceptar(bool, id_, accion?) {
    if (!bool) {
      MODALCONFIG.next({ show: false, id: id_, accion: accion ? accion : 'cancelar' });
      return;
    }

    const modal = _.find(this.modalsConfig, (config) => config.id === id_);

    if (modal['instance']) {
      modal['instance'].btn_aceptar();
    } else {
      modal.returnDataFromModal({ bool: bool, inputs: modal.inputs, id: modal.id });
      modal.closeModal(modal.id);
    }
  }

  dynamicFunction(configuration, btn) {
    const modal = _.find(this.modalsConfig, (config) => config.id === configuration.id);
    
    if (fun.objHas(btn, 'function_in_other_component')) modal['instance'][btn['function_in_other_component']]();
    else btn['function'](modal);
  }

  hasValue(arg) {
    return fun.hasValue(arg);
  }

  hasAnyBtn(configuration) {
    const modal = _.find(this.modalsConfig, (config) => config.id === configuration.id);
    const botones_show = modal?.botones?.aceptar?.show || modal?.botones?.cancelar?.show || modal?.botones?.dinamico;
    return botones_show;
  }
}
