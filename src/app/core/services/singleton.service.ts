import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Injectable, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../loader/loader.service';
import { LayoutService } from '../../admin/layout/layout.service';
import { ConfigurationService } from './configuration.service';
import { IpcService } from './ipc.service';
import { SharedService } from './shared.service';
import { NgxPermissionsService } from 'ngx-permissions';

@Injectable({
  providedIn: 'root',
})
export class SingletonService {
  public static _ipc: IpcService;
  public static zone: NgZone;
  public static http: HttpClient;
  public static configServ: ConfigurationService;
  public static loadServ: LoaderService;

  public static layServ: LayoutService;
  public static toastr: ToastrService;
  public static sharedServ: SharedService;
  public static cdRef: ChangeDetectorRef;
  public static permissionsService: NgxPermissionsService;

  constructor() {}
}
