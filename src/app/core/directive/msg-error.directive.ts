import { Directive, ElementRef, HostListener, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { UntypedFormGroup, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { fun } from '../services/functions.service';

interface ErrorResponse {
  render: boolean;
  msg: string;
}

@Directive({
  selector: '[appMsgError]',
  standalone: false,
})
export class MsgErrorDirective implements OnDestroy, AfterViewInit {
  @Input('appMsgError') formControlName: string;
  @Input() form: UntypedFormGroup;

  private readonly destroy$ = new Subject<void>();
  private isSubscribed = false;
  private readonly ERROR_MESSAGES = {
    required: 'Este campo es requerido.',
    minlength: (error: any) => `Cant. mínima de letras es: ${error.requiredLength}.`,
    max: (error: any) => `Valor maximo requerido es: ${error.max} - actualmente tiene: ${error.actual}.`,
    min: (error: any) => `Valor mínimo requerido es: ${error.min} - actualmente tiene: ${error.actual}.`,
    ip: 'Intoduzca una ip valida.',
    compares: 'Las contraseñas no coinciden.',
    invalidCedula: 'Ingrese una cédula válida.',
    email: 'Ingrese una email válido.',
    sinRayas: () => `Complete el campo: ${this.formControlName}`,
  };

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    // Delay más largo para modales dinámicos
    setTimeout(() => this.initSubscription(), 300);
  }

  @HostListener('focusin', ['$event'])
  onFocusIn(event: Event): void {
    this.initSubscription();
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: Event): void {
    setTimeout(() => this.checkErrors(), 50);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    this.checkErrors();
  }

  @HostListener('change', ['$event'])
  onChange(event: Event): void {
    this.checkErrors();
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: Event): void {
    this.checkErrors();
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    setTimeout(() => this.checkErrors(), 50);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSubscription(): void {
    if (this.isSubscribed) return;

    const control = this.getFormControl();
    if (!control) {
      // Retry después de un tiempo para modales dinámicos
      setTimeout(() => this.initSubscription(), 200);
      return;
    }

    control.valueChanges.pipe(debounceTime(50), takeUntil(this.destroy$)).subscribe(() => this.checkErrors());

    control.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkErrors());

    this.isSubscribed = true;
    this.checkErrors();
  }

  private getFormControl(): AbstractControl | null {
    return this.form?.get(this.formControlName) || null;
  }

  private checkErrors(): void {
    const control = this.getFormControl();
    if (!control) {
      console.warn(`Control '${this.formControlName}' no encontrado en checkErrors`);
      return;
    }

    const containerId = `msgContainer_${this.formControlName}`;
    const msgContainer = this.el.nativeElement.querySelector(`#${containerId}`) as HTMLElement;

    if (!msgContainer) {
      console.warn(`msgContainer con ID '${containerId}' no encontrado para el campo '${this.formControlName}'`);
      return;
    }

    this.clearPreviousMessages(msgContainer);

    const errorResponse = this.getErrorMessage(control);

    if (errorResponse.render) {
      this.renderErrorMessage(msgContainer, errorResponse.msg);
    }
  }

  private getErrorMessage(control: AbstractControl): ErrorResponse {
    const errors = control.errors;

    if (!fun.hasValue(errors) || control.valid || (!control.dirty && !control.touched)) {
      return { render: false, msg: '' };
    }

    for (const [errorType, errorValue] of Object.entries(errors)) {
      const messageHandler = this.ERROR_MESSAGES[errorType];
      if (messageHandler) {
        const message = typeof messageHandler === 'function' ? messageHandler(errorValue) : messageHandler;
        return { render: true, msg: message };
      }
    }

    return { render: false, msg: '' };
  }

  private renderErrorMessage(container: HTMLElement, message: string): void {
    const msgElement = document.createElement('div');
    const msgId = `msg_text_${this.formControlName}`;

    msgElement.id = msgId;
    msgElement.innerHTML = message;
    msgElement.style.cssText = 'color: #ff4d4d; margin-left: 0.2rem; position: absolute; font-size: 12px;';

    container.appendChild(msgElement);
  }

  private clearPreviousMessages(container: HTMLElement): void {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
}
