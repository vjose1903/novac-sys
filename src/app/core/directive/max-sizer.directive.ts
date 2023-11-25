import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[maxSizer]',
})
export class MaxSizerDirective implements OnInit, OnDestroy {
  @Input('maxSizer') type: maxSizeTypeE;
  @Input('source') source: HTMLElement;
  @Input('targets') targets: Array<HTMLElement> | HTMLElement;
  @Input('reduceTotalHeight') reduceTotalHeight: number = 0;
  @Input('reduceTotalWidth') reduceTotalWidth: number = 0;
  @Input('increaseTotalHeight') increaseTotalHeight: number = 0;
  @Input('increaseTotalWidth') increaseTotalWidth: number = 0;

  private resizeObserver: ResizeObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (this.type == maxSizeTypeE.both || this.type == maxSizeTypeE.height) {
      this.renderer.setStyle(this.el.nativeElement, 'max-height', `0px`);
    }

    if (this.type == maxSizeTypeE.both || this.type == maxSizeTypeE.width) {
      this.renderer.setStyle(this.el.nativeElement, 'max-width', `0px`);
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const sourceElement: any = entries[0].target;

        const sourceHeight = sourceElement.offsetHeight;
        const sourceWidth = sourceElement.offsetWidth;

        let sumTargetHeight = 0;
        let sumTargetWidth = 0;

        if (Array.isArray(this.targets)) {
          sumTargetHeight = this.targets.reduce((acumulado, item) => {
            return acumulado + item.offsetHeight;
          }, 0);
          sumTargetWidth = this.targets.reduce((acumulado, item) => acumulado + item.offsetWidth, 0);
        } else {
          sumTargetHeight = this.targets.offsetHeight;
          sumTargetWidth = this.targets.offsetWidth;
        }

        let calcHeight = sourceHeight - sumTargetHeight;
        calcHeight = calcHeight + this.increaseTotalHeight - this.reduceTotalHeight;

        let calcWidth = sourceWidth - sumTargetWidth;
        calcWidth = calcWidth + this.increaseTotalWidth - this.reduceTotalWidth;

        if (this.type == maxSizeTypeE.both || this.type == maxSizeTypeE.height) {
          this.renderer.setStyle(this.el.nativeElement, 'max-height', `${calcHeight}px`);
        }

        if (this.type == maxSizeTypeE.both || this.type == maxSizeTypeE.width) {
          this.renderer.setStyle(this.el.nativeElement, 'max-width', `${calcWidth}px`);
        }
      }
    });

    if (this.source) this.resizeObserver.observe(this.source);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

export enum maxSizeTypeE {
  height = 'height',
  width = 'width',
  both = 'both',
}
