import { Component, OnInit, ViewChildren, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MODALCONFIG, ModalService } from './modal.service';
import { ModalDirective } from './modal.directive';
import * as _ from 'lodash';
import { fun } from '@core/services/functions.service';
import { Ss } from '@core/services/singleton.service';

@Component({
  selector: 'app-new-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: false,
})
export class NewModalComponent implements OnInit, OnDestroy {
  @ViewChildren(ModalDirective) modal_receptor: ModalDirective;
  fun = fun;
  constructor(
    private cdRef: ChangeDetectorRef,
    public mServ: ModalService
  ) {}

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
    MODALCONFIG.pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res && res.show) {
        this.renderizarComponente(res).then(() =>
          fun.setTimeout(() => {
            fun.enfocarInput(`focusElement-${res.id}`);
          }, 0)
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
    const modal = _.find(this.modalsConfig, config => config.id === id_);

    const data = { modal: modal, accion: accion };

    if (modal && typeof modal.onHide == 'function') modal.onHide(data);

    this.mServ.modalsConfig = _.remove(this.modalsConfig, config => config.id !== id_);
  }

  handleConfig(config) {
    const modalConfig = config;
    modalConfig['closeModal'] = this.defaultModalConfig.closeModal;
    this.modalsConfig.push(modalConfig);
  }

  searchInArray(array, source, target) {
    return array.find(config => config[source] === target);
  }

  changeConfig(array, id_modal) {
    const modal = this.modalsConfig.find(config => config.id === id_modal);

    array.forEach(element => {
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
        fun.setTimeout(() => {
          const currentReceptor = this.searchInArray(this.modal_receptor['_results'], 'modal_id', config.id);
          let viewContainerRef = currentReceptor.viewContainerRef;

          viewContainerRef.clear();
          viewContainerRef.remove();

          // Crear componente usando la nueva API
          const componente = viewContainerRef.createComponent(currentConfig.component);

          // Configurar modalWrapper si existe la propiedad
          if (componente.instance.modalWrapper !== undefined) {
            if (componente.setInput) {
              componente.setInput('modalWrapper', { instance: this, component_id: config.id });
            } else {
              componente.instance.modalWrapper = { instance: this, component_id: config.id };
            }
          }

          // Pasar inputs usando ambos métodos para máxima compatibilidad
          if (config.inputs) {
            // Método 1: Asignar directamente a la instancia
            componente.instance.inputs = config.inputs;

            // Método 2: Usar setInput para @Input() individuales
            Object.keys(config.inputs).forEach(key => {
              if (componente.setInput) {
                componente.setInput(key, config.inputs[key]);
              } else {
                componente.instance[key] = config.inputs[key];
              }
            });
          }

          // Forzar inicialización completa del componente y sus hijos
          componente.changeDetectorRef.detectChanges();

          // Segundo ciclo de detección para componentes hijos
          fun.setTimeout(() => {
            componente.changeDetectorRef.detectChanges();
          }, 100);

          currentConfig['instance'] = componente.instance;

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

    const modal = this.modalsConfig.find(config => config.id === id_);

    if (modal['instance']) {
      modal['instance'].btn_aceptar();
    } else {
      modal.returnDataFromModal({ bool: bool, inputs: modal.inputs, id: modal.id });
      modal.closeModal(modal.id);
    }
  }

  dynamicFunction(configuration, btn) {
    const modal = this.modalsConfig.find(config => config.id === configuration.id);

    if (fun.objHas(btn, 'function_in_other_component')) modal['instance'][btn['function_in_other_component']]();
    else btn['function'](modal);
  }

  hasValue(arg) {
    return fun.hasValue(arg);
  }

  hasAnyBtn(configuration) {
    const modal = this.modalsConfig.find(config => config.id === configuration.id);
    const botones_show = modal?.botones?.aceptar?.show || modal?.botones?.cancelar?.show || modal?.botones?.dinamico;
    return botones_show;
  }
}
