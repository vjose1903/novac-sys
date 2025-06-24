import { Directive, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { Ss } from '@core/services/singleton.service';

@Directive({
  selector: '[multiClick]',
  standalone: false,
})
export class MultiClickDirective {
  @Input('multiClick') requiredClicks: number = 1;
  @Input() resetTime: number = 1000; // Tiempo en ms para resetear el contador
  @Output() multiClickEvent = new EventEmitter<void>();

  private clickCount = 0;
  private resetTimer: any;

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    this.clickCount++;

    // Limpiar el timer anterior si existe
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    // Si alcanzamos el número requerido de clicks, emitir el evento
    if (this.clickCount >= this.requiredClicks) {
      this.multiClickEvent.emit();
      this.resetClickCount();
      return;
    }

    // Configurar timer para resetear el contador
    this.resetTimer = fun.setTimeout(() => this.resetClickCount(), this.resetTime);
  }

  private resetClickCount(): void {
    this.clickCount = 0;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  ngOnDestroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }
}
