import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonsModule, WavesModule } from 'angular-bootstrap-md'
import { UsuariosService } from '../core/services/usuarios.service';
import { UsuariosI } from '../core/models/usuario.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  loginForm:FormGroup
  errorC=''
  constructor(private fb: FormBuilder,
              private router: Router,
              private usuariosServices:UsuariosService
              ) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      'usuario': 'ADM-user',
      'password': null
    })
    
  }

  //=================================================================
  // LOGIN
  //=================================================================
  login(form: any){

    this.usuariosServices.login(form.value).subscribe(
      res=>{
      this.usuariosServices.setToken(res['token']);
      var userPayload= this.usuariosServices.getUserPayload()
      this.usuariosServices.getUser(userPayload._id).subscribe(
        res=>{          
          var data =res as UsuariosI;
          if(data.role=="A"){
              this.router.navigateByUrl('/admin');
            }else if(data.role=="U"){
              this.router.navigateByUrl('/usuario');
          }else{
              this.router.navigateByUrl('/');          
          }
        })

      
      this.errorC=""
    },
    err=>{
      if(err.error.mensaje=="Contraseña incorrecta"){
        
        this.errorC="contraseña invalida"
      }
    }
    )
  }
}
