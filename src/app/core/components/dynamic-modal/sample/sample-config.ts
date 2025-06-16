import { DynamicModalClass } from '../config/dynamic-modal.class';
import { ICallbackModal } from '../config/dynamic-modal.interface';
import { SampleComponentModalComponent } from './sample-component-modal/sample-component-modal.component';

// MODAL CON UN HTML EN EL CONTENIDO ---------------------------------------------
function openModalHtml() {
  const modalComunication = (args: ICallbackModal) => {
    ////console.log(args);
  };

  const testModal = new DynamicModalClass();

  testModal.id = 'testModal';
  testModal.header = 'Modal de prueba HTML';
  testModal.html = '<h1> Esto es un h1 </h1> <br/> <p> Esto es un p </p> <br/> <strong> Esto es un strong </strong>';

  testModal.botones = [{ id: 'cerrar', label: 'Cerrar', clase: 'btn-danger', function: () => testModal.close() }];

  testModal.setCallback(modalComunication);
  testModal.show();
}

// MODAL CON UN COMPONENTE EN EL CONTENIDO ---------------------------------------------
function openModalComponent() {
  const modalComunication = (args: ICallbackModal) => {
    ////console.log(args);
  };

  const testModal = new DynamicModalClass();

  testModal.id = 'testModal';
  testModal.inputs = { propiedad: 'Esta es una propiedad pasada por parametros' };
  testModal.header = 'Modal de prueba Componente';
  testModal.component = SampleComponentModalComponent;
  testModal.comfirmToClose = true;

  testModal.botones = [
    { id: 'cerrarBtn', label: 'Cerrar', clase: 'btn-danger', function: () => testModal.close() },
    { id: 'aceptarBtn', label: 'Aceptar', clase: 'btn-success' }, // Si no se le especifica function o functionInOtherComponent se pone por defecto functionInOtherComponent = 'submit'
  ];

  testModal.setCallback(modalComunication);
  testModal.show();
}
