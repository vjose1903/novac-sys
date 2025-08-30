# FormErrorMsgComponent

Componente para mostrar mensajes de error de formularios reactivos de Angular que funciona tanto con elementos HTML nativos como con componentes de PrimeNG.

## Características

- ✅ **Elementos HTML nativos** (`input`, `select`, `textarea`)
- ✅ **Componentes PrimeNG** (`p-inputMask`, `p-inputNumber`, `p-select`, `p-datepicker`)
- ✅ **Gestión automática de estados** (`touched`, `dirty`)
- ✅ **Event listeners automáticos** (blur, focus, input, change)
- ✅ **Mensajes de error personalizables**
- ✅ **Standalone component** (no requiere módulo)

## Uso Básico

### Con Input HTML nativo
```html
<input 
  #inputNombre
  type="text" 
  formControlName="nombre" 
  class="form-control" />
<form-error-msg 
  [control]="form.get('nombre')" 
  [fieldElement]="inputNombre">
</form-error-msg>
```

### Con Select HTML nativo
```html
<select 
  #selectSexo
  formControlName="sexo" 
  class="form-control">
  <option value="">Seleccionar...</option>
  <option value="M">Masculino</option>
  <option value="F">Femenino</option>
</select>
<form-error-msg 
  [control]="form.get('sexo')" 
  [fieldElement]="selectSexo">
</form-error-msg>
```

## Uso con PrimeNG

### Con p-inputMask
```html
<p-inputMask
  #inputCedula
  mask="999-9999999-9"
  formControlName="cedula"
  placeholder="___-_______-_">
</p-inputMask>
<form-error-msg 
  [control]="form.get('cedula')" 
  [fieldElement]="inputCedula">
</form-error-msg>
```

### Con p-inputNumber
```html
<p-inputNumber
  #inputPrecio
  formControlName="precio"
  mode="currency"
  currency="USD">
</p-inputNumber>
<form-error-msg 
  [control]="form.get('precio')" 
  [fieldElement]="inputPrecio">
</form-error-msg>
```

### Con p-select (Dropdown)
```html
<p-select
  #selectEstado
  [options]="estados"
  formControlName="estado"
  optionLabel="nombre"
  optionValue="id">
</p-select>
<form-error-msg 
  [control]="form.get('estado')" 
  [fieldElement]="selectEstado">
</form-error-msg>
```

### Con p-datepicker (Calendar)
```html
<p-datepicker
  #inputFecha
  formControlName="fecha_nacimiento"
  dateFormat="dd/mm/yy">
</p-datepicker>
<form-error-msg 
  [control]="form.get('fecha_nacimiento')" 
  [fieldElement]="inputFecha">
</form-error-msg>
```

## Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `control` | `AbstractControl` | ✅ | El FormControl del formulario reactivo |
| `fieldElement` | `ElementRef \| HTMLElement \| PrimeNGComponent` | ✅ | Referencia template al elemento del formulario |
| `fieldName` | `string` | ❌ | Nombre personalizado para mensajes de error |

## Mensajes de Error Predefinidos

El componente incluye mensajes en español para los siguientes validadores:

- `required`: "Este campo es requerido."
- `minlength`: "Cant. mínima de letras es: {requiredLength}."
- `max`: "Valor maximo requerido es: {max} - actualmente tiene: {actual}."
- `min`: "Valor mínimo requerido es: {min} - actualmente tiene: {actual}."
- `ip`: "Intoduzca una ip valida."
- `compares`: "Las contraseñas no coinciden."
- `invalidCedula`: "Ingrese una cédula válida."
- `email`: "Ingrese una email válido."
- `sinRayas`: "Complete el campo: {fieldName}"

## Funcionamiento Interno

### Detección de Componentes PrimeNG
El componente detecta automáticamente si el elemento es un componente de PrimeNG y accede al elemento HTML interno:

```typescript
// Para InputMask
component.el.nativeElement.querySelector('input')

// Para InputNumber
component.el.nativeElement.querySelector('input')

// Para Select
component.el.nativeElement.querySelector('div[role="combobox"]')

// Para DatePicker
component.el.nativeElement.querySelector('input')
```

### Event Listeners Automáticos
- **blur**: Marca el campo como `touched` y verifica errores
- **focus**: Opcionalmente oculta errores
- **input**: Marca el campo como `dirty` y verifica errores (solo para inputs)
- **change**: Para selects y elementos clickeables

### Gestión de Estados
El componente actualiza automáticamente los estados de Angular Forms:
- `markAsTouched()` en blur y click
- `markAsDirty()` en input y change

## Ejemplo Completo

```typescript
// component.ts
export class MiFormularioComponent {
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    sexo: ['', Validators.required]
  });

  constructor(private fb: FormBuilder) {}
}
```

```html
<!-- component.html -->
<form [formGroup]="form">
  <!-- Input nativo -->
  <input #inputNombre type="text" formControlName="nombre" />
  <form-error-msg [control]="form.get('nombre')" [fieldElement]="inputNombre"></form-error-msg>

  <!-- PrimeNG InputMask -->
  <p-inputMask #inputTelefono mask="(999) 999-9999" formControlName="telefono"></p-inputMask>
  <form-error-msg [control]="form.get('telefono')" [fieldElement]="inputTelefono"></form-error-msg>

  <!-- Select nativo -->
  <select #selectSexo formControlName="sexo">
    <option value="">Seleccionar...</option>
    <option value="M">Masculino</option>
    <option value="F">Femenino</option>
  </select>
  <form-error-msg [control]="form.get('sexo')" [fieldElement]="selectSexo"></form-error-msg>
</form>
```

## Migración desde Directiva Antigua

### Antes (con directiva appMsgError)
```html
<div [appMsgError]="'nombre'" [form]="form">
  <input formControlName="nombre" />
  <span id="msgContainer_nombre"></span>
</div>
```

### Después (con form-error-msg)
```html
<input #inputNombre formControlName="nombre" />
<form-error-msg [control]="form.get('nombre')" [fieldElement]="inputNombre"></form-error-msg>
```

## Ventajas

1. **Más explícito**: Control directo sobre qué errores mostrar
2. **Compatible con PrimeNG**: Funciona automáticamente con componentes de PrimeNG
3. **Mejor rendimiento**: No requiere querySelector DOM
4. **Type-safe**: TypeScript detecta errores de tipo
5. **Reutilizable**: Un solo componente para todos los casos
6. **Mantenible**: Lógica centralizada en un solo lugar 