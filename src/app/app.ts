import { Component, VERSION, inject } from '@angular/core';
import { AddProductForm } from './components/add-product-form/add-product-form';
import { EventLog } from './components/event-log/event-log';
import { QueueLine } from './components/queue-line/queue-line';
import { QueueStore } from './store/queue.store';

/**
 * Корневой компонент приложения: собирает конвейер, форму добавления
 * и журнал событий, показывает общую статистику.
 */
@Component({
  selector: 'app-root',
  imports: [QueueLine, AddProductForm, EventLog],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly queueStore = inject(QueueStore);

  protected readonly tick = this.queueStore.tickCount;
  protected readonly itemsCount = this.queueStore.itemsCount;
  protected readonly angularVersion = VERSION.full;

  reset(): void {
    this.queueStore.reset();
  }
}
