import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Injectable, Injector, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../loader/loader.service';
import { LayoutService } from '@admin/layout/layout.service';
import { ConfigurationService } from './configuration.service';
import { IpcService } from './ipc.service';
import { SharedService } from './shared.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { FacturacionService } from '@admin/facturacion/facturacion.service';
import { DynamicModalService } from '@components/dynamic-modal/dynamic-modal.service';
import { Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class Ss {
  public static _ipc: IpcService;
  public static zone: NgZone;
  public static http: HttpClient;
  public static configServ: ConfigurationService;
  public static loadServ: LoaderService;
  public static factServ: FacturacionService;
  public static firestore: Firestore;
  public static injector: Injector;

  public static layServ: LayoutService;
  public static toastr: ToastrService;
  public static sharedServ: SharedService;
  public static cdRef: ChangeDetectorRef;
  public static permissionsService: NgxPermissionsService;
  public static dynamicModalService: DynamicModalService;

  constructor() {}
}
