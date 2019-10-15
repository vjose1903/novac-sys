import { Component, OnInit } from '@angular/core';
import { DBservice } from '../../core/services/bdservice.service';

@Component({
  selector: 'app-homeAdmin',
  templateUrl: './homeAdmin.component.html',
  styleUrls: ['./homeAdmin.component.scss'],
})
export class HomeAdminComponent implements OnInit {
  nameFile = '';
  fotoActual: string;
  uploadedFile;
  imageSrc: any;

  constructor(private dbServ: DBservice) {}

  ngOnInit() {}

  subirIMG() {
    if (this.uploadedFile) {
      // console.log(this.uploadedFile);

      this.dbServ.subirFoto(this.uploadedFile).subscribe(
        res => {
          console.log(res);
        },
        err => {
          console.log(err);
        },
      );
    } else {
      this.dbServ.toastError('Debe de seleccionar una foto primero', 'ERROR');
    }
  }
  onFileChange(e) {
    if (e.target.files[0]) {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onload = e => (this.imageSrc = reader.result);

      reader.readAsDataURL(file);
    }
    this.uploadedFile = e.target.files[0];
    this.nameFile = e.target.files[0].name;
  }
}
