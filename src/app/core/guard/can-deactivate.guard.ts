import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { DynamicModalClass } from '../components/dynamic-modal/config/dynamic-modal.class';

export interface CanComponentDeactivate {
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean;
  getDeactivateMessage?(): string;
  getDeactivateOptions?(): {
    showCancelButton?: boolean;
    showNoButton?: boolean;
    cancelText?: string;
    noText?: string;
    yesText?: string;
    header?: string;
    width?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CanDeactivateGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    // Si el componente no implementa la interfaz, permitir la navegación
    if (!component.canDeactivate) return true;

    const result = component.canDeactivate();

    // Si es un boolean, retornarlo directamente
    if (typeof result === 'boolean') return result;

    // Si es una Promise u Observable, manejarla
    if (result instanceof Promise) {
      return result;
    }

    if (result instanceof Observable) {
      return result;
    }

    return true;
  }

  /**
   * Muestra un modal de confirmación dinámico con funciones personalizadas
   */
  static showConfirmationModal(
    message: string,
    options?: {
      showCancelButton?: boolean;
      showNoButton?: boolean;
      cancelText?: string;
      noText?: string;
      yesText?: string;
      header?: string;
      width?: string;
      onCancel?: () => void | Promise<void>;
      onNo?: () => void | Promise<void>;
      onYes?: () => void | Promise<void>;
    }
  ): Promise<boolean> {
    return new Promise(resolve => {
      const modal = new DynamicModalClass();

      modal.id = 'can-deactivate-confirmation';
      modal.header = options?.header || 'Confirmación';
      modal.width = options?.width || '30rem';
      modal.html = `<p>${message}</p>`;

      const botones = [];

      // Botón Cancelar (opcional)
      if (options?.showCancelButton !== false) {
        botones.push({
          id: 'cancelBtn',
          label: options?.cancelText || 'Cancelar',
          clase: 'btn btn-blanco',
          function: async () => {
            if (options?.onCancel) {
              await options.onCancel();
            }
            modal.close();
            resolve(false);
          },
        });
      }

      // Botón No (opcional)
      if (options?.showNoButton !== false) {
        botones.push({
          id: 'noBtn',
          label: options?.noText || 'No',
          clase: 'btn btn-blanco w-9',
          function: async () => {
            if (options?.onNo) {
              await options.onNo();
            }
            modal.close();
            resolve(true);
          },
        });
      }

      // Botón Si (siempre presente)
      botones.push({
        id: 'yesBtn',
        label: options?.yesText || 'Si',
        clase: 'btn btn-verde w-9',
        function: async () => {
          if (options?.onYes) {
            await options.onYes();
          }
          modal.close();
          resolve(true);
          },
      });

      modal.botones = botones;
      modal.show();
    });
  }
}
