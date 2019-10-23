import { Component, OnInit } from '@angular/core';
import { DBservice } from '../../core/services/bdservice.service';

@Component({
  selector: 'app-upload-img',
  templateUrl: './upload-img.component.html',
  styleUrls: ['./upload-img.component.scss'],
})
export class UploadImgComponent implements OnInit {
  nameFile = '';
  fotoActual: string;
  uploadedFile;
  imageSrc: any;
  BASE_64;
  FILE_NAME;

  constructor(private dbServ: DBservice) {}

  ngOnInit() {}

  subirIMG() {
    if (this.BASE_64 && this.FILE_NAME) {
      const obj = {
        base_64: this.BASE_64,
        fileName: this.FILE_NAME,
      };

      this.dbServ.subirFoto(obj).subscribe(
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

  onFileChange(ev) {
    const files = ev.target.files;
    const reader = new FileReader();
    const file = files[0];

    if (files && files.length > 0) {
      reader.readAsDataURL(file);

      reader.onload = e => {
        const bas64 = reader.result.toString().split(',')[1];
        this.FILE_NAME = files[0].name;
        this.BASE_64 = bas64;
        this.imageSrc = reader.result;
      };
    }
  }
}
