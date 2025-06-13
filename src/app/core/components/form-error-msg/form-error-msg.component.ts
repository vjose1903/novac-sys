import { Component, Input, OnDestroy, OnInit, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { InputMask } from 'primeng/inputmask';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MultiSelect } from 'primeng/multiselect';

type PrimeNGComponent = InputMask | InputNumber | Select | DatePicker | MultiSelect;
type FieldElement = ElementRef<HTMLInputElement> | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | PrimeNGComponent;

@Component({
  selector: 'form-error-msg',
  imports: [CommonModule],
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
    if (this.fieldElement instanceof ElementRef) {
      return this.fieldElement.nativeElement;
    }

    // HTMLElement nativo
    if (this.fieldElement instanceof HTMLElement) {
      return this.fieldElement;
    }

    // Componente PrimeNG
    if (this.isPrimeNGComponent(this.fieldElement)) {
      return this.getPrimeNGElement(this.fieldElement);
    }

    return null;
  }

  private isPrimeNGComponent(element: any): element is PrimeNGComponent {
    return element && typeof element === 'object' && (element instanceof InputMask || element instanceof InputNumber || element instanceof Select || element instanceof DatePicker || element instanceof MultiSelect);
  }

  private async getPrimeNGElement(component: PrimeNGComponent): Promise<HTMLElement | null> {
    const rootElement = component.el?.nativeElement;
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
    if (component instanceof InputMask) {
      return { selectors: ['input'] };
    }

    if (component instanceof InputNumber) {
      return { selectors: ['input'] };
    }

    if (component instanceof Select) {
      return { selectors: ['.p-select-label'] };
    }

    if (component instanceof MultiSelect) {
      return { selectors: ['input', '[role="combobox"]'] };
    }

    if (component instanceof DatePicker) {
      return {
        selectors: ['input[data-pc-section="input"]', 'input.p-inputtext', 'input[type="text"]', 'input'],
      };
    }

    return { selectors: [] };
  }

  private setupHTMLEvents(element: HTMLElement): void {
    const events$ = [];

    // Eventos básicos para todos los elementos
    events$.push(fromEvent(element, 'blur').pipe(takeUntil(this.destroy$)));

    // Eventos específicos según el tipo de elemento
    if (this.isInputElement(element)) {
      events$.push(fromEvent(element, 'input').pipe(takeUntil(this.destroy$)));
    }

    if (this.isSelectLikeElement(element)) {
      events$.push(fromEvent(element, 'change').pipe(takeUntil(this.destroy$)), fromEvent(element, 'click').pipe(takeUntil(this.destroy$)));

      // Eventos específicos para MultiSelect
      if (this.isMultiSelectElement(element)) {
        this.setupMultiSelectEvents(element, events$);
      }
    }

    // Combinar todos los eventos con debounce
    merge(...events$)
      .pipe(debounceTime(10), takeUntil(this.destroy$))
      .subscribe(() => {
        this.control!.markAsTouched();
        this.checkErrors();
      });
  }

  private isInputElement(element: HTMLElement): boolean {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  }

  private isSelectLikeElement(element: HTMLElement): boolean {
    return element.tagName === 'SELECT' || element.getAttribute('role') === 'combobox' || element.classList.contains('p-multiselect') || element.classList.contains('p-multiselect-label') || element.classList.contains('p-select');
  }

  private isMultiSelectElement(element: HTMLElement): boolean {
    return element.classList.contains('p-multiselect') || element.classList.contains('p-multiselect-label');
  }

  private setupMultiSelectEvents(element: HTMLElement, events$: any[]): void {
    // Eventos de teclado
    events$.push(fromEvent(element, 'keydown').pipe(takeUntil(this.destroy$)));

    // Evento focusout más confiable para MultiSelect
    events$.push(fromEvent(element, 'focusout').pipe(takeUntil(this.destroy$)));

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
            setTimeout(() => this.checkErrors(), 10);
          }
        }
      });
    });

    this.mutationObserver.observe(element, {
      attributes: true,
      attributeFilter: ['aria-expanded'],
    });
  }

  private waitForElement(parentElement: HTMLElement, selectors: string[], maxAttempts: number = 5, delay: number = 20): Promise<HTMLElement | null> {
    return new Promise(resolve => {
      let attempts = 0;

      const checkForElement = () => {
        attempts++;

        for (const selector of selectors) {
          const foundElement = parentElement.querySelector(selector);
          if (foundElement) {
            resolve(foundElement as HTMLElement);
            return;
          }
        }

        if (attempts >= maxAttempts) {
          resolve(null);
          return;
        }

        setTimeout(checkForElement, delay);
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
