import * as moment from '../javascript/moment';
import { ModalClass } from '../../admin/components/new_modal/modal-class';
import { SingletonService } from '../services/singleton.service';
import { fun } from '../services/functions.service';

interface mixinInit {
  component?: String;
  is_routing: boolean;
}

interface fechaFactura {
  FechaFactura?: string;
  FechaFacturaMostrar?: string;
}

export class MixinClass extends ModalClass {
  constructor() {
    super();
  }

  layServ = SingletonService.layServ;
  arg_mixin;

  _init_mixin(arg?: mixinInit) {
    this.arg_mixin = arg;

    this._init_layout(arg);
  }

  _destroy_mixin(algo?) {
    this._destroy_layout();
  }

  // =========================================================================================================
  formarFechaFactura(date): fechaFactura {
    const hora = moment(date).hour();
    const minutos = moment(date).minutes();
    const fechaTemp = moment(date).format('YYYY-MM-DD');
    const obj = {};
    obj['FechaFactura'] = fechaTemp + ' ' + (hora <= 9 ? '0' + hora : hora) + ':' + (minutos <= 9 ? '0' + minutos : minutos);
    obj['FechaFacturaMostrar'] = fun.my_dateFormater(obj['FechaFactura']) + ' - ' + fun.my_houreFormater(obj['FechaFactura']);
    return obj;
  }
  // =========================================================================================================
  my_timeDateFormater(str) {
    return `${fun.my_dateFormater(str)} - ${this.my_houreFormater(str)}`;
  }

  // =========================================================================================================
  my_houreFormater(str) {
    const dateObj = new Date(str);

    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const res = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
    return res;
  }

  // =========================================================================================================
  clickInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    if (element) element.click();
  }
  // =========================================================================================================
  enfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;

    if (element) element.focus();
  }
  // =========================================================================================================
  desEnfocarInput(arg) {
    const element = document.getElementById(arg) as HTMLElement;
    if (element) element.blur();
  }

  // =========================================================================================================
  selectContenido(arg) {
    const element = document.getElementById(arg) as any;
    if (element) element.select();
  }
  // =========================================================================================================
  formatoNumero(num) {
    return fun.formatearNumero(fun.redondearAdos(num)) + '  ';
  }
  // 301,755.67

  // =========================================================================================================
  my_capitalize(str) {
    const ultimoCaracter = str.length + 1;
    return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracter).toLowerCase();
  }

  // =========================================================================================================
  logBlue(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body !== undefined ? fun.duplicarJson(body) : '');
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body !== undefined ? fun.duplicarJson(body) : '');
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body !== undefined ? fun.duplicarJson(body) : '');
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body !== undefined ? fun.duplicarJson(body) : '');
  }

  eliminarRegistro(obj) {
    const noFunction = (instance: any) => {
      console.log('instance ', instance);

      instance.closeModal('borrar', 'cancelar');
    };
    this.handleModalForm({
      id: 'borrar',
      header: 'Confirmar',
      width: '510px',
      html: `<p> ${obj?.texto} </p>`,
      botones: {
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => noFunction(instance), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => {
              obj.siFunction();
              instance.closeModal('borrar', 'cancelar');
            },
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }
}
