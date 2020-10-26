import { Component, OnInit, OnDestroy, ViewChildren, ViewChild, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';

import { get } from 'http';

import { DBservice } from '../../core/services/bdservice.service';
import { IpcService } from '../../core/services/ipc.service';

import * as moment from 'moment';
import { FunctionService } from '../../core/services/functions.service';

@Component({
  selector: 'app-navbar-a',
  templateUrl: './navbar-a.component.html',
  styleUrls: ['./navbar-a.component.scss'],
})
export class NavbarAComponent implements OnInit, OnDestroy, AfterViewInit {
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
  imgUser = 'assets/img/userH.png';
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
    console.log('token ', token);

    // console.log('token desde appcompnent => ', token);
    if (token) {
      this.dbServ
        .validateToken()
        .then((res) => {
          console.log('validando token, ', res.data);
          this.setUser(res.data);
          this.lRun = true;
        })
        .catch((err) => {
          console.log('error validando token: ', err);

          if (err.status === 0) {
            this.noServer = true;
          } else {
            this.fun.logout();
            this.noServer = false;
          }
        });
    } else {
      this.fun.logout();
    }
    this.searchVersion();
  }

  async searchVersion() {
    this._ipc.send('getVersion');
    await this._ipc.on('versionResponse', (event, arg) => {
      this.versionApp = arg;
    });
  }

  ngOnDestroy() {
    // this.sub.unsubscribe();
  }
  setUser(user) {
    this.usuario = user;
    this.fun.setUser(user);
    console.log('this.usuario ', this.usuario);
  }
  element: HTMLElement;
  ngAfterViewInit() {
    // if (this.usuario.sexo === 'm') {
    //   this.imgUser = 'assets/img/userH.png';
    // } else {
    //   this.imgUser = 'assets/img/userM.png';
    // }
  }

  stop(e) {
    this.OpenPrinterMenu = true;
    e.stopPropagation();
  }

  selectPrinter(name) {
    console.log(name);
    this.OpenPrinterMenu = false;
  }
  closePrinterMenu() {
    this.OpenPrinterMenu = false;
  }

  prueba1(hi: any) {
    console.log(hi._animationState);
  }

  mostarSubmenu(x: string) {
    console.log(this.mantenimiento);
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
  // NAVEGAR
  // =================================================================================
  navegar(lugar: any, accion?) {
    switch (lugar) {
      case 1:
        this.actualTab = 'home';
        this.router.navigateByUrl('/admin');
        break;

      case 2:
        this.actualTab = 'factura';
        // this.router.navigateByUrl('/admin/factura');
        break;

      case 3:
        this.actualTab = 'registro';
        // this.router.navigateByUrl("/admin/factura")
        break;

      case 4:
        this.actualTab = 'inventario';
        this.router.navigateByUrl('/admin/inventario');
        break;

      case 5:
        this.actualTab = 'reporte';
        // this.router.navigateByUrl("/admin/factura")
        break;
      case 6:
        this.actualTab = 'produccion';
        this.router.navigateByUrl('/admin/produccion');
        break;
      case 7:
        this.actualTab = 'ingresos';

        break;
      case 8:
        this.actualTab = 'nota';
        break;
      case 9:
        this.actualTab = 'mantenimiento';
        break;
      case 10:
        this.actualTab = 'conduce';
        this.router.navigateByUrl('/admin/conduce');
        break;

      case 'venta':
        this.router.navigateByUrl('/admin');
        this.actualTab = 'home';
        setTimeout(() => {
          this.router.navigate(['/admin/factura/venta']);
        }, 5);
        break;

      case 'compra':
        this.router.navigateByUrl('/admin');
        this.actualTab = 'home';
        setTimeout(() => {
          this.router.navigate(['/admin/factura/compra']);
        }, 5);
        break;

      case 'buscarFactura':
        this.router.navigateByUrl('/admin');
        this.actualTab = 'home';
        setTimeout(() => {
          this.router.navigate(['/admin/buscarFactura/' + accion]);
        }, 5);
        break;

      case 'ingreso':
        this.router.navigateByUrl('/admin/ingresos');
        break;

      case 'viajes':
        this.router.navigateByUrl('/admin/viajes');
        break;

      case 'ncf':
        // this.router.navigateByUrl('/admin');
        // this.actualTab = 'home';
        // setTimeout(() => {
        this.router.navigate(['/admin/ncf']);
        // }, 5);
        break;

      case 'articulos':
        this.actualTab = 'home';
        this.router.navigate(['/admin/articulos']);
        break;

      case 'empleados':
        this.actualTab = 'home';
        this.router.navigate(['/admin/empleados']);
        break;

      case 'clientes':
        this.actualTab = 'home';
        this.router.navigate(['/admin/clientes']);
        break;

      case 'suplidores':
        this.actualTab = 'home';
        this.router.navigate(['/admin/suplidores']);
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
