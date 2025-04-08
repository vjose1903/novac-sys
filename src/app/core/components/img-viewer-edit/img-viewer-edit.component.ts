import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

import { PhotoDataI } from './img-viewer-edit.utils';

@Component({
  selector: 'img-viewer-edit',
  templateUrl: './img-viewer-edit.component.html',
  styleUrls: ['./img-viewer-edit.component.scss'],
  standalone: false,
})
export class ImgViewerEdit implements OnInit {
  nameFile = '';
  fotoActual: string;
  uploadedFile;
  BASE_64;
  FILE_NAME;

  @Input() src_img;
  @Input() id;
  @Output() getPhotoData = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  borrar(event?) {
    [this.src_img, this.BASE_64, this.FILE_NAME] = Array(3).fill(null);

    this.emitChanges();
  }

  onFileChange(ev) {
    const files = ev.target.files;
    const reader = new FileReader();
    const file = files[0];

    if (files && files.length > 0) {
      reader.readAsDataURL(file);

      reader.onload = e => {
        if (!reader.result) return;

        const base64 = reader.result.toString().split(',')[1];

        const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');

        this.FILE_NAME = fileNameWithoutExtension;
        this.BASE_64 = base64;
        this.src_img = `data:image/png;base64,${base64}`;
        this.emitChanges();
      };
    }
  }

  emitChanges() {
    const data = { fileName: this.FILE_NAME, base_64: this.BASE_64, src_img: this.src_img, id: this.id };
    this.getPhotoData.emit(data);
  }
}
