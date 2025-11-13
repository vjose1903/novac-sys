import { Component, Input, OnDestroy, OnInit, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { InputMask } from 'primeng/inputmask';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MultiSelect } from 'primeng/multiselect';
import { AutoComplete } from 'primeng/autocomplete';
import { Ss } from '@core/services/singleton.service';
import { fun } from '@core/services/functions.service';

type PrimeNGComponent = InputMask | InputNumber | Select | DatePicker | MultiSelect | AutoComplete;
type FieldElement = ElementRef<HTMLInputElement> | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | PrimeNGComponent;

@Component({
  selector: 'form-error-msg',
  imports: [],
  template: `
    @if (showError) {
      <div class="error-message">{{ errorMessage }}</div>
    }
  `,
  styles: [
    `
      .error-message {
        color: #e74c3c;
        font-size: 12px;
        margin-top: 0.05rem;
        position: absolute;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorMsgComponent implements OnInit, OnDestroy {
  @Input() control?: AbstractControl | null;
  @Input() fieldName?: string; // Para mensajes personalizados
  @Input() fieldElement?: FieldElement;

  private readonly destroy$ = new Subject<void>();
  private mutationObserver?: MutationObserver;
  errorMessage: string = '';
  showError: boolean = false;

  private readonly ERROR_MESSAGES: Record<string, string | ((error: any) => string)> = {
    required: 'Este campo es requerido.',
    minlength: (error: any) => `Cant. mínima de letras es: ${error.requiredLength}.`,
    max: (error: any) => `Valor maximo requerido es: ${error.max} - actualmente tiene: ${error.actual}.`,
    min: (error: any) => `Valor mínimo requerido es: ${error.min} - actualmente tiene: ${error.actual}.`,
    ip: 'Intoduzca una ip valida.',
    compares: 'Las contraseñas no coinciden.',
    invalidCedula: 'Ingrese una cédula válida.',
    email: 'Ingrese una email válido.',
    sinRayas: () => `Complete el campo: ${this.fieldName || 'este campo'}`,
    pattern: 'Formato inválido.',
    maxlength: (error: any) => `Máximo ${error.requiredLength} caracteres.`,
  };

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    if (!this.control) return;

    // Configurar listeners de eventos del DOM si hay fieldElement
    if (this.fieldElement) {
      await this.setupEventListeners();
    }

    // Configurar listeners de cambios del control
    this.setupControlListeners();

    // Verificación inicial
    this.checkErrors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mutationObserver?.disconnect();
  }

  private setupControlListeners(): void {
    if (!this.control) return;

    // Combinar valueChanges y statusChanges con debounce para evitar múltiples verificaciones
    merge(this.control.valueChanges, this.control.statusChanges)
      .pipe(debounceTime(10), takeUntil(this.destroy$))
      .subscribe(() => this.checkErrors());
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

    // ElementRef
    if (this.fieldElement instanceof ElementRef) return this.fieldElement.nativeElement;

    // HTMLElement nativo
    if (this.fieldElement instanceof HTMLElement) return this.fieldElement;

    // Componente PrimeNG
    if (this.isPrimeNGComponent(this.fieldElement)) return this.getPrimeNGElement(this.fieldElement);

    return null;
  }

  private isPrimeNGComponent(element: any): element is PrimeNGComponent {
    return element && typeof element === 'object' && (element instanceof InputMask || element instanceof InputNumber || element instanceof Select || element instanceof DatePicker || element instanceof MultiSelect || element instanceof AutoComplete);
  }

  private async getPrimeNGElement(component: PrimeNGComponent): Promise<HTMLElement | null> {
    let rootElement: HTMLElement | null = null;

    // Intentar acceder al elemento nativo de diferentes formas según el componente
    if (component.el) {
      rootElement = component.el.nativeElement;
    } else if ((component as any).container) {
      rootElement = (component as any).container.nativeElement;
    } else if ((component as any).elementRef) {
      rootElement = (component as any).elementRef.nativeElement;
    }

    if (!rootElement) return null;

    // Configuración específica por tipo de componente
    const componentConfig = this.getComponentConfig(component);

    if (componentConfig.selectors.length > 0) {
      const foundElement = await this.waitForElement(rootElement, componentConfig.selectors);
      if (foundElement) return foundElement;
    }

    return rootElement;
  }

  private getComponentConfig(component: PrimeNGComponent): { selectors: string[] } {
    if (component instanceof InputMask) return { selectors: ['input'] };

    if (component instanceof InputNumber) return { selectors: ['input'] };

    if (component instanceof Select) return { selectors: ['.p-select-label'] };

    if (component instanceof MultiSelect) return { selectors: ['input', '[role="combobox"]'] };

    if (component instanceof DatePicker) return { selectors: ['input.p-inputtext', 'input'] };

    if (component instanceof AutoComplete) return { selectors: ['input'] };

    return { selectors: [] };
  }

  private setupHTMLEvents(element: HTMLElement): void {
    // Evento blur: marca como touched y verifica errores
    fromEvent(element, 'blur')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.control!.markAsTouched();
        this.checkErrors();
      });

    // Eventos input: solo verifica errores si ya está touched
    if (this.isInputElement(element)) {
      this.subscribeToTouchedCheck(element, 'input');
    }

    // Eventos change y click: solo verifica errores si ya está touched
    if (this.isSelectLikeElement(element)) {
      merge(fromEvent(element, 'change'), fromEvent(element, 'click'))
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.control!.touched) this.checkErrors();
        });

      // Eventos específicos para MultiSelect
      if (this.isMultiSelectElement(element)) {
        this.setupMultiSelectEvents(element);
      }
    }
  }

  private subscribeToTouchedCheck(element: HTMLElement, eventType: string): void {
    fromEvent(element, eventType)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.control!.touched) this.checkErrors();
      });
  }

  private isInputElement(element: HTMLElement): boolean {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  }

  private isSelectLikeElement(element: HTMLElement): boolean {
    return (
      element.tagName === 'SELECT' ||
      element.getAttribute('role') === 'combobox' ||
      element.classList.contains('p-multiselect') ||
      element.classList.contains('p-multiselect-label') ||
      element.classList.contains('p-select') ||
      element.classList.contains('p-autocomplete')
    );
  }

  private isMultiSelectElement(element: HTMLElement): boolean {
    return element.classList.contains('p-multiselect') || element.classList.contains('p-multiselect-label');
  }

  private setupMultiSelectEvents(element: HTMLElement): void {
    // Evento focusout: marca como touched y verifica errores (similar a blur)
    fromEvent(element, 'focusout')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.control!.markAsTouched();
        this.checkErrors();
      });

    // Eventos de teclado: solo verifica errores si ya está touched
    fromEvent(element, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.control!.touched) this.checkErrors();
      });

    // Observer para cambios en aria-expanded (apertura/cierre del dropdown)
    this.setupAriaExpandedObserver(element);
  }

  private setupAriaExpandedObserver(element: HTMLElement): void {
    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
          const target = mutation.target as HTMLElement;
          const isExpanded = target.getAttribute('aria-expanded') === 'true';

          if (!isExpanded) {
            this.control!.markAsTouched();
            fun.setTimeout(() => this.checkErrors(), 10);
          }
        }
      });
    });

    this.mutationObserver.observe(element, { attributes: true, attributeFilter: ['aria-expanded'] });
  }

  private waitForElement(parentElement: HTMLElement, selectors: string[], maxAttempts: number = 5, delay: number = 20): Promise<HTMLElement | null> {
    return new Promise(resolve => {
      let attempts = 0;

      const checkForElement = () => {
        attempts++;
        let foundElement: HTMLElement | null = null;

        for (const selector of selectors) {
          const element = parentElement.querySelector(selector);
          if (element) {
            foundElement = element as HTMLElement;
            break;
          }
        }

        if (foundElement) {
          resolve(foundElement);
          return;
        }

        if (attempts >= maxAttempts) {
          resolve(null);
          return;
        }

        fun.setTimeout(() => checkForElement(), delay);
      };

      checkForElement();
    });
  }

  private checkErrors(): void {
    if (!this.control) return;

    const wasShowingError = this.showError;
    const previousMessage = this.errorMessage;

    this.showError = this.control.invalid && (this.control.dirty || this.control.touched);

    if (this.showError && this.control.errors) {
      const firstErrorKey = Object.keys(this.control.errors)[0];
      const errorValue = this.control.errors[firstErrorKey];
      const errorMessageFn = this.ERROR_MESSAGES[firstErrorKey];

      this.errorMessage = typeof errorMessageFn === 'function' ? errorMessageFn(errorValue) : errorMessageFn || `Error en el campo: ${firstErrorKey}`;
    } else {
      this.errorMessage = '';
    }

    // Solo disparar change detection si algo cambió
    if (wasShowingError !== this.showError || previousMessage !== this.errorMessage) {
      this.cdr.markForCheck();
    }
  }
}
