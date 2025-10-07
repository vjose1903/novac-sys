import { Ss } from './singleton.service';
import { Injectable } from '@angular/core';
import { fun } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  static noShowMsgs = { key: 'msgs', value: 'no_show' };

  constructor() {}

  // =====================================================================
  // TOASTS
  // =====================================================================

  static toastInfo(msg?, titulo = 'INFORMACION') {
    if (Ss.sharedServ.canToast) {
      fun.setTimeout(() => {
        Ss.toastr.info(msg || '', titulo || '', { enableHtml: true });
      }, 0);
    }
  }

  static toastSuccess(msg?, titulo = 'CORRECTO') {
    if (Ss.sharedServ.canToast) {
      fun.setTimeout(() => {
        Ss.toastr.success(msg || '', titulo || '', { enableHtml: true });
      }, 0);
    }
  }

  static toastError(msg?, titulo = 'ERROR') {
    if (Ss.sharedServ.canToast) {
      fun.setTimeout(() => {
        Ss.toastr.error(msg || '', titulo || '', { enableHtml: true });
      }, 0);
    }
  }

  static toastWarning(msg?, titulo = 'AVISO') {
    if (Ss.sharedServ.canToast) {
      fun.setTimeout(() => {
        Ss.toastr.warning(msg || '', titulo || '', { enableHtml: true });
      }, 0);
    }
  }
}
