import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type { QueueEvent } from '../models/queue-event.model';


@Injectable({ providedIn: 'root' })
export class EventBus {
  private readonly events = new Subject<QueueEvent>();

  /** Поток событий очереди. */
  readonly events$ = this.events.asObservable();

  /** Опубликовать событие. */
  emit(event: QueueEvent): void {
    this.events.next(event);
  }
}
