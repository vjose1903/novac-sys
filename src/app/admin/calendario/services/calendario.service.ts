import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudGSignal } from '@core/typescript/crud-g-signal';
import { firstValueFrom } from 'rxjs';
import { CalendarApiResponse, CalendarEventInput, CalendarEventPayload, CalendarEventType, CalendarLinkableRecord } from '../calendario.models';

interface CalendarRange {
  key: string;
  start: string;
  end: string;
  view: string;
  fetchedAt: number;
}

interface InflightRequest {
  controller: AbortController;
  promise: Promise<CalendarEventInput[]>;
  reason: 'visible' | 'prefetch';
  priority: number;
}

@Injectable({ providedIn: 'root' })
export class CalendarioService {
  private readonly calendarApi = new CrudGSignal<CalendarEventPayload>('calendar');
  private readonly timezone = 'America/Santo_Domingo';
  private readonly dbName = 'novac_calendar_cache';
  private readonly dbVersion = 1;
  private readonly maxInflightRequests = 3;
  private readonly eventStore = new Map<string, CalendarEventInput>();
  private readonly loadedRanges: CalendarRange[] = [];
  private readonly inflightRequests = new Map<string, InflightRequest>();
  private dbPromise?: Promise<IDBDatabase>;

  constructor(private http: HttpClient) {}

  getTimezone() {
    return this.timezone;
  }

  async hydrateRangeFromCache(start: string, end: string) {
    const records = await this.readEventsFromIndexedDb(start, end);
    this.mergeEvents(records);
  }

  getVisibleEvents(start: string, end: string): CalendarEventInput[] {
    const events = Array.from(this.eventStore.values()).filter(event => this.intersects(event, start, end));
    return Array.from(new Map(events.map(event => [String(event.id), event])).values());
  }

  async refreshEventsForRange(args: { start: string; end: string; view: string; reason: 'visible' | 'prefetch'; priority?: number }): Promise<CalendarEventInput[]> {
    const key = this.cacheKey(args.view, args.start, args.end);
    const inflight = this.inflightRequests.get(key);
    if (inflight) return inflight.promise;
    if (args.reason === 'visible') this.abortStaleVisibleRequests(key);

    const controller = new AbortController();
    const promise = this.fetchEvents(args.start, args.end, controller.signal)
      .then(events => {
        this.mergeEvents(events);
        this.markRangeLoaded({ key, start: args.start, end: args.end, view: args.view, fetchedAt: Date.now() });
        return this.getVisibleEvents(args.start, args.end);
      })
      .catch(error => {
        if (error?.name !== 'AbortError') console.error('[calendar] fetch failed', error);
        return this.getVisibleEvents(args.start, args.end);
      })
      .finally(() => this.inflightRequests.delete(key));

    this.inflightRequests.set(key, { controller, promise, reason: args.reason, priority: args.priority ?? 0 });
    this.pruneInflightRequests(key);

    return promise;
  }

  async prefetchAdjacentRanges(center: Date, view: string) {
    const ranges = this.buildPrefetchRanges(center, view);
    await Promise.all(ranges.map((range, index) => this.refreshEventsForRange({ ...range, reason: 'prefetch', priority: index + 1 })));
  }

  async getEventTypes(): Promise<CalendarEventType[]> {
    const response = await firstValueFrom(
      this.http.get<CalendarApiResponse<CalendarEventType[]>>(this.calendarApi.getAllRequest({ afterPath: 'event_types' }).url, {
        params: { spinner: 'no_show' },
      })
    );
    return (response.data ?? []).filter(type => type.active);
  }

  async saveEvent(payload: CalendarEventPayload) {
    const { id, ...data } = payload;
    const url = this.calendarApi.getAllRequest({ afterPath: id ? `events/${id}` : 'events' }).url;
    const request = id ? this.http.patch(url, data) : this.http.post(url, data);
    return firstValueFrom(request);
  }

  async deleteEvent(id: string) {
    return firstValueFrom(this.http.delete(this.calendarApi.getAllRequest({ afterPath: `events/${id}` }).url));
  }

  async searchLinkables(entityType: string, q: string): Promise<CalendarLinkableRecord[]> {
    if (!entityType || q.trim().length < 2) return [];

    const response = await firstValueFrom(
      this.http.get<CalendarApiResponse<{ records: CalendarLinkableRecord[] }>>(this.calendarApi.getAllRequest({ afterPath: 'linkables/search' }).url, {
        params: { entity_type: entityType, q: q.trim(), page: 1, per_page: 10, spinner: 'no_show' },
      })
    );

    return response.data?.records ?? [];
  }

  private async fetchEvents(start: string, end: string, signal: AbortSignal): Promise<CalendarEventInput[]> {
    const url = new URL(this.calendarApi.getAllRequest({ afterPath: 'events' }).url);
    url.searchParams.set('start', start);
    url.searchParams.set('end', end);
    url.searchParams.set('links', 'true');
    url.searchParams.set('spinner', 'no_show');

    const response = await fetch(url.toString(), {
      signal,
      headers: this.authHeaders(),
    });

    if (!response.ok) throw new Error('No se pudieron cargar los eventos.');
    const payload = (await response.json()) as CalendarApiResponse<CalendarEventInput[]>;
    return payload.data ?? [];
  }

