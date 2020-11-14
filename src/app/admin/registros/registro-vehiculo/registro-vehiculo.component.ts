import { Component, OnInit, OnDestroy, ChangeDetectorRef, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { DBservice } from '../../../core/services/bdservice.service';
import * as moment from 'moment';

import { map } from 'rxjs/operators';
import { ModalService } from '../../components/modal/modal.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { Subscription } from 'rxjs';
import { obj_paginate } from '../../components/tablas/tablas.service';

@Component({
  selector: 'app-registro-vehiculo',
  templateUrl: './registro-vehiculo.component.html',
  styleUrls: ['./registro-vehiculo.component.scss'],
})
export class RegistroVehiculoComponent implements OnInit {
  titulo = '';
  boton = '';
  form: FormGroup;

  isDetallable = false;
  medida: boolean;

  articuloSelected;

  vendersePorSelected;
  listaVehiculos;
  FORM: any;
  listaTipoArticulos: any;
  listaSuplidores: any;
  tipoModal: string;
  indexEditar: any;
  usuario: any;

  alertaMedida: any;

  Ispaquete = false;
  seleccionModal: any;
  indexBorrar: any;
  TIPOARTICULO: any;

  ARRAY_FORMULA: FormArray;
  COMPRADOEN: any;
  MEDIDACAJA: any;
  is_combo = false;
  numIngredientes: any;
  Recalcular = false;
  ProductoEditando: any;
  subDeci: Subscription;
  listaMarcas: any;
  is_editando = false;

  listaPropietarios = [];

  medida_principal = { label: 'Unidad', nivel: 1 };

  listaMedidas = [
    { descripcion: 'Paquete', id: 'paquete', nivel: 2 },
    { descripcion: 'Unidad', id: 'unidad', nivel: 1 },
  ];

  medidas = {
    caja: 'Cajas',
    paquete: 'Paquetes',
    unidad: 'Unidades',
  };
  optionsAlerta = [{ label: 'Unidad', nivel: 1 }];
  medidaCostoPrincipal = 'unitario';
  existencia_label_mostrar = { label: 'Unidad', nivel: 1 };
  existencia_value_mostrar: any = 1;
  is_unico = false;
  marcas = [];

  constructor(private dbServ: DBservice, private cdRef: ChangeDetectorRef, private fb: FormBuilder, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.getVehiculos(obj_paginate);

    this.dbServ.getNombresSuplidores().subscribe((res) => {
      this.listaSuplidores = GLOBAL.duplicarJson(res);
    });

    this.createForm();
    this.FORM = this.form.controls;

    this.titulo = 'Registro de camiones';
    this.boton = 'Registrar';

    this.subDeci = this.mServ.DECISIONMODAL.subscribe((res) => {
      if (res !== null && res !== undefined) {
        this.decisionModal(res);
      }
    });
    GLOBAL.enfocarInput('user_id');
  }
  ngOnDestroy() {
    this.borrar();
    this.subDeci.unsubscribe();
  }

  prueba() {}

  async getVehiculos(e) {
    const page = e.page;
    const per_page = e.per_page;
    const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
    try {
      // const res = await this.dbServ.getArticulosFiltrados(palabra_a_buscar, page, per_page, true).toPromise();
      // this.listaVehiculos = res.data;
    } catch (error) {
      this.dbServ.toastError('Error buscando articulos', 'ERROR');
    }
  }

  async getMarcas(e) {
    try {
      const res = await this.dbServ.getMarcas().toPromise();
      this.marcas = res.data;
    } catch (error) {
      this.dbServ.toastError('Error buscando articulos', 'ERROR');
    }
  }

  ngOnChanges() {
    this.cdRef.detectChanges();
  }

  createForm() {
    this.form = this.fb.group({
      user_id: [null, Validators.required],
      marca: [null, Validators.required],
      modelo: [null, Validators.required],
    });
  }

  saltar(campo, array?, i?) {
    if (array) {
      campo = campo + i;
    }

    if (campo !== 'send') {
      GLOBAL.enfocarInput(campo);
    } else {
      if (this.form.valid) {
        GLOBAL.enfocarInput('user_id');
        setTimeout(() => {
          this.submit(this.form);
        }, 250);
      }
    }
  }

  borrar() {
    this.ProductoEditando = null;
    this.form.reset();
    GLOBAL.enfocarInput('user_id');

    this.titulo = 'Registro de vehiculos';
    this.boton = 'Registrar';
  }
  selectPropietario() {}

  // =============================================
  //  BOTON ATRAS
  // =============================================
  atras() {
    this.router.navigateByUrl('/admin');
  }

  async editarItem(item) {
    // const articulo = item.ARG;
    // this.borrar();
    // this.is_editando = true;
    // this.ProductoEditando = item.ARG;
    // this.titulo = 'Editar Camion: ' + articulo.nombre;
    // this.boton = 'Editar';
    // this.indexEditar = item.INDEX;
    // console.log(articulo);
    // await this.form.patchValue(articulo);
    // if (articulo.unico) {
    //   this.form.controls.unico.setValue(true);
    //   await this.marcarCheck('unico');
    // }
    // if (articulo.is_detallable) {
    //   setTimeout(() => {
    //     this.form.controls.is_detallable.setValue(true);
    //     this.marcarCheck('detallable');
    //   }, 10);
    // }
    // this.form.controls.costo_principal.setValue(GLOBAL.numFormatTwoDecimal(articulo.costo_principal));
    // this.form.controls.precio_principal.setValue(GLOBAL.numFormatTwoDecimal(articulo.precio_principal));
    // this.medidaCostoPrincipal = articulo.medida === 'unidad' ? 'unitario' : 'paquete';
    // articulo.contenido_articulos.forEach((contenido) => {
    //   if (contenido.condicion === 'hijo') {
    //     // this.form.controls.cantidad_contenido_hijo.setValue(contenido.cantidad);
    //     // this.form.controls.medida_contenido_hijo.setValue(contenido.medida);
    //     // this.form.controls.precio_hijo.setValue(GLOBAL.numFormatTwoDecimal(contenido.precio)));
    //     // this.form.controls.costo_hijo.setValue(contenido.costo);
    //     // this.form.controls.id_contenido_hijo.setValue(contenido.id);
    //     // this.form.controls.referencia_hijo.setValue(contenido.referencia);
    //   } else {
    //     this.form.controls.cantidad_padre.setValue(contenido.cantidad);
    //     this.form.controls.precio_padre.setValue(GLOBAL.numFormatTwoDecimal(contenido.precio));
    //     this.form.controls.costo_padre.setValue(GLOBAL.numFormatTwoDecimal(contenido.costo));
    //     this.form.controls.id_contenido_padre.setValue(contenido.id);
    //   }
    // });
  }

  abrirModal(arg?) {
    this.seleccionModal = arg.ARG;
    this.indexBorrar = arg.INDEX;
    this.mServ.modalTipo('borrar');
    this.tipoModal = 'borrar';
    this.mServ.ModalSeleccion(arg.ARG);
    this.mServ.mostrarModal(true);
  }

  abrirModalFormulario(arg?) {
    this.seleccionModal = arg;

    this.mServ.modalTipo('crud_marca_modelo');
    this.tipoModal = 'crud_marca_modelo';
    this.mServ.ModalSeleccion(arg);
    this.mServ.mostrarModal(true);
  }

  decisionModal(arg) {
    if (arg) {
      const obj = GLOBAL.duplicarJson(this.seleccionModal);
      this.dbServ.eliminarArticulo(obj).subscribe(
        (res) => {
          this.dbServ.toastSuccess('Articulo ' + obj.nombre + ' borrado.', 'CORRECTO');
          _.pullAt(this.listaVehiculos, this.indexBorrar);
          this.tipoModal = '';
          this.decisionModal = null;
          this.borrar();
        },
        (err) => {
          this.mostrarErrores(err.error);
        },
      );
    }
  }

  capitalice(control, arg) {
    const campo = this.form.get(control);
    campo.setValue(GLOBAL.Capitalice(arg));
  }

  // =============================================
  //  Crear articulo
  // =============================================

  submit(form) {
    // const x = GLOBAL.duplicarJson(form.value);
    // console.log('x ', x);
    // const obj = {
    // user_id: this.fun.getUser().id,
    //   tipo_articulo_id: _.parseInt(x.tipo_articulo_id),
    //   nombre: x.nombre,
    //   costo_principal: GLOBAL.desformatear(x.costo_principal),
    //   precio_principal: GLOBAL.desformatear(x.precio_principal),
    //   suplidor_id: x.suplidor_id,
    //   medida: x.medida,
    //   is_detallable: x.is_detallable,
    //   existencia: x.medida === 'paquete' ? x.existencia : 1,
    //   estado: true,
    //   marca_id: x.marca_id,
    //   modelo_id: x.modelo_id,
    //   identificador: x.identificador,
    //   color: x.color,
    //   unico: x.unico,
    //   aviso_existencia: x.aviso_existencia,
    //   agotado: x.agotado,
    //   is_combo: false,
    //   medida_alerta: x.medida_alerta,
    //   contenido_articulos_attributes: this.formarContenido(),
    //   codigo: x.codigo,
    // };
    // console.log('obj ', obj);
    // if (x.id) {
    //   obj['id'] = x.id;
    //   this.dbServ.editarArticulo(obj).subscribe(
    //     (res) => {
    //       console.log('res ===>', res);
    //       const temp = GLOBAL.duplicarJson(this.listaVehiculos);
    //       this.listaVehiculos = [];
    //       res['contenido_articulos'] = res['contenido_articulos_attributes'];
    //       res['codigo'] = _.padStart(res.id, 5, '0');
    //       console.log('res antes ', res);
    //       const cant = res.cantidades[res.medida];
    //       res.existencia_mostrar = _.toString(cant) + ' ' + (cant === 1 ? _.capitalize(res.medida) : this.medidas[res.medida]);
    //       delete res['contenido_articulos_attributes'];
    //       temp[this.indexEditar] = res;
    //       this.listaVehiculos = GLOBAL.duplicarJson(temp);
    //       this.borrar();
    //       console.log('res despues ', res);
    //       this.dbServ.toastSuccess('Producto editado con exito.', 'Correcto');
    //     },
    //     (err) => {
    //       this.mostrarErrores(err.error);
    //     },
    //   );
    // } else {
    //   this.dbServ.createArticulo(obj).subscribe(
    //     (res) => {
    //       console.log('res ', res);
    //       console.log('this.listaVehiculos ', this.listaVehiculos);
    //       this.listaVehiculos = [...this.listaVehiculos, res];
    //       this.borrar();
    //       this.dbServ.toastSuccess('Producto registrado con exito.', 'Correcto');
    //     },
    //     (err) => {
    //       this.mostrarErrores(err.error);
    //     },
    //   );
    // }
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

  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Propietario',
      key: 'user_id',
    },
    {
      titulo: 'Marca',
      key: 'marca',
    },
    {
      titulo: 'Modelo',
      key: 'modelo',
    },
    {
      titulo: 'Cant. viajes',
      key: 'cantidad_viajes',
    },
  ];
  botones = {
    titulo: true,
    borrar: true,
    editar: true,
  };
}
