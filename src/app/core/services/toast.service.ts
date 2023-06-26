import { Ss } from './singleton.service';
import { Injectable } from '@angular/core';

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
    if (Ss.sharedServ.canToast) Ss.toastr.info(msg || '', titulo || '');
  }

  static toastSuccess(msg?, titulo = 'CORRECTO') {
    if (Ss.sharedServ.canToast) Ss.toastr.success(msg || '', titulo || '');
  }

  static toastError(msg?, titulo = 'ERROR') {
    if (Ss.sharedServ.canToast) Ss.toastr.error(msg || '', titulo || '');
  }

  static toastWarning(msg?, titulo = 'AVISO') {
    if (Ss.sharedServ.canToast) Ss.toastr.warning(msg || '', titulo || '');
  }
}
