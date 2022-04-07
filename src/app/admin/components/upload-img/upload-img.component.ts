import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { fun } from '../../../core/services/functions.service';
import { RequestC } from '../../../core/typescript/requests';

@Component({
  selector: 'app-upload-img',
  templateUrl: './upload-img.component.html',
  styleUrls: ['./upload-img.component.scss'],
})
export class UploadImgComponent implements OnInit {
  nameFile = '';
  fotoActual: string;
  uploadedFile;
  BASE_64;
  FILE_NAME;
  requestClass = new RequestC();

  @Input() src_img;
  @Input() id;
  @Output() getPhotoData = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  borrar() {
    this.src_img = null;
    this.BASE_64 = null;
    this.FILE_NAME = null;

    const data = { fileName: this.FILE_NAME, base_64: this.BASE_64, src_img: this.src_img, id: this.id };
    this.getPhotoData.emit(data);
  }

  subirIMG() {
    if (this.BASE_64 && this.FILE_NAME) {
      const obj = { base_64: this.BASE_64, file_name: this.FILE_NAME };

      this.requestClass.createOne(obj, { afterPath: 'imagenes' }).then((res) => {
        console.log('res ', res);
      });
    } else fun.toastError('Debe de seleccionar una foto primero', 'ERROR');
  }

  onFileChange(ev) {
    const files = ev.target.files;
    const reader = new FileReader();
    const file = files[0];

    if (files && files.length > 0) {
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        const base64 = reader.result.toString().split(',')[1];
        this.FILE_NAME = files[0].name;
        this.BASE_64 = base64;
        this.src_img = `data:image/png;base64,${base64}`;

        const data = { fileName: this.FILE_NAME, base_64: this.BASE_64, src_img: this.src_img, id: this.id };
        this.getPhotoData.emit(data);
      };
    }
  }
}
