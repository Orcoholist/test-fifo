import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { ProductStatus } from '../../models/product.model';
import { QueueStore } from '../../store/queue.store';
import { QueueItem } from '../queue-item/queue-item';

/**
 * Горизонтальный конвейер: продукты движутся от «Датчика входа» (слева)
 * к «Датчику отбраковки» (справа). Управляет «Следующим тактом».
 *
 * Позиционирование карточек: каждая карточка прижата к правому краю
 * стрипа и смещена влево на (индекс * ширину слота). Индекс 0 —
 * самый старый продукт, стоящий у датчика отбраковки.
 */
@Component({
  selector: 'app-queue-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QueueItem],
  templateUrl: './queue-line.html',
  styleUrl: './queue-line.scss',
})
export class QueueLine {
  private readonly queueStore = inject(QueueStore);

  readonly products = this.queueStore.queue;
  readonly tick = this.queueStore.tickCount;
  readonly itemsCount = this.queueStore.itemsCount;

  nextTick(): void {
    this.queueStore.nextTick();
  }

  onStatusChange(productId: string, status: ProductStatus): void {
    this.queueStore.setStatus(productId, status);
  }

  onRemove(productId: string): void {
    this.queueStore.removeProduct(productId);
  }
}
