import { computed, signal } from '@angular/core';

export interface SharedResourceLoadOptions {
  force?: boolean;
  reason?: string;
  skipLoader?: boolean;
}

export interface SharedResourceSnapshot<T> {
  data: T | null;
  loading: boolean;
  error: any;
  ready: boolean;
  lastUpdated: Date | null;
}

export abstract class SharedResourceState<T> {
  private readonly dataState = signal<T | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<any>(null);
  private readonly lastUpdatedState = signal<Date | null>(null);
  private inflightRequest: Promise<T> | null = null;
  private requestSequence = 0;

  readonly data = this.dataState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();
  readonly ready = computed(() => this.dataState() !== null && !this.loadingState());
  readonly snapshot = computed<SharedResourceSnapshot<T>>(() => ({
    data: this.dataState(),
    loading: this.loadingState(),
    error: this.errorState(),
    ready: this.ready(),
    lastUpdated: this.lastUpdatedState(),
  }));

  async refresh(options: SharedResourceLoadOptions = {}): Promise<T> {
    if (this.inflightRequest && !options.force) return this.inflightRequest;

    const requestId = ++this.requestSequence;
    this.loadingState.set(true);
    this.errorState.set(null);

    const request = this.load(options)
      .then(data => {
        if (requestId === this.requestSequence) this.setData(data);
        return data;
      })
      .catch(error => {
        if (requestId === this.requestSequence) this.errorState.set(error);
        throw error;
      })
      .finally(() => {
        if (this.inflightRequest === request) this.inflightRequest = null;
        if (requestId === this.requestSequence) this.loadingState.set(false);
      });

    this.inflightRequest = request;
    return request;
  }

  reload(reason?: string): Promise<T> {
    return this.refresh({ force: true, reason });
  }

  invalidate(): void {
    this.requestSequence++;
    this.inflightRequest = null;
    this.dataState.set(null);
    this.errorState.set(null);
    this.loadingState.set(false);
    this.lastUpdatedState.set(null);
  }

  protected setData(data: T): void {
    this.dataState.set(data);
    this.lastUpdatedState.set(new Date());
  }

  protected updateData(update: (current: T | null) => T): void {
    this.setData(update(this.dataState()));
  }

  protected abstract load(options: SharedResourceLoadOptions): Promise<T>;
}
