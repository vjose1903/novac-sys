import { fun } from './../../../core/services/functions.service';
import * as _ from 'lodash';
import { LayoutClass } from '../../layout/layout';
import { modalsConfigurations } from './modal.service';

export interface ModalComponentI {
  id?: any;
  modalsConfig?: Array<ConfigureModalI>;
  findModalConfigById?: (modalId: any) => ConfigureModalI;
  closeModal?: (modalId: any, dataToReturn?: IReturnData) => void;
  changeModalConfig?: (changes: Array<ConfigureModalI>, modalId: any) => void;
  changeStateButton?: (params: { modalId: string; btnId: string; disable: boolean }) => void;
  getButtonTooltip?: (btnConfig: IModalButton) => string;
  hasAnyBtn?: (modalId: any) => boolean;
  [prop: string]: any;
}

export interface ModalI {
  modalComponent: ModalComponentI;
  inputs: any;
  btn_aceptar(): any;
  [prop: string]: any;
}

export interface ConfigureModalI {
  id?: string;
  show?: boolean;
  header?: string;
  inputs?: any;
  component?: any;
  width?: string;
  height?: string;
  botones?: ButtonsObjI;
  closable?: boolean;
  closableEsc?: boolean;
  html?: any;
  position?: string;
  transitionOptions?: string;
  contentStyleClass?: string;
  returnDataFromModal?: (args: IReturnData) => void;
  dismissModal?: (id: string, dataToReturn?: IReturnData) => void;
  onHideModal?: (dataToReturn: IReturnData) => void;
}

export interface IReturnData {
  data?: any;
  inputs?: any;
  modalId?: string;
  extra?: object;
  bool?: boolean;
  [prop: string]: any;
}

export interface btnDisabled {
  function?: Function;
}
export interface ButtonsObjI {
  aceptar: IModalButton;
  cancelar: IModalButton;
  dinamico?: Array<IModalButton>;
}
export interface IModalButton {
  btnId?: string;
  show?: boolean;
  clase?: string;
  label?: string;
  function?: Function;
  functionInOtherComponent?: string;
  disable?: boolean | btnDisabled;
  tooltip?: string;
}

export enum BtnTypeE {
  aceptar = 'aceptar',
  cancelar = 'cancelar',
  dinamico = 'dinamico',
}
export class ModalClass extends LayoutClass {
  static noShowAceptarCancelarButtons: ButtonsObjI = { aceptar: { show: false }, cancelar: { show: false } };

  constructor() {
    super();
  }

  openNewModal(params: ConfigureModalI) {
    const modal_configuration = {};
    modal_configuration['show'] = true;
    modal_configuration['component'] = fun.objHas(params, 'component') ? params.component : undefined;
    modal_configuration['width'] = fun.objHas(params, 'width') ? params.width : '50rem';
    modal_configuration['height'] = fun.objHas(params, 'height') ? params.height : undefined;
    modal_configuration['inputs'] = fun.objHas(params, 'inputs') ? params.inputs : undefined;
    modal_configuration['header'] = fun.objHas(params, 'header') ? params.header : undefined;
    modal_configuration['position'] = fun.objHas(params, 'position') ? params.position : 'center';
    modal_configuration['botones'] = fun.objHas(params, 'botones') ? params.botones : { aceptar: { show: true, disable: false }, cancelar: { show: true, disable: false } };
    modal_configuration['closable'] = fun.objHas(params, 'closable') ? params.closable : true;
    modal_configuration['closableEsc'] = fun.objHas(params, 'closableEsc') ? params.closableEsc : false;
    modal_configuration['transitionOptions'] = fun.objHas(params, 'transitionOptions') ? params.transitionOptions : '0ms';
    modal_configuration['contentStyleClass'] = fun.objHas(params, 'contentStyleClass') ? params.contentStyleClass : '';
    modal_configuration['returnDataFromModal'] = fun.objHas(params, 'returnDataFromModal') ? (arg) => params.returnDataFromModal(arg) : (arg) => this.getDataFromModal(arg, ' ');

    modal_configuration['onHide'] = (arg) => {
      if (fun.hasValue(this) && fun.objHas(this, 'onHideModal')) this.onHideModal(arg);
    };

    modal_configuration['html'] = fun.objHas(params, 'html') ? params.html : null;
    modal_configuration['id'] = params.id ?? fun.generateKey();
    this.verificateBottons(modal_configuration);

    modalsConfigurations.next(modal_configuration);
  }

  verificateBottons(config: ConfigureModalI) {
    const verificateId = (boton: IModalButton) => (boton.btnId ??= fun.generateKey());

    if (config.botones) {
      for (const key in config.botones) {
        const btnObj = config.botones[key];

        if (Array.isArray(btnObj)) {
          btnObj.forEach((btn) => verificateId(btn));
        } else {
          verificateId(btnObj);
        }
      }
    }
  }

  getDataFromModal(arg, search?) {}
  onHideModal(arg) {}

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string; noFunction?: Function; cancelarFunction?: Function }) {
    const config: ConfigureModalI = {
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco', function: (instance) => (fun.objHas(obj, 'noFunction') ? obj?.noFunction(instance) : this.dismissModal(instance)), label: 'No', disable: false },
          { clase: 'btn btn-verde', function: (instance) => obj.siFunction(instance), label: 'Si', disable: false },
        ],
      },
    };

    if (fun.objHas(obj, 'cancelarFunction') && fun.hasValue(obj.cancelarFunction)) {
      fun.pushAt(config.botones.dinamico, 0, { clase: 'btn btn-blanco', function: (instance) => obj.cancelarFunction(instance), label: 'Cancelar', disable: false });
    }

    this.openNewModal(config);
  }

  dismissModal(modalInstance: ConfigureModalI) {
    if (modalInstance.dismissModal && modalInstance.id) modalInstance.dismissModal(modalInstance.id);
  }
}
