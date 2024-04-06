import * as moment from '../javascript/moment';
import { ModalClass } from '../../admin/components/modal/modal-class';
import { Ss } from '../services/singleton.service';
import { fun } from '../services/functions.service';
import { DateUtils } from './date.utils';

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

  layServ = Ss.layServ;
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
    const obj = {};
    obj['FechaFactura'] = DateUtils.format({ date: date, dateFormat: 'YYYY-MM-DD', separator: ' ', include_hour: true, hourFormat: 'hh:mm' });
    obj['FechaFacturaMostrar'] = DateUtils.format({ date: date, include_hour: true });
    return obj;
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
  formatoNumero(num) {
    return fun.roundNumberToDecimal(num);
  }
  // 301,755.67

  // =========================================================================================================
  my_capitalize(str) {
    const ultimoCaracter = str.length + 1;
    return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracter).toLowerCase();
  }

  // =========================================================================================================
  logBlue(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #5580da', body !== undefined ? fun.deepCloning(body) : '');
  }

  logYellow(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #dada55', body !== undefined ? fun.deepCloning(body) : '');
  }

  logRed(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #da555f', body !== undefined ? fun.deepCloning(body) : '');
  }

  logGreen(text: any, body?) {
    console.log(`%c ${text}`, 'background: #00000000; color: #55da56', body !== undefined ? fun.deepCloning(body) : '');
  }

  eliminarRegistro(obj) {
    const noFunction = (instance: any) => {
      instance.dismissModal(instance.id);
    };
    this.openNewModal({
      id: 'borrar',
      header: 'Confirmar',
      width: '510px',
      html: `<p> ${obj?.texto} </p>`,
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [
          { clase: 'btn btn-blanco mr-2', function: (instance) => noFunction(instance), label: 'NO', disable: false },
          {
            clase: 'btn btn-verde',
            function: (instance) => {
              obj.siFunction();
              instance.dismissModal(instance.id);
            },
            label: 'SI',
            disable: false,
          },
        ],
      },
    });
  }
}
