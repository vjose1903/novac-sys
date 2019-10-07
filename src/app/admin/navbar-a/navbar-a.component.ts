import { Component, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';
import { UsuariosI } from '../../core/models/usuario.model';
import { profile, TIPOMODAL, SHOWMODAL, SELECCIONMODAL, DECISIONMODAL, INDEXTOFOCUS, OBJDEVUELTO } from '../../core/services/GLOBAL';
import { get } from 'http';
import { SharedService } from '../../core/services/shared.service';

const { dialog } = require('electron').remote;

@Component({
  selector: 'app-navbar-a',
  templateUrl: './navbar-a.component.html',
  styleUrls: ['./navbar-a.component.scss'],
})
export class NavbarAComponent implements OnInit, OnDestroy {
  mantenimiento: boolean;
  subShowModal = new Subscription();
  subTipoModal = new Subscription();
  subSeleccionModal = new Subscription();
  sub = new Subscription();

  actualTab: any;

  showLoading = true;

  showModal;
  tipoModal: any;
  seleccionModal: any;
  constructor(private shServ: SharedService, private breakpointObserver: BreakpointObserver, public usuariosServices: UsuariosService, private router: Router) {
    this.router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        this.showLoading = true;
      }
      if (routerEvent instanceof NavigationEnd || routerEvent instanceof NavigationCancel || routerEvent instanceof NavigationError) {
        this.showLoading = false;
      }
    });
  }

  imagenCuenta = 'http://localhost:3000/api/photos/this.usuariosServices.profile.fotoPerfil';
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)

    .pipe(map(result => result.matches));

  ngOnInit() {
    this.mantenimiento = true;

    const userPayload = this.usuariosServices.getUserPayload();
    this.usuariosServices.getUser(userPayload._id).subscribe(res => {
      const data = res as UsuariosI;
      profile.next(data);
    });

    this.sub = profile.subscribe(res => {
      this.usuariosServices.profile = res;
    });

    this.subShowModal = SHOWMODAL.subscribe(res => {
      this.showModal = res;
    });

    this.subTipoModal = TIPOMODAL.subscribe(res => {
      this.tipoModal = res;
    });
    this.subSeleccionModal = SELECCIONMODAL.subscribe(res => {
      this.seleccionModal = res;
    });
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
    this.subShowModal.unsubscribe();
    this.subTipoModal.unsubscribe();
    this.subSeleccionModal.unsubscribe();
  }

  prueba1(hi: any) {
    console.log(hi._animationState);
  }

  onHidden(): void {
    console.log('Dropdown is hidden');
  }
  onShown(): void {
    console.log('Dropdown is shown');
  }
  isOpenChange(): void {
    console.log('Dropdown state is changed');
  }

  mostarSubmenu(x: string) {
    console.log(this.mantenimiento);
    this.mantenimiento = !this.mantenimiento;
  }

  // =================================================================================
  // CERRAR SESION
  // =================================================================================
  logOut() {
    this.usuariosServices.deleteToken();
    this.usuariosServices.profile = null;
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
  navegar(lugar: any) {
    switch (lugar) {
      case 1:
        this.actualTab = 'home';
        this.router.navigateByUrl('/admin');
        break;

      case 2:
        this.actualTab = 'factura';
        this.router.navigateByUrl('/admin/factura');
        break;

      case 3:
        this.actualTab = 'registro';
        // this.router.navigateByUrl("/admin/factura")
        break;

      case 4:
        this.actualTab = 'inventario';
        // this.router.navigateByUrl("/admin/factura")
        break;

      case 5:
        this.actualTab = 'reporte';
        // this.router.navigateByUrl("/admin/factura")
        break;

      case 'articulos':
        this.actualTab = 'home';
        this.router.navigate(['/admin/articulos/INS']);
        break;

      case 'empleados':
        this.actualTab = 'home';
        this.router.navigate(['/admin/empleados/INS']);
        break;

      default:
        break;
    }
  }

  // ===========================================================================
  // MODAL
  // ===========================================================================

  reiniciarVarModal() {
    TIPOMODAL.next('');
    SHOWMODAL.next(false);
    SELECCIONMODAL.next({});
  }

  BtnModal(arg) {
    DECISIONMODAL.next(arg);
    this.reiniciarVarModal();
  }

  clickRowModal(arg) {
    OBJDEVUELTO.next(arg);
  }

  noArticuloEncontrado(arg) {
    INDEXTOFOCUS.next(arg);
  }
}
