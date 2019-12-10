import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonsModule, WavesModule } from 'angular-bootstrap-md';
import { UsuariosService } from '../core/services/usuarios.service';
import { UsuariosI } from '../core/models/usuario.model';
import { ToastrService } from 'ngx-toastr';
import { DBservice } from '../core/services/bdservice.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  loginForm: FormGroup;
  errorC = '';
  errorU = '';
  constructor(private dbServ: DBservice, private toastr: ToastrService, private fb: FormBuilder, private router: Router, private usuariosServices: UsuariosService) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      usuario: null,
      password: null,
    });
  }

  // =================================================================
  // LOGIN
  // =================================================================
  login(form: any) {
    this.dbServ.login(form.value).subscribe(
      res => {
        this.errorC = '';
        this.errorU = '';
        this.dbServ.toastSuccess('', 'Correcto');
      },
      err => {
        if (err.error.errors[0] === 'Usuario ingresado no existe') {
          this.errorU = 'usuario no existe.';
        } else {
          this.errorU = '';
          if (err.error.errors[0] === 'Contraseña incorrecta') {
            this.errorC = 'contraseña invalida';
          }
        }
      },
    );
  }
}
