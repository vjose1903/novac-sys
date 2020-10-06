import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonsModule, WavesModule } from 'angular-bootstrap-md';
import { UsuariosService } from '../core/services/usuarios.service';

import { ToastrService } from 'ngx-toastr';
import { DBservice } from '../core/services/bdservice.service';
import { IpcService } from '../core/services/ipc.service';
import { PdfService } from '../core/services/pdf/pdf.service';

import { compra_contado_valor_fiscal, compra_credito_valor_fiscal, conduce, recibo_de_ingreso, venta_contado, venta_credito_consumo } from '../../assets/facturas';
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
      (res) => {
        this.errorC = '';
        this.errorU = '';
        this.dbServ.toastSuccess('', 'Correcto');
        this.getPrintersName();
      },
      (err) => {
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

  async printTest() {
    // const data = {
    //   id: null,
    //   tipo_factura_id: 2,
    //   suplidor_id: 1,
    //   cliente_id: null,
    //   user_id: 1,
    //   fecha_equivalente: '2020-09-23T16:28:39.952Z',
    //   fecha_vencimiento: null,
    //   fecha_valida: '2021-12-31',
    //   numero_comprobante: 'B0135153112',
    //   numero_factura: 3,
    //   condicion: 'Contado',
    //   forma_pago: 'Efectivo',
    //   total_factura: 14800.0,
    //   itbis: 0.0,
    //   descuento: 0.0,
    //   Bruto: 14800.0,
    //   estado: true,
    //   tipo: 'compra',
    //   NoCliente_nombre: null,
    //   NoCliente_direccion: null,
    //   costoYgasto: '9',
    //   pagada: true,
    //   vendedor_id: null,
    //   balance: 0.0,
    //   devuelta: 0.0,
    //   adelantada: false,
    //   is_nota: false,
    //   tiene_nota: false,
    //   aplicada_a: null,
    //   created_at: null,
    //   updated_at: null,
    //   cliente: null,
    //   suplidor: {
    //     id: 1,
    //     nombre: 'animal Farm',
    //     telefono: '(834) 614-5613',
    //     direccion: 'Por ahi en santo domingo',
    //     email: 'animal@hotmail.com',
    //     estado: true,
    //     created_at: '2020-09-21T13:32:19.939Z',
    //     updated_at: '2020-09-21T13:32:19.939Z',
    //     rnc: '047-65135-1',
    //     documentos_de_identidad: [
    //       {
    //         id: 5,
    //         user_id: null,
    //         cliente_id: null,
    //         suplidor_id: 1,
    //         descripcion: 'rnc',
    //         documento: '047-65135-1',
    //         principal: true,
    //         created_at: '2020-09-21T13:32:19.967Z',
    //         updated_at: '2020-09-21T13:32:19.967Z',
    //       },
    //     ],
    //   },
    //   tipo_factura: 'Factura con valor fiscal',
    //   detalle_facturas: [
    //     {
    //       id: null,
    //       cabecera_factura_id: null,
    //       articulo_id: 2,
    //       unidad: 'Caja',
    //       total: 8000.0,
    //       cantidad: 20.0,
    //       itbis: 0.0,
    //       precio: 400.0,
    //       costo: null,
    //       retirado: null,
    //       retirado_en_venta: null,
    //       descuento_valor: 0.0,
    //       descuento_porciento: 0.0,
    //       created_at: null,
    //       updated_at: null,
    //     },
    //     {
    //       id: null,
    //       cabecera_factura_id: null,
    //       articulo_id: 1,
    //       unidad: 'Quintal',
    //       total: 6800.0,
    //       cantidad: 10.0,
    //       itbis: 0.0,
    //       precio: 680.0,
    //       costo: null,
    //       retirado: null,
    //       retirado_en_venta: null,
    //       descuento_valor: 0.0,
    //       descuento_porciento: 0.0,
    //       created_at: null,
    //       updated_at: null,
    //     },
    //   ],
    // };

    // const data = compra_credito_valor_fiscal;
    // const data = compra_contado_valor_fiscal;
    const data_ = venta_credito_consumo;

    console.log('data_ ', data_);

    const obj = {
      data: data_,
      type: 'facturacion',
    };
    console.log(obj);

    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);

      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }

  async pruebaRecibo() {
    const data_ = recibo_de_ingreso;

    console.log('data_ ', data_);
    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = {
      data: data_,
      type: 'recibo_ingreso',
    };
    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);

      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }
  async pruebaConduce() {
    const data_ = conduce;

    console.log('data_ ', data_);
    // const DD = await this.pdfServ.makeFacturaVenta(data);
    const obj = {
      data: data_,
      type: 'conduce',
    };
    this._ipc.send('print', obj);

    await this._ipc.on('printRes', (event: Electron.IpcMessageEvent, res) => {
      console.log(res);

      if (res.status) {
      } else {
        this.dbServ.toastError(res.msg + '   ERROR: ' + res.err, 'ERROR');
      }
    });
  }
}
