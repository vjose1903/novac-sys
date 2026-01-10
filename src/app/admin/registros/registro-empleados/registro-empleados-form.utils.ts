import { Signal } from '@angular/core';
import { createSignalForm, SignalFormInstance, required, email, minLength, disabled } from '@core/services/signal-form';
import { customValidators } from '@core/typescript/custom-validators';

// ========== INTERFACES ==========

export interface EmpleadoFormModel {
  id: number | null;
  nombre: string | null;
  apellido: string | null;
  usuario: string | null;
  sexo: string | null;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: Date | null;
  password: string | null;
  confirm_password: string | null;
  ids_roles: number[] | null;
}

// ========== VALORES POR DEFECTO ==========

export const empleadoFormDefaults: EmpleadoFormModel = {
  id: null,
  nombre: null,
  apellido: null,
  usuario: null,
  sexo: null,
  cedula: null,
  telefono: null,
  email: null,
  fecha_nacimiento: null,
  password: null,
  confirm_password: null,
  ids_roles: null,
};

// ========== BUILDER DEL FORMULARIO ==========

interface CreateEmpleadoFormOptions {
  initialData?: Partial<EmpleadoFormModel>;
  disabledSignal?: Signal<boolean>;
}

export function createEmpleadoForm(options?: CreateEmpleadoFormOptions): SignalFormInstance<EmpleadoFormModel> {
  const defaults = { ...empleadoFormDefaults, ...options?.initialData };
  const isDisabled = options?.disabledSignal;

  return createSignalForm<EmpleadoFormModel>(defaults, schema => {
    // Validaciones usando API nativa de Angular
    required(schema.nombre);
    minLength(schema.nombre, 3);

    required(schema.apellido);
    minLength(schema.apellido, 3);

    required(schema.usuario);

    required(schema.sexo);

    required(schema.cedula);
    customValidators.signalCedulaValidator(schema.cedula);

    required(schema.telefono);

    required(schema.email);
    email(schema.email);

    required(schema.fecha_nacimiento);

    required(schema.ids_roles);

    // Aplicar disabled si se proporcionó el signal
    if (isDisabled) {
      disabled(schema.nombre, isDisabled);
      disabled(schema.apellido, isDisabled);
      disabled(schema.usuario, isDisabled);
      disabled(schema.sexo, isDisabled);
      disabled(schema.telefono, isDisabled);
      disabled(schema.email, isDisabled);
      disabled(schema.fecha_nacimiento, isDisabled);
      disabled(schema.password, isDisabled);
      disabled(schema.confirm_password, isDisabled);
      disabled(schema.ids_roles, isDisabled);
    }
  });
}

// ========== HELPERS ==========

export function getFormPickValues(): (keyof EmpleadoFormModel)[] {
  return ['id', 'cedula', 'nombre', 'apellido', 'usuario', 'sexo', 'telefono', 'email', 'fecha_nacimiento', 'password', 'confirm_password', 'ids_roles'];
}
