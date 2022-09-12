import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PhotosAdminI, PhotosI } from '../models/photos';
@Injectable({
  providedIn: 'root',
})
export class PhotosService {
  arrayImagenes: PhotosI[] = [];
  readonly urlApi = 'http://localhost:9091/api/photos';

  constructor(private http: HttpClient) {}

  uploadFile(formData: any, photo: PhotosAdminI) {
    return this.http.post(this.urlApi + `/subir/${photo.nombre}/${photo.uso}`, formData);
  }

  getAdminphotos() {
    return this.http.get(this.urlApi);
  }

  updatePhoto(formData: any, photo: PhotosAdminI, id: any) {
    return this.http.put(this.urlApi + `/udt/${id}/${photo.nombre}/${photo.uso}`, formData);
  }
  updateDataPhoto(formData: any, photo: PhotosAdminI, id: any) {
    return this.http.put(this.urlApi + `/udtData/${id}/${photo.nombre}/${photo.uso}`, formData);
  }

  getIdphoto(photo: any) {
    return this.http.get(this.urlApi + `/dataID/${photo}`);
  }
  getDataphoto(photo: any) {
    return this.http.get(this.urlApi + `/data/${photo}`);
  }

  deletePhoto(photo: any) {
    return this.http.delete(this.urlApi + `/borrar/${photo}`);
  }

  deletePhotoAndData(photo: any, id: any) {
    return this.http.delete(this.urlApi + `/borrar/${photo}/${id}`);
  }
}
