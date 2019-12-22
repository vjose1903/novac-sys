import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonsModule, WavesModule } from 'angular-bootstrap-md';
import { UsuariosService } from '../core/services/usuarios.service';
import { UsuariosI } from '../core/models/usuario.model';
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
  constructor(private dbServ: DBservice,private pdfServ: PdfService ,private toastr: ToastrService, private fb: FormBuilder, private router: Router, private usuariosServices: UsuariosService, private _ipc:IpcService) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      usuario: null,
      password: null,
    });
  }

  prueba() {
    const factCre = {
      id: 4,
      tipo_factura_id: 2,
      suplidor_id: null,
      cliente_id: 2,
      user_id: 1,
      fecha_facturacion: '2019-12-08',
      fecha_vencimiento: '2020-01-07',
      fecha_valida: '2020-12-08',
      numero_comprobante: 'B0100000001',
      numero_factura: 4,
      condicion: 'Crédito',
      forma_pago: 'Efectivo',
      total_factura: 7492.5,
      itbis: 0.0,
      descuento: 0.0,
      estado: true,
      tipo: 'venta',
      created_at: '2019-12-08T18:33:55.439Z',
      updated_at: '2019-12-08T18:33:55.439Z',
      Bruto: 7492.5,
      detalle_facturas: [
        {
          descripcion: 'maiz (25 LBS)',
          unidad: 'Saco',
          precio: 999.99,
          total: 499,
          descuento: 0,
          itbis: 0,
          cantidad: 2,
        },
        {
          descripcion: 'maiz (100 LBS)',
          unidad: 'Saco',
          precio: 999.99,
          total: 6993,
          descuento: 0,
          itbis: 0,
          cantidad: 7,
        },
      ],
      cliente: {
        nombre: 'marcos',
        direccion: 'la vega centro de la ciudad\n',
        rnc: '047-0144534-5',
      },
      suplidor: null,
      tipo_factura: 'Factura con valor fiscal',
    };
    const factCon = {
      id: 15,
      tipo_factura_id: 3,
      suplidor_id: null,
      cliente_id: 1,
      user_id: 1,
      fecha_facturacion: '2019-12-11',
      fecha_vencimiento: null,
      fecha_valida: '2020-12-11',
      numero_comprobante: 'B0200000011',
      numero_factura: 17,
      condicion: 'Contado',
      forma_pago: 'Efectivo',
      total_factura: 2497.5,
      itbis: 0.0,
      descuento: 0.0,
      estado: true,
      tipo: 'venta',
      created_at: '2019-12-11T12:39:38.318Z',
      updated_at: '2019-12-11T12:39:38.318Z',
      Bruto: 2497.5,
      detalle_facturas: [
        {
          descripcion: 'maiz (50 LBS)',
          unidad: 'Saco',
          precio: 999.99,
          total: 2497,
          descuento: 0,
          itbis: 0,
          cantidad: 5,
        },
      ],
      cliente: {
        nombre: 'Cliente contado',
        direccion: 'Autopista duarte KM 0 el Higuero',
        rnc: '',
      },
      suplidor: null,
      tipo_factura: 'Factura de consumo',
    };

    const Fact = this.pdfServ.makeFacturaVenta(factCre);

    console.log(JSON.stringify(Fact));
    

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
        this.getPrintersName()
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

  getPrintersName(){
    this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res)
    });

    this._ipc.send('printerNames');
  }
}
