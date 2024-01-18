import { LoaderService } from './loader.service';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Injectable, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LayoutService } from '../../admin/layout/layout.service';
import { IpcService } from './ipc.service';
import { SharedService } from './shared.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { FacturacionService } from '../../admin/facturacion/facturacion.service';
import { ImagenService } from './imagen.service';
import { DivisaService } from '../../admin/registros/divisa/divisa.service';

@Injectable({
  providedIn: 'root',
})
export class Ss {
  public static _ipc: IpcService;
  public static zone: NgZone;
  public static http: HttpClient;
  public static loadServ: LoaderService;
  public static factServ: FacturacionService;
  public static imgServ: ImagenService;
  public static divisaServ: DivisaService;

  public static layServ: LayoutService;
  public static toastr: ToastrService;
  public static sharedServ: SharedService;
  public static cdRef: ChangeDetectorRef;
  public static permissionsService: NgxPermissionsService;

  constructor() {}
}
