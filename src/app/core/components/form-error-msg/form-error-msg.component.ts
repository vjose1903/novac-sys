import { Component, Input, OnDestroy, OnInit, ElementRef, ChangeDetectionStrategy, signal, computed, DestroyRef, inject, effect } from '@angular/core';
import { AbstractControl, TouchedChangeEvent } from '@angular/forms';
import { FieldState } from '@angular/forms/signals';
import { fromEvent, merge } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { InputMask } from 'primeng/inputmask';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MultiSelect } from 'primeng/multiselect';
import { AutoComplete } from 'primeng/autocomplete';
import { fun } from '@core/services/functions.service';

type PrimeNGComponent = InputMask | InputNumber | Select | DatePicker | MultiSelect | AutoComplete;
type FieldElement = ElementRef<HTMLInputElement> | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | PrimeNGComponent;

const COMPONENT_SELECTORS = new Map<abstract new (...args: any[]) => PrimeNGComponent, string[]>([
  [InputMask, ['input']],
  [InputNumber, ['input']],
  [Select, ['.p-select-label']],
  [MultiSelect, ['input', '[role="combobox"]']],
  [DatePicker, ['input.p-inputtext', 'input']],
  [AutoComplete, ['input']],
]);

@Component({
  selector: 'form-error-msg',
  imports: [],
  template: `
    @if (showError()) {
      <div class="error-message">{{ errorMessage() }}</div>
    }
  `,
  styles: `
    .error-message {
      color: #e74c3c;
      font-size: 12px;
      margin-top: 0.05rem;
      position: absolute;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorMsgComponent implements OnInit, OnDestroy {
  /** Control de Reactive Forms (deprecated, usar fieldState) */
  @Input() control?: AbstractControl | null;

  /** FieldState de Signal Forms (nueva API) */
  @Input() fieldState?: FieldState<any> | null;

  @Input() fieldName?: string;
  @Input() fieldElement?: FieldElement;

  private readonly destroyRef = inject(DestroyRef);
  private mutationObserver?: MutationObserver;
  private isSignalForms = false;

  // Signals para estado reactivo (Reactive Forms)
  private readonly controlState = signal<{ invalid: boolean; dirty: boolean; touched: boolean; errors: any }>({
    invalid: false,
    dirty: false,
    touched: false,
    errors: null,
  });

  // Computed signals para derivar valores
  readonly showError = computed(() => {
    // Si es Signal Forms, usar directamente los signals del FieldState
    if (this.isSignalForms && this.fieldState) {
      const invalid = !this.fieldState.valid();
      const dirty = this.fieldState.dirty();
      const touched = this.fieldState.touched();
      const value = this.fieldState.value();
      // Mostrar error si: (dirty o touched) O (tiene valor y es inválido por validación custom)
      const hasValue = value !== null && value !== undefined && value !== '';
      const shouldShow = invalid && (dirty || touched || hasValue);
      return shouldShow;
    }

    // Reactive Forms
    const state = this.controlState();
    return state.invalid && (state.dirty || state.touched);
  });

  readonly errorMessage = computed(() => {
    const show = this.showError();
    // console.log('📝 errorMessage - showError:', show);
    if (!show) return '';

    let errors: any;

    // Obtener errores según el tipo
    if (this.isSignalForms && this.fieldState) {
      errors = this.fieldState.errors();
    } else {
      errors = this.controlState().errors;
    }

    // console.log('📝 errorMessage - errors:', JSON.stringify(errors));
    if (!errors) return '';

    // Si es un array de errores (Signal Forms)
    if (Array.isArray(errors)) {
      const firstError = errors[0];
      // console.log('📝 errorMessage - firstError:', JSON.stringify(firstError));
      if (firstError?.message) return firstError.message;
      // Signal Forms usa 'kind', Reactive Forms usa 'type'
      const errorKey = firstError?.kind || firstError?.type;
      if (errorKey) {
        const errorMessageFn = this.ERROR_MESSAGES[errorKey];
        if (typeof errorMessageFn === 'function') return errorMessageFn(firstError);
        return errorMessageFn || `Error en el campo: ${errorKey}`;
      }
      return 'Error de validación';
    }

    // Formato de errores de Reactive Forms (objeto)
    const firstErrorKey = Object.keys(errors)[0];
    const errorValue = errors[firstErrorKey];
    const errorMessageFn = this.ERROR_MESSAGES[firstErrorKey];

    if (typeof errorMessageFn === 'function') return errorMessageFn(errorValue);
    return errorMessageFn || `Error en el campo: ${firstErrorKey}`;
  });

  private readonly ERROR_MESSAGES: Record<string, string | ((error: any) => string)> = {
    required: 'Este campo es requerido.',
    // Reactive Forms (lowercase)
    minlength: (error: any) => `Cant. mínima de letras es: ${error.requiredLength || error.minLength}.`,
    maxlength: (error: any) => `Máximo ${error.requiredLength || error.maxLength} caracteres.`,
    // Signal Forms (camelCase)
    minLength: (error: any) => `Cant. mínima de letras es: ${error.requiredLength || error.minLength}.`,
    maxLength: (error: any) => `Máximo ${error.requiredLength || error.maxLength} caracteres.`,
    max: (error: any) => `Valor maximo requerido es: ${error.max} - actualmente tiene: ${error.actual}.`,
    min: (error: any) => `Valor mínimo requerido es: ${error.min} - actualmente tiene: ${error.actual}.`,
    ip: 'Intoduzca una ip valida.',
    compares: 'Las contraseñas no coinciden.',
    invalidCedula: 'Ingrese una cédula válida.',
    email: 'Ingrese una email válido.',
    sinRayas: () => `Complete el campo: ${this.fieldName || 'este campo'}`,
    pattern: 'Formato inválido.',
  };

  async ngOnInit(): Promise<void> {
    // Detectar si se usa Signal Forms
    this.isSignalForms = !!this.fieldState;

    // Para Signal Forms, no necesitamos configuración adicional
    // los signals se actualizan automáticamente
    if (this.isSignalForms) return;

    // Reactive Forms legacy
    if (!this.control) return;

    if (this.fieldElement) {
      await this.setupEventListeners();
    } else {
      this.setupTouchedListener();
    }

    this.setupControlListeners();
    this.updateControlState();
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }

  private updateControlState(): void {
    if (!this.control) return;

    this.controlState.set({
      invalid: this.control.invalid,
      dirty: this.control.dirty,
      touched: this.control.touched,
      errors: this.control.errors,
    });
  }

  private setupControlListeners(): void {
    if (!this.control) return;

    merge(this.control.valueChanges, this.control.statusChanges)
      .pipe(debounceTime(10), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateControlState());
  }

  private setupTouchedListener(): void {
    if (!this.control) return;

    this.control.events
      .pipe(
        filter((event): event is TouchedChangeEvent => event instanceof TouchedChangeEvent),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.updateControlState());
  }

  private async setupEventListeners(): Promise<void> {
    try {
      const htmlElement = await this.getHTMLElement();
      if (htmlElement) this.setupHTMLEvents(htmlElement);
    } catch (error) {
      console.error('❌ Error al configurar event listeners:', error);
    }
  }

  private async getHTMLElement(): Promise<HTMLElement | null> {
    if (!this.fieldElement) return null;
    if (this.fieldElement instanceof ElementRef) return this.fieldElement.nativeElement;
    if (this.fieldElement instanceof HTMLElement) return this.fieldElement;
    if (this.isPrimeNGComponent(this.fieldElement)) return this.getPrimeNGElement(this.fieldElement);
    return null;
  }

  private isPrimeNGComponent(element: any): element is PrimeNGComponent {
    return element && typeof element === 'object' && (element instanceof InputMask || element instanceof InputNumber || element instanceof Select || element instanceof DatePicker || element instanceof MultiSelect || element instanceof AutoComplete);
  }

  private async getPrimeNGElement(component: PrimeNGComponent): Promise<HTMLElement | null> {
    const rootElement = component.el?.nativeElement ?? (component as any).container?.nativeElement ?? (component as any).elementRef?.nativeElement;
    if (!rootElement) return null;

    const selectors = this.getComponentSelectors(component);
    if (selectors.length === 0) return rootElement;

    const foundElement = await this.waitForElement(rootElement, selectors);
    return foundElement ?? rootElement;
  }

  private getComponentSelectors(component: PrimeNGComponent): string[] {
    for (const [Constructor, selectors] of COMPONENT_SELECTORS) {
      if (component instanceof Constructor) return selectors;
    }
    return [];
  }

  private setupHTMLEvents(element: HTMLElement): void {
    fromEvent(element, 'blur')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.control!.markAsTouched();
        this.updateControlState();
      });

    if (this.isInputElement(element)) {
      this.subscribeToTouchedCheck(element, 'input');
    }

    if (!this.isSelectLikeElement(element)) return;

    merge(fromEvent(element, 'change'), fromEvent(element, 'click'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.control!.touched) this.updateControlState();
      });

    if (this.isMultiSelectElement(element)) {
      this.setupMultiSelectEvents(element);
    }
  }

  private subscribeToTouchedCheck(element: HTMLElement, eventType: string): void {
    fromEvent(element, eventType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.control!.touched) this.updateControlState();
      });
  }

  private isInputElement(element: HTMLElement): boolean {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  }

  private isSelectLikeElement(element: HTMLElement): boolean {
    const { tagName, classList } = element;
    return tagName === 'SELECT' || element.getAttribute('role') === 'combobox' || classList.contains('p-multiselect') || classList.contains('p-multiselect-label') || classList.contains('p-select') || classList.contains('p-autocomplete');
  }

  private isMultiSelectElement(element: HTMLElement): boolean {
    return element.classList.contains('p-multiselect') || element.classList.contains('p-multiselect-label');
  }

  private setupMultiSelectEvents(element: HTMLElement): void {
    fromEvent(element, 'focusout')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.control!.markAsTouched();
        this.updateControlState();
      });

    fromEvent(element, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.control!.touched) this.updateControlState();
      });

    this.setupAriaExpandedObserver(element);
  }

  private setupAriaExpandedObserver(element: HTMLElement): void {
    this.mutationObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type !== 'attributes' || mutation.attributeName !== 'aria-expanded') continue;

        const target = mutation.target as HTMLElement;
        if (target.getAttribute('aria-expanded') === 'true') continue;

        this.control!.markAsTouched();
        fun.setTimeout(() => this.updateControlState(), 10);
      }
    });

    this.mutationObserver.observe(element, { attributes: true, attributeFilter: ['aria-expanded'] });
  }

  private waitForElement(parentElement: HTMLElement, selectors: string[], maxAttempts = 5, delay = 20): Promise<HTMLElement | null> {
    return new Promise(resolve => {
      let attempts = 0;

      const checkForElement = (): void => {
        attempts++;

        for (const selector of selectors) {
          const element = parentElement.querySelector<HTMLElement>(selector);
          if (element) {
            resolve(element);
            return;
          }
        }

        if (attempts >= maxAttempts) {
          resolve(null);
          return;
        }

        fun.setTimeout(checkForElement, delay);
      };

      checkForElement();
    });
  }
}
