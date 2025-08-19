import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { EmpleadoC } from '@admin/registros/registro-empleados/empleado';
import { ModalI } from '../../modal/modal-class';
import { IDynamicModal } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  standalone: false,
})
export class ChangePasswordComponent extends MixinClass implements OnInit, AfterViewInit, IDynamicModal {
  form: UntypedFormGroup;
  element: HTMLElement;
  empleadoClass = new EmpleadoC();
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() empleado!: any;

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

  submit() {
    const objTemp = this.form.value;

    if (fun.isEmpty(objTemp.password)) {
      fun.toastError('Contraseña no puede estar vacia !!!', 'ERROR');
    } else {
      const ids_roles = this.empleado.roles.map(rol => rol.id);
      const obj = fun.omit(this.empleado, ['', 'uid', 'sign_in_count', 'created_at', 'updated_at', 'documento_identidad', 'nombre_completo', 'roles']);

      obj['password'] = objTemp.password;
      obj['ids_roles'] = ids_roles;

      this.empleadoClass.createUpdateOne(obj).then(() => {
        this.modalConfig.close({ error: false });
      });
    }
  }
}
