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
      console.log(obj);

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

  // handleFileSelect(evt) {
  //   const files = evt.target.files;
  //   const file = files[0];

  //   if (files && file) {
  //     const reader = new FileReader();

  //     reader.readAsBinaryString(file);
  //   }
  // }

  _handleReaderLoaded(readerEvt) {
    const binaryString = readerEvt.target.result;
    this.BASE_64 = btoa(binaryString);

    console.log('base_64', this.BASE_64);
  }
  // reader.onload = this._handleReaderLoaded.bind(this);

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
        console.log('FILE_NAME', this.FILE_NAME);
        console.log('BASE_64', this.BASE_64);
      };
    }
  }
}