  private mergeEvents(events: CalendarEventInput[]) {
    events.forEach(event => {
      if (!event.id) return;

      const existing = this.eventStore.get(String(event.id));
      const existingUpdatedAt = this.getEventUpdatedAt(existing);
      const nextUpdatedAt = this.getEventUpdatedAt(event);

      if (!existing || !existingUpdatedAt || !nextUpdatedAt || nextUpdatedAt >= existingUpdatedAt) {
        this.eventStore.set(String(event.id), event);
      }
    });

    this.writeEventsToIndexedDb(events).catch(error => console.warn('[calendar] cache write failed', error));
  }

  private markRangeLoaded(range: CalendarRange) {
    const index = this.loadedRanges.findIndex(item => item.key === range.key);
    if (index >= 0) this.loadedRanges[index] = range;
    else this.loadedRanges.push(range);
    this.writeRangeToIndexedDb(range).catch(error => console.warn('[calendar] range cache write failed', error));
  }

  private buildPrefetchRanges(center: Date, view: string): Array<{ start: string; end: string; view: string }> {
    if (view === 'timeGridWeek') return this.buildRelativeDayRanges(center, view, -4, 4, 7);
    if (view === 'timeGridDay') return this.buildRelativeDayRanges(center, view, -14, 14, 1);
    return this.buildRelativeMonthRanges(center, view, -2, 2);
  }

  private buildRelativeMonthRanges(center: Date, view: string, from: number, to: number) {
    const ranges = [];
    for (let offset = from; offset <= to; offset++) {
      const start = new Date(center.getFullYear(), center.getMonth() + offset, 1);
      const end = new Date(center.getFullYear(), center.getMonth() + offset + 1, 1);
      ranges.push({ start: this.toDateOnly(start), end: this.toDateOnly(end), view });
    }
    return ranges;
  }

  private buildRelativeDayRanges(center: Date, view: string, from: number, to: number, span: number) {
    const ranges = [];
    const base = new Date(center);
    base.setHours(0, 0, 0, 0);

    for (let offset = from; offset <= to; offset++) {
      const start = new Date(base);
      start.setDate(base.getDate() + offset * span);
      const end = new Date(start);
      end.setDate(start.getDate() + span);
      ranges.push({ start: this.toDateOnly(start), end: this.toDateOnly(end), view });
    }

    return ranges;
  }

  private pruneInflightRequests(activeKey: string) {
    if (this.inflightRequests.size <= this.maxInflightRequests) return;

    const candidates = Array.from(this.inflightRequests.entries())
      .filter(([key]) => key !== activeKey)
      .sort((a, b) => b[1].priority - a[1].priority);

    while (this.inflightRequests.size > this.maxInflightRequests && candidates.length) {
      const [key, request] = candidates.shift();
      request.controller.abort();
      this.inflightRequests.delete(key);
    }
  }

  private abortStaleVisibleRequests(activeKey: string) {
    this.inflightRequests.forEach((request, key) => {
      if (key !== activeKey && request.reason === 'visible') {
        request.controller.abort();
        this.inflightRequests.delete(key);
      }
    });
  }

  private async readEventsFromIndexedDb(start: string, end: string): Promise<CalendarEventInput[]> {
    const db = await this.getDb().catch(() => null);
    if (!db) return [];

    return new Promise(resolve => {
      const request = db.transaction('calendar_events', 'readonly').objectStore('calendar_events').getAll();
      request.onsuccess = () => {
        const records = (request.result ?? []).map(record => record.event).filter(event => this.intersects(event, start, end));
        resolve(records);
      };
      request.onerror = () => resolve([]);
    });
  }

  private async writeEventsToIndexedDb(events: CalendarEventInput[]) {
    const db = await this.getDb();
    const tx = db.transaction('calendar_events', 'readwrite');
    const store = tx.objectStore('calendar_events');
    const fetchedAt = Date.now();

    events.forEach(event => {
      if (!event.id) return;
      store.put({
        id: String(event.id),
        event,
        start: this.eventStart(event),
        end: this.eventEnd(event),
        updatedAt: this.getEventUpdatedAt(event),
        fetchedAt,
      });
    });
  }

  private async writeRangeToIndexedDb(range: CalendarRange) {
    const db = await this.getDb();
    db.transaction('calendar_ranges', 'readwrite').objectStore('calendar_ranges').put(range);
  }

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('calendar_events')) db.createObjectStore('calendar_events', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('calendar_ranges')) db.createObjectStore('calendar_ranges', { keyPath: 'key' });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private intersects(event: CalendarEventInput, start: string, end: string) {
    const eventStart = this.eventStart(event);
    const eventEnd = this.eventEnd(event);
    return eventStart <= end && eventEnd >= start;
  }

  private eventStart(event: CalendarEventInput) {
    return this.toDateOnly(event.start || event.startStr || new Date());
  }

  private eventEnd(event: CalendarEventInput) {
    return this.toDateOnly(event.end || event.endStr || event.start || event.startStr || new Date());
  }

  private toDateOnly(value: any) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  }

  private cacheKey(view: string, start: string, end: string) {
    return `${view}:${start}:${end}`;
  }

  private getEventUpdatedAt(event?: CalendarEventInput) {
    const value = event?.extendedProps?.updatedAt || event?.extendedProps?.updated_at || event?.['updatedAt'];
    return value ? new Date(value).getTime() : null;
  }

  private authHeaders() {
    const headers: Record<string, string> = { Accept: 'application/json' };
    ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach(header => {
      const value = localStorage.getItem(header);
      if (value) headers[header] = value;
    });
    return headers;
  }
}
