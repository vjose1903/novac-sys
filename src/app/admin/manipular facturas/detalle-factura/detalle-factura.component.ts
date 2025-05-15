import { Component, inject, OnInit } from '@angular/core';
import { ModalI } from '@components/modal/modal-class';
import { fun } from '@core/services/functions.service';
import { serie, TrackStatusEnum } from '@core/typescript/constantes';
import { ModalDetalleFacturaI } from './detalle-factura.model';
import { MessageTask } from '@core/models/message-task';
import { ELECTRON_OPEN_WEB_BROWSER } from '../../../../../electron/shared-electron-angular';
import { IpcService } from '@core/services/ipc.service';

@Component({
  selector: 'app-detalle-factura',
  templateUrl: './detalle-factura.component.html',
  styleUrls: ['./detalle-factura.component.scss'],
  standalone: false,
})
export class DetalleFacturaComponent implements OnInit, ModalI {
  modal: any = {};
  inputs: any;

  TrackStatusEnum = TrackStatusEnum;
  serie = serie;
  fun = fun;
  detalles: ModalDetalleFacturaI[] = [{ label: 'Forma de pago', key: 'forma_pago', tipo: 'string' }];
  _ipc = inject(IpcService);

  constructor() {}

  ngOnInit(): void {
    this.validateElectronicInfoceDetails();
  }

  validateElectronicInfoceDetails() {
    console.log('this.inputs.data ', this.inputs.data);
    if (this.inputs.data?.serie == serie.electronica) {
      const is_aceptada = this.inputs.data.is_aceptada;

      this.detalles.push({
        label: 'Estado Ecf',
        key: 'is_aceptada',
        tipo: 'tag',
        clase_string: is_aceptada == TrackStatusEnum.ACCEPTED ? 'text-success' : is_aceptada == TrackStatusEnum.CONDITIONAL_ACCEPTED ? 'text-warning' : is_aceptada == TrackStatusEnum.REJECTED ? 'text-danger' : 'text-secondary',
        bg_tag: is_aceptada == TrackStatusEnum.ACCEPTED ? '#98ff98' : is_aceptada == TrackStatusEnum.CONDITIONAL_ACCEPTED ? '#ffff98' : is_aceptada == TrackStatusEnum.REJECTED ? '#fb9898' : '#bfbfbf',
      });
    }
  }

  openBrowser() {
    const task = new MessageTask(ELECTRON_OPEN_WEB_BROWSER, { url: this.inputs.data.qr_url_dgii });

    this._ipc.sendTask(task).catch(err => {
      if (err.msg) fun.toastError(err.msg, 'ERROR');
      else fun.toastError('Error buscar el estado de la factura', 'ERROR');
      console.error(err);
    });
  }

  getValue(config) {
    let value = fun.getProperty(this.inputs.data, config.key);

    if (config.tipo == 'number') value = fun.roundNumberToDecimal(value);

    if (config.transform) value = config.transform(value);
    return value;
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
