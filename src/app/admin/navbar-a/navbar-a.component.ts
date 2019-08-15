import { Component, OnInit, OnDestroy} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { Router, NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Event } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';


@Component({
  selector: 'app-navbar-a',
  templateUrl: './navbar-a.component.html',
  styleUrls: ['./navbar-a.component.scss']
})
export class NavbarAComponent implements OnInit, OnDestroy{
  mantenimiento:boolean
  sub =new Subscription()

  showLoading=true
  constructor( private breakpointObserver: BreakpointObserver, public usuariosServices: UsuariosService, private router:Router) {

    this.router.events.subscribe( (routerEvent: Event) => {
      if(routerEvent instanceof NavigationStart){
        this.showLoading=true;
      }
      if(routerEvent instanceof NavigationEnd||
        routerEvent instanceof NavigationCancel||
        routerEvent instanceof NavigationError){
          this.showLoading=false;
        }
    })
  }
  
  imagenCuenta="http://localhost:3000/api/photos/this.usuariosServices.profile.fotoPerfil";
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)


    .pipe(
      map(result => result.matches)
    );
    
    ngOnInit() {
      this.mantenimiento=false

      var userPayload= this.usuariosServices.getUserPayload()
      // this.usuariosServices.getUser(userPayload._id).subscribe(
      //   res=>{
      //     var data =res as UsuariosI;
      //       profile.next(data)
      //   })

      // this.sub = profile.subscribe(
      //   res=>{
      //     this.usuariosServices.profile= res;
      //   }
      // );
    }  
    ngOnDestroy() {
      this.sub.unsubscribe();
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

    mostarSubmenu(x:string){
      console.log(this.mantenimiento)
      this.mantenimiento=!this.mantenimiento

    }

    // =================================================================================
    // CERRAR SESION
    // =================================================================================
    logOut(){
      this.usuariosServices.deleteToken()
      this.usuariosServices.profile=null
      this.router.navigateByUrl('/');
    }

    mantenimientoCuenta(reg:String){
      if(reg=='usuario'){
        this.router.navigate(['/admin/mantCuenta','INS']);
      }
      else if(reg=='centro'){
        this.router.navigate(['/admin/mantCentro','INS']);
      }
    }


}
