import { Component, OnInit } from '@angular/core';
import { DBservice } from '../../core/services/bdservice.service';

@Component({
  selector: 'app-homeAdmin',
  templateUrl: './homeAdmin.component.html',
  styleUrls: ['./homeAdmin.component.scss'],
})
export class HomeAdminComponent implements OnInit {
  constructor(private dbServ: DBservice) {}

  ngOnInit() {}
  p() {
    // document.getElementById('imgd').classList.add('rubberBand');
  }
}
