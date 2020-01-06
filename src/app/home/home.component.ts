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

  prueba() {
    const factVen = {};

    const factCom = {
      id: 53,
      tipo_factura_id: 2,
      suplidor_id: 2,
      cliente_id: null,
      user_id: 1,
      fecha_facturacion: '2019-12-27',
      fecha_vencimiento: null,
      fecha_valida: '2020-12-27',
      numero_comprobante: 'b0100000005',
      numero_factura: 10,
      condicion: 'Contado',
      forma_pago: 'Efectivo',
      total_factura: 373.0,
      itbis: 0.0,
      descuento: 0.0,
      estado: true,
      tipo: 'compra',
      created_at: '2019-12-27T23:42:26.774Z',
      updated_at: '2019-12-27T23:42:26.774Z',
      Bruto: 373.0,
      NoCliente_nombre: null,
      NoCliente_direccion: null,
      costoYgasto: '2',
      detalle_facturas: [
        {
          descripcion: 'Maiz',
          unidad: 'Libra',
          costo: 10.0,
          precio: 11.11,
          total: 10,
          descuento: 0,
          itbis: 0,
          cantidad: 1,
          tipo: 'Materia prima',
        },
        {
          descripcion: 'Guantes latex',
          unidad: 'Paquete',
          costo: 33.0,
          precio: 36.66,
          total: 33,
          descuento: 0,
          itbis: 0,
          cantidad: 1,
          tipo: 'Veterinaria',
        },
        {
          descripcion: 'jeringas',
          unidad: 'Unidad',
          costo: 27.0,
          precio: 30.0,
          total: 270,
          descuento: 0,
          itbis: 0,
          cantidad: 10,
          tipo: 'Veterinaria',
        },
        {
          descripcion: 'prueba',
          unidad: 'Quintal',
          costo: 30.0,
          precio: 33.33,
          total: 60,
          descuento: 0,
          itbis: 0,
          cantidad: 2,
          tipo: 'Materia prima',
        },
      ],
      cliente: null,
      suplidor: {
        nombre: 'suplidor 2',
        direccion: 'jeremias la vega',
        rnc: '047-9858570-3',
      },
      tipo_factura: 'Valor fiscal',
      usuario: 'administrador Santos',
    };

    this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);
    });
    // this._ipc.send('test', factVen)
    this._ipc.send('test', factCom);
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
        } else {
          this.errorU = '';
          if (err.error.errors[0] === 'Contraseña incorrecta') {
            this.errorC = 'contraseña invalida';
          }
        }
      },
    );
  }

  getPrintersName() {
    this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });

    this._ipc.send('printerNames');
  }
}
