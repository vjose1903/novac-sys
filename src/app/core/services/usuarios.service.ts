import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject } from 'rxjs';
import { UsuariosI } from '../models/usuario.model';
import { JwtResponsesI } from '../models/jwt-responses';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  selectedUsuario: UsuariosI;
  profile: UsuariosI;
  array_Usuarios: UsuariosI[] = [];
  readonly URL_API = 'http://localhost:3000/api/usuarios';

  noAuthHeader = { headers: new HttpHeaders({ NoAuth: 'true' }) };

  constructor(private http: HttpClient) {
    this.selectedUsuario = new UsuariosI();
    this.profile = new UsuariosI();
  }

  getUsuarios() {
    return this.http.get(this.URL_API);
  }

  getUser(id: String) {
    return this.http.get(this.URL_API + `/${id}`);
  }

  countUsuarios() {
    return this.http.get(this.URL_API + '/cant');
  }

  register(Usuario: UsuariosI) {
    return this.http.post(this.URL_API + '/register', Usuario);
  }

  login(Usuario: UsuariosI) {
    return this.http.post<JwtResponsesI>(this.URL_API + '/authenticate', Usuario);
  }
  getUserProfile() {
    return this.http.get(this.URL_API + '/userProfile');
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  deleteToken() {
    localStorage.removeItem('token');
  }

  getUserPayload() {
    const token = this.getToken();
    if (token) {
      const userPayload = atob(token.split('.')[1]);
      return JSON.parse(userPayload);
    } else {
      return null;
    }
  }

  isLoggedIn() {
    const userPayload = this.getUserPayload();
    if (userPayload) {
      return userPayload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  }

  isLoggedIn2() {
    const userPayload = this.getUserPayload();
    if (userPayload) {
      return true;
    } else {
      return false;
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  updateUsuario(Usuario: UsuariosI) {
    return this.http.put(this.URL_API + `/edit/${Usuario._id}`, Usuario);
  }
  updatePass(Usuario: UsuariosI) {
    return this.http.put(this.URL_API + `/editP/${Usuario._id}`, Usuario);
  }

  deleteUsuario(Usuario: UsuariosI) {
    return this.http.put(this.URL_API + `/eliminar/${Usuario._id}`, Usuario);
  }
}
