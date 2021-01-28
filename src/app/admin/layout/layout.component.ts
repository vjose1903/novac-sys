import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';

import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';

import { FunctionService } from '../../core/services/functions.service';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  mantenimiento: boolean;

  sub = new Subscription();
  actualMenyItem;
  showLoading = true;

  showModal;
  tipoModal: any;
  seleccionModal: any;
  usuario;
  PrintersInstall: any;
  OpenPrinterMenu = false;
  // imgUser: string;
  imgUser = 'assets/img/transparente.png';
  versionApp: any;
  noServer = false;
  subDeciMenu: Subscription;
  ruta_a_cambiar = '';
  modulo_select: any;
  ready = false;
  // @ViewChild('dropCuenta', { static: true }) dropCuentaa;
  constructor(
    private fun: FunctionService,
    private dbServ: DBservice,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    public _ipc: IpcService,
    private layServ: LayoutService,
  ) {
    this.router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        this.showLoading = true;
      }
      if (routerEvent instanceof NavigationEnd || routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
        this.showLoading = false;
        this.checkRouteActiva();
      }
    });
  }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
  lRun = false;

  ngOnInit() {
    // this._init_layout();

    this.mantenimiento = true;
    this._ipc.PRINTERS.subscribe((res) => {
      if (res !== undefined) {
        this.PrintersInstall = res;
      }
    });
    const token = this.fun.getAuthToken();

    if (token) {
      this.dbServ
        .validateToken()
        .then((res) => {
          this.setUser(res.data);
          if (res.data.sexo === 'm') {
            this.imgUser = 'assets/img/userH.png';
          } else {
            this.imgUser = 'assets/img/userM.png';
          }
          this.lRun = true;
        })
        .catch((err) => {
          if (err.status === 0) {
            this.noServer = true;
          } else {
            this.fun.logout();

            this.router.navigateByUrl('/auth/login');

            this.noServer = false;
          }
        });
    } else {
      this.fun.logout();
    }

    this.subDeciMenu = this.layServ.DESICIONCAMBIOMENU.subscribe((res) => {
      this.decisionCambioMenu(res);
    });

    this.searchVersion();
    this.getPrintersName();
  }

  async getPrintersName() {
    this._ipc.send('printerNames');

    await this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });
  }

  async searchVersion() {
    this._ipc.send('getVersion');
    await this._ipc.on('versionResponse', (event, arg) => {
      this.versionApp = arg;
    });
  }

  getVersion() {
    return this.versionApp;
  }

  ngOnDestroy() {
    this.subDeciMenu.unsubscribe();
  }

  setUser(user) {
    this.usuario = user;
    this.fun.setUser(user);
  }

  element: HTMLElement;
  ngAfterViewInit() {
    this.ready = true;
  }

  stop(e) {
    this.OpenPrinterMenu = true;
    e.stopPropagation();
  }

  selectPrinter(name) {
    this.OpenPrinterMenu = false;
  }
  closePrinterMenu() {
    this.OpenPrinterMenu = false;
  }

  prueba1(hi: any) {}

  mostarSubmenu(x: string) {
    this.mantenimiento = !this.mantenimiento;
  }

  // =================================================================================
  // CERRAR SESION
  // =================================================================================
  logOut() {
    this.fun.logout();
    this.router.navigateByUrl('/');
    // this._destroy_layout();
  }

  mantenimientoCuenta(reg: String) {
    if (reg === 'usuario') {
      this.router.navigate(['/admin/mantCuenta', 'INS']);
    } else if (reg === 'centro') {
      this.router.navigate(['/admin/mantCentro', 'INS']);
    }
  }

  // =================================================================================
  // CHECK ROUTE ACTIVA
  // =================================================================================

  checkRouteActiva() {
    const temp_url = document.location.href.split('admin/');
    if (temp_url[1]) {
      const url = temp_url[1].split('/')[0];
      this.actualMenyItem = url;
    }
  }
  // =================================================================================
  // NAVEGAR
  // =================================================================================
  nextCambioMenu(subMenu, url) {
    if (subMenu) this.modulo_select = url;

    if (!subMenu) this.ruta_a_cambiar = this.modulo_select ? `/admin/${this.modulo_select}/${url}` : `/admin/${url}`;

    this.actualMenyItem = subMenu ? `${this.modulo_select}_select` : `${this.modulo_select}`;

    if (!subMenu) {
      // if (modulo) {
      //   this.router.navigateByUrl(this.ruta_a_cambiar);
      // } else {
      this.ready = false;
      this.layServ.nextCambioMenu(true);
      // }
    }

    // switch (url) {
    //   // case 'home':
    //   //   this.ruta_a_cambiar = '/admin/dashboard';
    //   //   break;

    //   case 'inventario':
    //     this.ruta_a_cambiar = '/admin/inventario';
    //     break;

    //   case 'reportes':
    //     this.ruta_a_cambiar = '/admin/reportes';
    //     break;

    //   case 'produccion':
    //     this.actualMenyItem = 'produccion';
    //     this.ruta_a_cambiar = '/admin/produccion';
    //     break;

    //   case 'conduce':
    //     this.actualMenyItem = 'conduce';
    //     this.ruta_a_cambiar = '/admin/conduce';
    //     break;

    //   // case 'venta':
    //   //   this.ruta_a_cambiar = '/admin/dashboard';
    //   //   this.actualMenyItem = 'factura';
    //   //   setTimeout(() => {
    //   //     this.ruta_a_cambiar = '/admin/factura/venta/new/0';
    //   //   }, 5);
    //   //   break;

    //   // case 'compra':
    //   //   this.ruta_a_cambiar = '/admin/dashboard';
    //   //   this.actualMenyItem = 'factura';

    //   //   setTimeout(() => {
    //   //     this.ruta_a_cambiar = '/admin/factura/compra/new/0';
    //   //   }, 5);
    //   //   break;

    //   case 'buscarFactura':
    //     this.ruta_a_cambiar = '/admin/dashboard';
    //     this.actualMenyItem = 'manipular';
    //     setTimeout(() => {
    //       this.ruta_a_cambiar = '/admin/manipular/buscarFactura/';
    //     }, 5);
    //     break;

    //   case 'ingreso':
    //     this.ruta_a_cambiar = '/admin/recibos/ingresos';
    //     this.actualMenyItem = 'recibos';
    //     break;

    //   case 'viajes':
    //     this.ruta_a_cambiar = '/admin/recibos/viajes';
    //     this.actualMenyItem = 'recibos';
    //     break;

    //   case 'ncf':
    //     this.actualMenyItem = 'registros';
    //     this.ruta_a_cambiar = '/admin/registros/ncf';
    //     break;

    //   case 'articulos':
    //     this.actualMenyItem = 'registros';
    //     this.ruta_a_cambiar = '/admin/registros/articulos';
    //     break;

    //   case 'empleados':
    //     this.actualMenyItem = 'registros';
    //     this.ruta_a_cambiar = '/admin/registros/empleados';
    //     break;

    //   case 'clientes':
    //     this.actualMenyItem = 'registros';
    //     this.ruta_a_cambiar = '/admin/registros/clientes';
    //     break;

    //   case 'suplidores':
    //     this.actualMenyItem = 'registros';
    //     this.ruta_a_cambiar = '/admin/registros/suplidores';
    //     break;

    //   case 'camiones':
    //     this.actualMenyItem = 'registros';
    //     this.ruta_a_cambiar = '/admin/registros/camiones';
    //     break;

    //   default:
    //     break;
    // }
  }

  decisionCambioMenu(decision) {
    if (decision) {
      this.router.navigateByUrl(this.ruta_a_cambiar);
      setTimeout(() => (this.ready = true), 10);
      this.layServ.nextDecisionCambioMenu(false);
    } else {
      this.ruta_a_cambiar = '';
    }
    this.modulo_select = undefined;

    this.layServ.nextCambioMenu(false);
  }

  modalConfig() {}
  // ===========================================================================
  // MODAL
  // ===========================================================================

  // reiniciarVarModal() {
  //   TIPOMODAL.next('');
  //   SHOWMODAL.next(false);
  //   SELECCIONMODAL.next({});
  // }

  // BtnModal(arg) {
  //   DECISIONMODAL.next(arg);
  //   this.reiniciarVarModal();
  // }

  // clickRowModal(arg) {
  //   OBJDEVUELTO.next(arg);
  // }

  // noArticuloEncontrado(arg) {
  //   INDEXTOFOCUS.next(arg);
  // }
}
