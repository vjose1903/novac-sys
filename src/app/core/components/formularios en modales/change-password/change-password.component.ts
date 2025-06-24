import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { EmpleadoC } from '@admin/registros/registro-empleados/empleado';
import { ModalI } from '../../modal/modal-class';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  standalone: false,
})
export class ChangePasswordComponent extends MixinClass implements OnInit, AfterViewInit, ModalI {
  form: UntypedFormGroup;
  element: HTMLElement;
  empleadoClass = new EmpleadoC();
  @Input() modalWrapper: any = {};
  inputs: any;

  constructor(private fb: UntypedFormBuilder) {
    super();
  }

  ngOnInit() {
    this.form = this.fb.group({
      password: [null, Validators.minLength(6)],
      confirmPassword: [null, Validators.minLength(6)],
    });
  }
  ngAfterViewInit() {
    fun.setTimeout(() => fun.enfocarInput('pass'), 50);
  }

  btn_aceptar() {
    const objTemp = this.form.value;

    if (objTemp.password === null) {
      fun.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      const ids_roles = this.inputs.roles.map(rol => rol.id);
      const obj = fun.omit(this.inputs, ['', 'uid', 'sign_in_count', 'created_at', 'updated_at', 'documento_identidad', 'nombre_completo', 'roles']);

      obj['password'] = objTemp.password;
      obj['ids_roles'] = ids_roles;

      this.empleadoClass.createUpdateOne(obj).then(() => {
        const modal = this.modalWrapper.instance.modalsConfig.find(config => config.id === this.modalWrapper.component_id);
        modal.closeModal(this.modalWrapper.component_id);
        modal.returnDataFromModal({ error: false });
      });
    }
  }
}
