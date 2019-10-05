import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { UsuariosI } from '../models/usuario.model';

export class FORMATEAR {
  formatearNumero(nStr) {
    if (nStr !== undefined) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }
}

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
