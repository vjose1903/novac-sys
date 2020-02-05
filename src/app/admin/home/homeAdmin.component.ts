import { Component, OnInit } from '@angular/core';
import { DBservice } from '../../core/services/bdservice.service';
import { GLOBAL } from '../../core/services/GLOBAL';

@Component({
  selector: 'app-homeAdmin',
  templateUrl: './homeAdmin.component.html',
  styleUrls: ['./homeAdmin.component.scss'],
})
export class HomeAdminComponent implements OnInit {
  constructor(private dbServ: DBservice) {}
  cedula = null;
  ngOnInit() {}
  p() {
    // document.getElementById('imgd').classList.add('rubberBand');
  }
  verificar() {
    GLOBAL.ValidaCedula2(this.cedula);
  }
}
