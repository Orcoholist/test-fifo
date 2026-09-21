import type { ProductStatus } from './product.model';

/**
 * Тип события очереди, попадающего в журнал.
 */
export type QueueEventType = 'add' | 'status_change' | 'remove' | 'system';

/** Подписи типов событий для журнала. */
export const QUEUE_EVENT_TYPE_LABELS: Record<QueueEventType, string> = {
  add: 'Добавление',
  status_change: 'Статус',
  remove: 'Удаление',
  system: 'Система',
};

/**
 * Событие очереди (запись журнала последних событий).
 */
export interface QueueEvent {
  /** Уникальный идентификатор события. */
  id: string;
  /** Тип события. */
  type: QueueEventType;
  /** ID продукта, к которому относится событие. */
  productId: string;
  /** Человекочитаемое описание для журнала. */
  message: string;
  /** Время события (Unix-время, мс). */
  timestamp: number;
  /** Статус продукта на момент события (для status_change / remove). */
  status?: ProductStatus;
}
