import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SharedService } from '../../core/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class FacturacionComponent implements OnInit {
  form: FormGroup;
  numFac = 0;
  fecha;
  constructor(private shServ: SharedService, private fb: FormBuilder, private route: ActivatedRoute) {
    this.form = this.fb.group({
      nombre: [],
      direccion: [],
      telefono: [],
    });
  }

  ngOnInit() {
    this.fecha = moment().format('L');
  }
}
