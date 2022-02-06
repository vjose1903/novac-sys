import * as _ from 'lodash';
import { SingletonService } from '../../../core/services/singleton.service';
import { MODALCONFIG } from './modal.service';

export class ModalClass {
  constructor() {}

  modalServ = SingletonService.mServ;

  handleModalForm(params: {
    id: string;
    header?: string;
    inputs?: any;
    component?: any;
    width?: string;
    height?: string;
    botones?: any;
    closable?: boolean;
    closableEsc?: boolean;
    html?: any;
    position?: string;
    transitionOptions?: string;
    contentStyleClass?: string;
  }) {
    const modal_configuration = {};
    modal_configuration['show'] = true;

    modal_configuration['show'] = true;
    modal_configuration['component'] = _.has(params, 'component') ? params.component : undefined;
    modal_configuration['width'] = _.has(params, 'width') ? params.width : '50rem';
    modal_configuration['height'] = _.has(params, 'height') ? params.height : undefined;
    modal_configuration['inputs'] = _.has(params, 'inputs') ? params.inputs : undefined;
    modal_configuration['header'] = _.has(params, 'header') ? params.header : undefined;
    modal_configuration['position'] = _.has(params, 'position') ? params.position : 'center';
    modal_configuration['botones'] = _.has(params, 'botones') ? params.botones : { aceptar: { show: true, diable: false }, cancelar: { show: true, diable: false } };
    modal_configuration['closable'] = _.has(params, 'closable') ? params.closable : true;
    modal_configuration['closableEsc'] = _.has(params, 'closableEsc') ? params.closableEsc : false;
    modal_configuration['transitionOptions'] = _.has(params, 'transitionOptions') ? params.transitionOptions : '0ms';
    modal_configuration['contentStyleClass'] = _.has(params, 'contentStyleClass') ? params.contentStyleClass : '';
    modal_configuration['getDataModal'] = (arg) => this.getDataFromModal(arg, ' ');
    modal_configuration['onHide'] = (arg) => this.onHideModal(arg);
    modal_configuration['html'] = _.has(params, 'html') ? params.html : null;
    modal_configuration['id'] = params.id;

    MODALCONFIG.next(modal_configuration);
  }

  getDataFromModal(arg, search) {}
  onHideModal(arg) {}
}
