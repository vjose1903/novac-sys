import { fun } from './../../../core/services/functions.service';
import * as _ from 'lodash';
import { LayoutClass } from '../../layout/layout';
import { MODALCONFIG } from './modal.service';

export interface ModalI {
  modal: any;
  inputs: any;
  btn_aceptar(): any;
}

export interface ConfigureModalI {
  id?: string;
  header?: string;
  inputs?: any;
  component?: any;
  width?: string;
  height?: string;
  botones?: ButtonsI;
  closable?: boolean;
  closableEsc?: boolean;
  html?: any;
  position?: string;
  transitionOptions?: string;
  contentStyleClass?: string;
  returnDataFromModal?: Function;
}

export interface btnDisabled {
  function?: Function;
}
export interface ButtonsI {
  aceptar: { show: boolean; disable?: boolean | btnDisabled; tooltip?: string; btn_id?: string };
  cancelar: { show: boolean; disable?: boolean | btnDisabled; tooltip?: string; btn_id?: string };
  dinamico?: Array<{ btn_id?: string; clase: string; label: string; function?: Function; function_in_other_component?: string; disable: boolean | btnDisabled; tooltip?: string }>;
}

export class ModalClass extends LayoutClass {
  static noShowAceptarCancelarButtons: ButtonsI = { aceptar: { show: false }, cancelar: { show: false } };

  constructor() {
    super();
  }

  openNewModal(params: ConfigureModalI) {
    const modal_configuration = {};
    modal_configuration['show'] = true;

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
    modal_configuration['id'] = params?.id;

    MODALCONFIG.next(modal_configuration);
  }

  getDataFromModal(arg, search?) {}
  onHideModal(arg) {}

  // confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string }) {
  //   this.openNewModal({
  //     id: obj.id,
  //     header: obj.header,
  //     width: obj.width || '30rem',
  //     html: `<p> ${obj.texto} </p>`,
  //     botones: {
  //       ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
  //       dinamico: [
  //         { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, obj.id), label: 'NO', disable: false },
  //         {
  //           clase: 'btn btn-verde',
  //           function: (instance) => obj.siFunction(instance),
  //           label: 'SI',
  //           disable: false,
  //         },
  //       ],
  //     },
  //   });
  // }

  confirmationModal(obj: { id: string; texto: string; header: string; siFunction: Function; width?: string; noFunction?: Function; cancelarFunction?: Function }) {
    const config = {
      id: obj.id,
      header: obj.header,
      width: obj.width || '30rem',
      html: `<p> ${obj.texto} </p>`,
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => (fun.objHas(obj, 'noFunction') ? obj?.noFunction(instance) : this.closeModal(instance)), label: 'No', disable: false },
          { clase: 'btn btn-verde', function: (instance) => obj.siFunction(instance), label: 'Si', disable: false },
        ],
      },
    };

    if (fun.objHas(obj, 'cancelarFunction') && fun.hasValue(obj.cancelarFunction)) {
      fun.pushAt(config.botones.dinamico, 0, { clase: 'btn btn-blanco mr-2', function: (instance) => obj.cancelarFunction(instance), label: 'Cancelar', disable: false });
    }

    this.openNewModal(config);
  }

  closeModal(modalInstance) {
    modalInstance.closeModal(modalInstance.id, 'cancelar');
  }
}
