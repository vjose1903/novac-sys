import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonsModule, WavesModule } from 'angular-bootstrap-md';
import { UsuariosService } from '../core/services/usuarios.service';

import { ToastrService } from 'ngx-toastr';
import { DBservice } from '../core/services/bdservice.service';
import { IpcService } from '../core/services/ipc.service';
import { PdfService } from '../core/services/pdf/pdf.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  loginForm: FormGroup;
  errorC = '';
  errorU = '';
  constructor(
    private dbServ: DBservice,
    private pdfServ: PdfService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router,
    private usuariosServices: UsuariosService,
    private _ipc: IpcService,
  ) {}

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
        this.getPrintersName();
      },
      err => {
        if (err.error.errors[0] === 'Usuario ingresado no existe') {
          this.errorU = 'usuario no existe.';
        } else if (err.error.errors[0] === 'Contraseña incorrecta') {
          this.errorC = 'contraseña invalida';
          this.errorU = '';
        } else {
          this.mostrarErrores(err.error.errors);
        }
      },
    );
  }

  mostrarErrores(arg) {
    console.log('---------------');

    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];

        this.dbServ.toastError(element, 'Error');
      }
    }
  }

  getPrintersName() {
    this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });

    this._ipc.send('printerNames');
  }
}
