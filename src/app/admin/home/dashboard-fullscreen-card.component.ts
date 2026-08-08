import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-dashboard-fullscreen-card',
  templateUrl: './dashboard-fullscreen-card.component.html',
  styleUrls: ['./dashboard-fullscreen-card.component.scss'],
  standalone: false,
})
export class DashboardFullscreenCardComponent implements AfterViewInit, OnDestroy {
  @Input() contentTemplate: TemplateRef<any> | null = null;
  @Input() context: Record<string, any> | null = null;
  @Input() originRect: DOMRect | null = null;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('backdropElement') private backdropElement?: ElementRef<HTMLElement>;
  @ViewChild('panelElement') private panelElement?: ElementRef<HTMLElement>;

  isClosing = false;
  private panelAnimation?: Animation;
  private backdropAnimation?: Animation;
  private resizeTimer?: ReturnType<typeof setTimeout>;
  private enterFrame?: number;
  private shouldEmitClosed = false;
  private readonly reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  get animationStyle(): Record<string, string> {
    if (!this.originRect || typeof window === 'undefined') return {};

    const finalRect = this.finalRect();

    return {
      '--final-left': `${finalRect.left}px`,
      '--final-top': `${finalRect.top}px`,
      '--final-width': `${finalRect.width}px`,
      '--final-height': `${finalRect.height}px`,
      '--origin-x': `${this.originRect.left - finalRect.left}px`,
      '--origin-y': `${this.originRect.top - finalRect.top}px`,
      '--origin-scale-x': `${this.originRect.width / finalRect.width}`,
      '--origin-scale-y': `${this.originRect.height / finalRect.height}`,
    };
  }

  @HostListener('document:keydown.escape')
  close() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.runExitAnimation();
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') {
      this.runEnterAnimation();
      return;
    }

    this.enterFrame = window.requestAnimationFrame(() => this.runEnterAnimation());
  }

  ngOnDestroy() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    if (this.enterFrame) cancelAnimationFrame(this.enterFrame);
    this.shouldEmitClosed = false;
    this.panelAnimation?.cancel();
    this.backdropAnimation?.cancel();
  }

  private runEnterAnimation() {
    const panel = this.panelElement?.nativeElement;
    const backdrop = this.backdropElement?.nativeElement;
    if (!panel || !backdrop || this.reduceMotion) {
      panel?.classList.add('ready');
      backdrop?.classList.add('ready');
      return;
    }

    const originTransform = this.originTransform();
    this.backdropAnimation = backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 180,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'forwards',
    });

    this.panelAnimation = panel.animate([
      {
        borderRadius: '1rem',
        transform: originTransform,
      },
      {
        borderRadius: '1.15rem',
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
      },
    ], {
      duration: 300,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'forwards',
    });
    this.requestChartResize();
    this.panelAnimation.onfinish = () => {
      panel.classList.add('ready');
      this.requestChartResize();
    };
  }

  private runExitAnimation() {
    const panel = this.panelElement?.nativeElement;
    const backdrop = this.backdropElement?.nativeElement;
    if (!panel || !backdrop || this.reduceMotion) {
      this.closed.emit();
      return;
    }

    this.backdropAnimation?.cancel();
    this.panelAnimation?.cancel();
    this.shouldEmitClosed = true;
    panel.classList.remove('ready');

    this.backdropAnimation = backdrop.animate([
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.82 },
      { opacity: 0, offset: 1 },
    ], {
      duration: 220,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'forwards',
    });

    this.panelAnimation = panel.animate([
      {
        borderRadius: '1.15rem',
        opacity: 1,
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
        offset: 0,
      },
      {
        borderRadius: '1.03rem',
        opacity: 1,
        transform: this.originTransform(0.86),
        offset: 0.86,
      },
      {
        borderRadius: '1rem',
        opacity: 0,
        transform: this.originTransform(0.96),
        offset: 0.96,
      },
      {
        borderRadius: '1rem',
        opacity: 0,
        transform: this.originTransform(),
        offset: 1,
      },
    ], {
      duration: 220,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'forwards',
    });

    this.panelAnimation.onfinish = () => {
      if (this.shouldEmitClosed) this.closed.emit();
    };
  }

  private originTransform(progress = 1): string {
    if (!this.originRect || typeof window === 'undefined') return 'translate3d(0, 0, 0) scale(0.96, 0.96)';

    const finalRect = this.finalRect();
    const translateX = (this.originRect.left - finalRect.left) * progress;
    const translateY = (this.originRect.top - finalRect.top) * progress;
    const scaleX = 1 + (this.originRect.width / finalRect.width - 1) * progress;
    const scaleY = 1 + (this.originRect.height / finalRect.height - 1) * progress;

    return `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`;
  }

  private finalRect(): { left: number; top: number; width: number; height: number } {
    if (window.innerWidth <= 700) {
      const inset = 12.8;
      const width = window.innerWidth - inset * 2;
      const height = window.innerHeight - inset * 2;

      return {
        left: inset,
        top: inset,
        width,
        height,
      };
    }

    const width = window.innerWidth * 0.94;
    const height = window.innerHeight * 0.78;

    return {
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
      width,
      height,
    };
  }

  private requestChartResize() {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new Event('resize'));
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
  }
}
