import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { formatTime } from '../../core/utils';
import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  type Product,
  type ProductStatus,
} from '../../models/product.model';

@Component({
  selector: 'app-queue-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './queue-item.html',
  styleUrl: './queue-item.scss',
})
export class QueueItem {
  /** Продукт для отображения. */
  readonly product = input.required<Product>();

  /** Пользователь изменил статус. */
  readonly statusChange = output<ProductStatus>();
  /** Пользователь удалил продукт. */
  readonly remove = output<string>();

  readonly statuses = PRODUCT_STATUSES;
  readonly statusLabels = PRODUCT_STATUS_LABELS;

  protected readonly formatTime = formatTime;

  onStatusChange(value: string): void {
    const status = value as ProductStatus;
    if (status !== this.product().status) {
      this.statusChange.emit(status);
    }
  }

  onRemove(): void {
    this.remove.emit(this.product().id);
  }
}
