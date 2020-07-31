import { Component, OnInit, ChangeDetectorRef, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ObservableServcie } from '../../../core/services/observables.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { map } from 'rxjs/operators';
import { GLOBAL } from '../../../core/services/GLOBAL';
import * as moment from 'moment';
import * as dateFormat from 'dateFormat';
import { ModalService } from '../../components/modal/modal.service';

@Component({
  selector: 'app-ncf',
  templateUrl: './ncf.component.html',
  styleUrls: ['./ncf.component.scss'],
})
export class NcfComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardTabla', { static: false }) cardTabla: ElementRef;
  altoDiv;

  titulo;
  form;
  boton = 'Ingresar';
  listaNCF;

  indexSelected: any;
  tipoModal: string;
  seleccionModal: any;
  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
    },
    {
      titulo: 'Tipo',
      key: 'tipoC',
    },
    {
      titulo: 'Cantidad',
      key: 'cantidad',
    },
    {
      titulo: 'Desde',
      key: 'desde',
    },
    {
      titulo: 'Hasta',
      key: 'hasta',
    },
    {
      titulo: 'Usado',
      key: 'usado_',
      text_color: 'colorUsado',
      isIcon: true,
      color: true,
    },
    {
      titulo: 'Activo',
      key: 'estado_',
      text_color: 'colorEstado',
      isIcon: true,
      color: true,
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
  subDeci: Subscription;
  lista_tipos_facturas: any;

  fechaCompra;
  fechaValidez;
  tipo_articulo_id = -1;
  public dpConfig: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  public dpConfigValidez: Partial<BsDatepickerConfig> = new BsDatepickerConfig();
  aletarTipoArticulo = false;
  paqueteSelected: string;
  Desde;
  Hasta;

  is_editando = false;
  ncfSelected;
  constructor(private dbServ: DBservice, private cdRef: ChangeDetectorRef, private fb: FormBuilder, private actRou: ActivatedRoute, private router: Router, private mServ: ModalService) {
    this.dpConfig = Object.assign(
      {},
      {
        showWeekNumbers: false,
        // maxDate: new Date(),
      },
    );

    this.dpConfigValidez = Object.assign(
      {},
      {
        showWeekNumbers: false,
        minDate: this.fechaCompra,
      },
    );
  }

  ngOnInit() {
    this.titulo = 'Paquetes de numeros comprobantes fiscales';
    this.necesarioStart();
    this.setDateInputs(new Date());
    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
  }

  ngAfterViewInit() {
    this.altoDiv = this.cardTabla.nativeElement.offsetHeight;
  }

  ngOnDestroy(): void {
    this.subDeci.unsubscribe();
  }

  text(arg) {
    this.setDateInputs(arg);
  }

  calculateFechaValida() {
    setTimeout(() => {
      const anio = moment(this.fechaCompra).add(1, 'year').format('YYYY');
      const newFecha = '12/31/' + anio;

      this.fechaValidez = newFecha;
    }, 50);
  }

  setDateInputs(actual) {
    this.fechaCompra = actual;
    const anio = moment(this.fechaCompra).add(1, 'year').format('YYYY');
    const newFecha = '12/31/' + anio;
    this.fechaValidez = newFecha;
  }

  async necesarioStart() {
    await this.getTiposFacturas();
    await this.getNcfRegistrados();
  }

  async getTiposFacturas() {
    try {
      this.lista_tipos_facturas = await this.dbServ.getTiposFacturas().toPromise();
      const temp = GLOBAL.duplicarJson(this.lista_tipos_facturas);
      for (let i = 0; i < temp.length; i++) {
        const element = temp[i];
        if (!element.referencia) {
          _.pullAt(temp, i);
        }
      }
      this.lista_tipos_facturas = temp;
    } catch (error) {}
  }

  async getNcfRegistrados() {
    try {
      this.listaNCF = await this.dbServ
        .getNCFregistrados()
        .pipe(
          map(
            (val) =>
              (val = val.map((ncf) => {
                ncf.cantidad = ncf.hasta - ncf.desde + 1;
                ncf.tipoC = this.lista_tipos_facturas.filter((tipo) => tipo.id === ncf.tipo_factura_id)[0].descripcion;
                ncf.codigo = _.padStart(ncf.id, 5, '0');
                ncf.fecha_compra = moment(ncf.fecha_compra, 'YYYY-MM-DD[T]HH:mm:ss').format('MM/DD/YYYY');
                ncf.fecha_valida = moment(ncf.fecha_valida, 'YYYY-MM-DD[T]HH:mm:ss').format('MM/DD/YYYY');
                ncf.colorUsado = ncf.usado ? 'green' : 'red';
                ncf.colorEstado = ncf.estado ? 'green' : 'red';
                ncf.estado_ = ncf.estado ? 'fas fa-check' : 'fas fa-times';
                ncf.usado_ = ncf.usado ? 'fas fa-check' : 'fas fa-times';
                return ncf;
              })),
          ),
        )
        .toPromise();
      this.listaNCF.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      });
      console.log(this.listaNCF);
    } catch (error) {
      console.error(error);
    }
  }

  checkTipoArticuloSelect() {
    if (this.tipo_articulo_id === -1) {
      this.aletarTipoArticulo = true;
    }
  }

  selectTipoFactura() {
    this.aletarTipoArticulo = false;
  }
  saltar(input) {}

  async submit() {
    const obj = {
      id: this.ncfSelected ? this.ncfSelected.id : null,
      tipo_factura_id: this.tipo_articulo_id,
      secuencia: this.Desde,
      desde: this.Desde,
      hasta: this.Hasta,
      fecha_compra: moment(this.fechaCompra).format(),
      fecha_valida: moment(this.fechaValidez).format(),
      estado: false,
      usado: false,
    };
    // console.log(obj);

    try {
      const res = await this.dbServ.PaqueteNCF(obj).toPromise();
      res.cantidad = res.hasta - res.desde + 1;
      res.tipoC = this.lista_tipos_facturas.filter((tipo) => tipo.id === res.tipo_factura_id)[0].descripcion;
      res.codigo = _.padStart(res.id, 5, '0');
      res.fecha_compra = moment(res.fecha_compra, 'YYYY-MM-DD[T]HH:mm:ss').format('MM/DD/YYYY');
      res.fecha_valida = moment(res.fecha_valida, 'YYYY-MM-DD[T]HH:mm:ss').format('MM/DD/YYYY');
      res.colorUsado = res.usado ? 'green' : 'red';
      res.colorEstado = res.estado ? 'green' : 'red';
      res.estado_ = res.estado ? 'fas fa-check' : 'fas fa-times';
      res.usado_ = res.usado ? 'fas fa-check' : 'fas fa-times';

      if (this.is_editando) {
        this.dbServ.toastSuccess('Comprobante editado', 'CORRECTO');
        console.log('index ', this.indexSelected);
        console.log('editando ', this.listaNCF[this.indexSelected]);
        setTimeout(() => {
          this.listaNCF[this.indexSelected] = GLOBAL.duplicarJson(res);
        }, 5);
      } else {
        this.dbServ.toastSuccess('Comprobante ingresado', 'CORRECTO');

        this.listaNCF = [...this.listaNCF, res];
        this.listaNCF.sort((a, b) => {
          return a.id > b.id ? 1 : -1;
        });
      }
      this.borrar();
      console.log(res);
    } catch (error) {
      console.error(error);
      this.dbServ.toastError(error.error.msg, 'ERROR');
    }
  }
  abilitarBtnSend() {
    let res = true;
    if (this.tipo_articulo_id !== -1 && this.Desde && this.Hasta && this.fechaCompra && this.fechaValidez) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  atras() {}
  borrar() {
    this.is_editando = false;
    this.ncfSelected = undefined;
    this.tipo_articulo_id = -1;
    this.titulo = 'Paquetes de numeros comprobantes fiscales';
    this.boton = 'Ingresar';
    this.paqueteSelected = undefined;
    this.Desde = undefined;
    this.Hasta = undefined;

    this.setDateInputs(new Date());
  }

  llenarCampos(item) {
    this.fechaCompra = item.fecha_compra;
    this.fechaValidez = item.fecha_valida;
    this.tipo_articulo_id = item.tipo_factura_id;
    this.Desde = item.desde;
    this.Hasta = item.hasta;
    this.ncfSelected = GLOBAL.duplicarJson(item);
  }

  editarItem(item) {
    console.log(item);

    this.indexSelected = item.INDEX;
    this.is_editando = true;
    if (item.METODO === 'editar') {
      this.paqueteSelected = item.ARG;
      this.titulo = ' Editar paquete de NCF numero: ' + item.ARG.codigo + ' de: ' + item.ARG.tipoC;
      this.boton = 'Editar';
      this.llenarCampos(item.ARG);
    }
  }
  abrirModal(arg?) {
    this.indexSelected = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.seleccionModal = arg.ARG;
    this.seleccionModal.nombre = 'comprobante para ' + arg.ARG.tipoC + ' numero: ' + arg.ARG.codigo;
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }
  decisionModal(arg) {
    console.log(arg);
    if (arg) {
      console.log('BORRANDO');

      this.dbServ.deleteNCF(this.seleccionModal.id).subscribe(
        (res) => {
          this.dbServ.toastSuccess('comprobante para ' + this.seleccionModal.tipoC + ' numero: ' + this.seleccionModal.codigo + ' borrado', 'CORRECTO');
          _.pullAt(this.listaNCF, this.indexSelected);
          this.tipoModal = '';
        },
        (err) => {
          console.log(err);
          this.mostrarErrores(err.error);
        },
      );
    }
  }
  mostrarErrores(arg) {
    if (Array.isArray(arg)) {
      arg.forEach((error) => {
        this.dbServ.toastError(error, 'ERROR');
      });
    } else {
      for (const key in arg) {
        if (arg.hasOwnProperty(key)) {
          const element = arg[key];

          if (key !== 'status') {
            this.dbServ.toastError(element, 'ERROR');
          }
        }
      }
    }
  }
}
