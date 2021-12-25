import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';

import { ModalService } from '../../admin/components/modal/modal.service';
import { LayoutService } from '../../admin/layout/layout.service';
import { FunctionService } from './functions.service';
import { IpcService } from './ipc.service';
import { PdfService } from './pdf/pdf.service';

@Injectable({
  providedIn: 'root',
})
export class SingletonService {
  public static fun: FunctionService;
  public static zone: NgZone;
  public static http: HttpClient;

  public static mServ: ModalService;
  public static _ipc: IpcService;
  public static layServ: LayoutService;
  public static pdfServ: PdfService;

  constructor() {}
}
