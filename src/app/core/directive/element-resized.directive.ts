import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

export interface ResizeEvent {
  target: Element;
  width: number;
  height: number;
  newRect: DOMRect;
}

@Directive({
  selector: '[elementResized]',
  standalone: false,
})
export class ElementResizedDirective implements OnInit, OnDestroy {
  @Output() resized = new EventEmitter<ResizeEvent>();

  private resizeObserver: ResizeObserver | null = null;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.createResizeObserver();
  }

  ngOnDestroy() {
    this.destroyResizeObserver();
  }

  private createResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const rect = entry.target.getBoundingClientRect();
          const resizeEvent: ResizeEvent = {
            target: entry.target,
            width: rect.width,
            height: rect.height,
            newRect: rect,
          };

          this.resized.emit(resizeEvent);
        });
      });

      this.resizeObserver.observe(this.elementRef.nativeElement);
    } else {
      console.warn('ResizeObserver no está soportado en este navegador');
      this.fallbackToWindowResize();
    }
  }

  private destroyResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private fallbackToWindowResize() {
    // Fallback para navegadores que no soportan ResizeObserver
    const element = this.elementRef.nativeElement;

    const emitResize = () => {
      const rect = element.getBoundingClientRect();
      const resizeEvent: ResizeEvent = {
        target: element,
        width: rect.width,
        height: rect.height,
        newRect: rect,
      };

      this.resized.emit(resizeEvent);
    };

    // Emitir tamaño inicial
    setTimeout(emitResize, 0);

    // Escuchar cambios en el tamaño de la ventana
    window.addEventListener('resize', emitResize);

    // Cleanup en ngOnDestroy
    this.resizeObserver = {
      disconnect: () => window.removeEventListener('resize', emitResize),
    } as any;
  }
}
