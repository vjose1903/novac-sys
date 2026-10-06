import { Directive, ElementRef, Input, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { fun } from '../services/functions.service';

@Directive({
    selector: '[sizeCatcher]',
    standalone: false
})
export class SizeCatcherDirective implements OnInit, OnDestroy {
  @Input('sizeCatcher') targetElement: HTMLDivElement;
  private resizeObserver: ResizeObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const targetElement = entries[0].target;

        const targetHeight = (targetElement as any).offsetHeight;
        const targetWidth = (targetElement as any).offsetWidth;

        this.renderer.setStyle(this.el.nativeElement, 'height', `${targetHeight}px`);
        this.renderer.setStyle(this.el.nativeElement, 'width', `${targetWidth}px`);
      }
    });

    if (this.targetElement) this.resizeObserver.observe(this.targetElement);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
