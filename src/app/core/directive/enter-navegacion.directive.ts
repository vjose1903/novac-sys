import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { fun } from '@services/functions.service';

const FIELD_SELECTOR = 'input, select, textarea';
const EXCLUDED_TYPES = ['submit', 'button', 'reset', 'checkbox', 'radio', 'hidden', 'file'];

@Directive({
  selector: '[appEnterNavegacion]',
  standalone: false,
})
export class EnterNavegacionDirective implements OnInit, OnDestroy {
  private keydownHandler = (event: KeyboardEvent) => this.onKeydown(event);

  constructor(private element: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.element.nativeElement.addEventListener('keydown', this.keydownHandler, true);
  }

  ngOnDestroy(): void {
    this.element.nativeElement.removeEventListener('keydown', this.keydownHandler, true);
  }

  private onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;

    const fields = this.getActiveFields();
    const current = (event.target as HTMLElement).closest?.(FIELD_SELECTOR) as HTMLElement | null;
    if (!current) return;

    const currentIndex = fields.indexOf(current);
    if (currentIndex === -1) return;

    const next = fields[currentIndex + 1];
    if (!next) return;

    event.preventDefault();
    event.stopPropagation();
    fun.enfocarInput(null, next);
  }

  private getActiveFields(): HTMLElement[] {
    const container = this.element.nativeElement;
    return Array.from(container.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).filter(element => {
      if (EXCLUDED_TYPES.includes(element.getAttribute('type') ?? '')) return false;
      if ((element as HTMLInputElement).disabled) return false;
      if ((element as HTMLInputElement).readOnly) return false;
      if (element.getClientRects().length === 0) return false;
      return true;
    });
  }
}
