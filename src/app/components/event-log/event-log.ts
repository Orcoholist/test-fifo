import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { formatTime } from '../../core/utils';
import { QUEUE_EVENT_TYPE_LABELS } from '../../models/queue-event.model';
import { EventLogStore } from '../../store/event-log.store';

/** Время ожидания подтверждения очистки журнала. */
const CONFIRM_TIMEOUT_MS = 3000;

@Component({
  selector: 'app-event-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './event-log.html',
  styleUrl: './event-log.scss',
})
export class EventLog implements OnDestroy {
  private readonly eventLog = inject(EventLogStore);

  readonly log = this.eventLog.log;
  readonly typeLabels = QUEUE_EVENT_TYPE_LABELS;

  protected readonly formatTime = formatTime;

  /** true — кнопка «вооружена» и ждёт повторного клика. */
  protected readonly confirming = signal(false);

  private confirmTimer: ReturnType<typeof setTimeout> | null = null;

  onClearClick(): void {
    if (this.confirming()) {
      this.cancelConfirmation();
      this.eventLog.clear();
      return;
    }
    this.confirming.set(true);
    this.confirmTimer = setTimeout(() => this.cancelConfirmation(), CONFIRM_TIMEOUT_MS);
  }

  private cancelConfirmation(): void {
    this.confirming.set(false);
    if (this.confirmTimer !== null) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.cancelConfirmation();
  }
}
