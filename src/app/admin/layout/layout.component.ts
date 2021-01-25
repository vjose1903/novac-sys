import { Component, OnInit, OnDestroy, ViewChildren, ViewChild, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';

import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';

import { FunctionService } from '../../core/services/functions.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  mantenimiento: boolean;

  sub = new Subscription();
  actualTab;
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
  // @ViewChild('dropCuenta', { static: true }) dropCuentaa;
  constructor(
    private fun: FunctionService,
    private dbServ: DBservice,
    private breakpointObserver: BreakpointObserver,
    public usuariosServices: UsuariosService,
    private router: Router,
    private _ipc: IpcService,
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

  // imagenCuenta = 'http://localhost:3000/api/photos/this.usuariosServices.profile.fotoPerfil';
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches));
  lRun = false;

  ngOnInit() {
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
    // this.sub.unsubscribe();
  }
  setUser(user) {
    this.usuario = user;
    this.fun.setUser(user);
  }
  element: HTMLElement;
  ngAfterViewInit() {}

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
      this.actualTab = url;
    }
  }
  // =================================================================================
  // NAVEGAR
  // =================================================================================
  navegar(lugar: any, accion?) {
    switch (lugar) {
      case 1:
        this.actualTab = 'home';
        this.router.navigateByUrl('/admin/dashboard');
        break;

      case 2:
        this.actualTab = 'factura_select';
        break;

      case 3:
        this.actualTab = 'registros_select';
        break;

      case 4:
        this.actualTab = 'inventario';
        this.router.navigateByUrl('/admin/inventario');
        break;

      case 5:
        this.actualTab = 'reportes';
        this.router.navigateByUrl('/admin/reportes');
        break;

      case 7:
        this.actualTab = 'recibos_select';
        break;

      case 6:
        this.actualTab = 'produccion';
        this.router.navigateByUrl('/admin/produccion');
        break;

      case 8:
        this.actualTab = 'manipular_select';
        break;

      case 9:
        this.actualTab = 'mantenimiento';
        break;

      case 10:
        this.actualTab = 'conduce';
        this.router.navigateByUrl('/admin/conduce');
        break;

      case 'venta':
        this.router.navigateByUrl('/admin/dashboard');
        this.actualTab = 'factura';
        setTimeout(() => {
          this.router.navigate(['/admin/factura/venta/new/0']);
        }, 5);
        break;

      case 'compra':
        this.router.navigateByUrl('/admin/dashboard');
        this.actualTab = 'factura';

        setTimeout(() => {
          this.router.navigate(['/admin/factura/compra/new/0']);
        }, 5);
        break;

      case 'buscarFactura':
        this.router.navigateByUrl('/admin/dashboard');
        this.actualTab = 'manipular';
        setTimeout(() => {
          this.router.navigate(['/admin/manipular/buscarFactura/' + accion]);
        }, 25);
        break;

      case 'ingreso':
        this.router.navigateByUrl('/admin/recibos/ingresos');
        this.actualTab = 'recibos';
        break;

      case 'viajes':
        this.router.navigateByUrl('/admin/recibos/viajes');
        this.actualTab = 'recibos';
        break;

      case 'ncf':
        this.actualTab = 'registros';
        this.router.navigate(['/admin/registros/ncf']);
        break;

      case 'articulos':
        this.actualTab = 'registros';
        this.router.navigate(['/admin/registros/articulos']);
        break;

      case 'empleados':
        this.actualTab = 'registros';
        this.router.navigate(['/admin/registros/empleados']);
        break;

      case 'clientes':
        this.actualTab = 'registros';
        this.router.navigate(['/admin/registros/clientes']);
        break;

      case 'suplidores':
        this.actualTab = 'registros';
        this.router.navigate(['/admin/registros/suplidores']);
        break;

      case 'camiones':
        this.actualTab = 'registros';
        this.router.navigate(['/admin/registros/camiones']);
        break;

      default:
        break;
    }
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
