import { Component } from '@angular/core';
import { IDynamicModal, IModalComponent } from '../../config/dynamic-modal.interface';

@Component({
  selector: 'app-sample-component-modal',
  templateUrl: './sample-component-modal.component.html',
  styleUrls: ['./sample-component-modal.component.scss'],
})
export class SampleComponentModalComponent implements IDynamicModal {
  inputs!: { propiedad: string };
  modalComponent!: IModalComponent;
  modalConfig: any;
  modalWrapper: any;

  submit() {
    ////console.log('toco el boton submit');
  }

  showConfirmAlert() {
    // Aqui se deben validar las condiciones para mostrar o no el aviso de salir sin guardar
    return true;
  }
}
