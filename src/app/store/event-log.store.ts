import { Injectable, inject, signal } from '@angular/core';
import { EventBus } from '../core/event-bus.service';
import { StorageService } from '../core/storage.service';
import type { QueueEvent } from '../models/queue-event.model';

/** Максимальное число записей в журнале. */
export const MAX_LOG_EVENTS = 20;

const LOG_STORAGE_KEY = 'ems.log.v1';

/**
 * Журнал последних событий очереди.
 *
 * Новые записи добавляются в начало, хранится не более {@link MAX_LOG_EVENTS}.
 * Подписан на шину событий, поэтому не зависит от QueueStore напрямую.
 */
@Injectable({ providedIn: 'root' })
export class EventLogStore {
  private readonly storage = inject(StorageService);
  private readonly events = signal<QueueEvent[]>([]);

  /** Последние события, новые сверху. */
  readonly log = this.events.asReadonly();

  constructor() {
    this.restore();

    inject(EventBus).events$.subscribe({
      next: (event) => {
        this.events.update((prev) => [event, ...prev].slice(0, MAX_LOG_EVENTS));
        this.persist();
      },
    });
  }

  private persist(): void {
    this.storage.write(LOG_STORAGE_KEY, this.events());
  }

  /** Очистить журнал событий полностью. */
  clear(): void {
    this.events.set([]);
    this.persist();
  }

  private restore(): void {
    const saved = this.storage.read<QueueEvent[]>(LOG_STORAGE_KEY);
    if (!Array.isArray(saved)) {
      return;
    }
    const valid = saved.filter(
      (event: unknown): event is QueueEvent =>
        event !== null &&
        typeof event === 'object' &&
        typeof (event as QueueEvent).id === 'string' &&
        typeof (event as QueueEvent).type === 'string' &&
        typeof (event as QueueEvent).message === 'string' &&
        typeof (event as QueueEvent).timestamp === 'number',
    );
    this.events.set(valid.slice(0, MAX_LOG_EVENTS));
  }
}
