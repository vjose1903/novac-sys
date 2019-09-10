import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { UsuariosI } from '../models/usuario.model';

// ===========================================================================
// PARA MOSTRAR EL LOADING
// ===========================================================================
export const showLoadin = new BehaviorSubject<boolean>(false);

// ===========================================================================
// PARA MOSTRAR MODAL DE INICIAR SESION
// ===========================================================================
export const showModalHome = new BehaviorSubject<boolean>(false);

// ===========================================================================
// PARA LOS DATOS DE SESIONAMIENTO
// ===========================================================================
export const profile = new BehaviorSubject<UsuariosI>({
  _id: ' ',
  nombre: ' ',
  apellido: ' ',
  sexo: ' ',
  fotoPerfil: ' ',
  usuario: ' ',
  telefono: ' ',
  email: ' ',
  fechaN: ' ',
  password: ' ',
  estado: true,
  role: ' ',
});
