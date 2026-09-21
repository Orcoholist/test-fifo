import { computed, Injectable, inject, signal } from '@angular/core';
import { EventBus } from '../core/event-bus.service';
import { StorageService } from '../core/storage.service';
import { createId } from '../core/utils';
import {
  isProductStatus,
  PRODUCT_STATUS_LABELS,
  type Product,
  type ProductStatus,
} from '../models/product.model';
import type { QueueEvent, QueueEventType } from '../models/queue-event.model';

/** Ключ, под которым состояние очереди хранится в LocalStorage. */
const QUEUE_STORAGE_KEY = 'ems.queue.v1';

/** Сериализуемый снимок состояния очереди. */
interface QueueSnapshot {
  products: Product[];
  tick: number;
  nextNumber: number;
}

/**
 * Единственный источник правды о FIFO-очереди продуктов.
 *
 * Семантика (см. README, там задокументировано решение по двусмысленности ТЗ):
 * - продукт добавляется в конец очереди и встаёт у «Датчика входа» (слева);
 * - «Следующий такт» смещает очередь на одну позицию к «Датчику отбраковки»
 *   (справа), а крайний справа продукт — самый старый — автоматически удаляется.
 *
 * Продукты хранятся в порядке «первый пришёл — первым обработан»:
 * индекс 0 — самый старый (первый на очереди у датчика отбраковки),
 * конец массива — самый новый (только поступил у датчика входа).
 *
 * Все мутации выполняются только методами этого сервиса,
 * публикуют событие в шину и сохраняются в LocalStorage.
 */
@Injectable({ providedIn: 'root' })
export class QueueStore {
  private readonly storage = inject(StorageService);
  private readonly eventBus = inject(EventBus);

  private readonly products = signal<Product[]>([]);
  private readonly tick = signal(0);
  private readonly nextNumber = signal(1);

  /** FIFO-очередь продуктов (только для чтения). */
  readonly queue = this.products.asReadonly();
  /** Номер текущего такта (сколько тактов прошло с момента запуска/сброса). */
  readonly tickCount = this.tick.asReadonly();
  /** Кол-во продуктов в очереди. */
  readonly itemsCount = computed(() => this.products().length);

  constructor() {
    this.restore();
  }

  /**
   * Добавить новый продукт в конец очереди (у датчика входа).
   *
   * @param customId пользовательский ID (опционально) или авто-генерация P-001, P-002, …
   */
  addProduct(customId?: string): Product {
    const id = this.resolveId(customId);
    const product: Product = { id, createdAt: Date.now(), status: 'in_queue' };
    this.products.update((list) => [...list, product]);
    this.persist();
    this.log('add', id, `Продукт ${id} добавлен в очередь у датчика входа`);
    return product;
  }

  /** Удалить продукт из очереди по ID. */
  removeProduct(id: string): void {
    const product = this.products().find((p) => p.id === id);
    if (!product) {
      return;
    }
    this.products.update((list) => list.filter((p) => p.id !== id));
    this.persist();
    this.log('remove', id, `Продукт ${id} удалён из очереди`, product.status);
  }

  /** Изменить статус продукта. */
  setStatus(id: string, status: ProductStatus): void {
    const current = this.products().find((p) => p.id === id);
    if (!current || current.status === status) {
      return;
    }
    this.products.update((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
    this.persist();
    this.log(
      'status_change',
      id,
      `Статус продукта ${id} изменён: «${PRODUCT_STATUS_LABELS[current.status]}» → «${PRODUCT_STATUS_LABELS[status]}»`,
      status,
    );
  }

  /**
   * «Следующий такт»: очередь смещается на одну позицию к датчику отбраковки,
   * а продукт в конце — самый старый — автоматически удаляется.
   * Если очередь пуста, такт не выполняется.
   */
  nextTick(): void {
    const oldest = this.products()[0];
    if (!oldest) {
      return;
    }
    this.tick.update((t) => t + 1);
    this.products.update((list) => list.slice(1));
    this.persist();
    this.log(
      'remove',
      oldest.id,
      `Такт ${this.tick()}: продукт ${oldest.id} достиг датчика отбраковки и удалён с линии`,
      oldest.status,
    );
  }

  /** Сбросить очередь и счётчик тактов (данные в LocalStorage очищаются). */
  reset(): void {
    this.products.set([]);
    this.tick.set(0);
    this.persist();
    this.log('system', '-', 'Очередь сброшена');
  }

  // ---------- внутренние помощники ----------

  /** Вернуть пользовательский ID либо сгенерировать последовательный (P-001, …). */
  private resolveId(customId: string | undefined): string {
    const normalized = customId?.trim();
    if (normalized) {
      return normalized;
    }
    const number = this.nextNumber();
    this.nextNumber.update((n) => n + 1);
    return `P-${String(number).padStart(3, '0')}`;
  }

  /** Опубликовать событие в шину (на неё подписан журнал). */
  private log(
    type: QueueEventType,
    productId: string,
    message: string,
    status?: ProductStatus,
  ): void {
    const event: QueueEvent = {
      id: createId(),
      type,
      productId,
      message,
      timestamp: Date.now(),
      ...(status !== undefined ? { status } : {}),
    };
    this.eventBus.emit(event);
  }

  private persist(): void {
    const snapshot: QueueSnapshot = {
      products: this.products(),
      tick: this.tick(),
      nextNumber: this.nextNumber(),
    };
    this.storage.write(QUEUE_STORAGE_KEY, snapshot);
  }

  /** Восстановление состояния из LocalStorage (устойчиво к битым данным). */
  private restore(): void {
    const snapshot = this.storage.read<Partial<QueueSnapshot>>(QUEUE_STORAGE_KEY);
    if (!snapshot) {
      return;
    }

    const products: Product[] = Array.isArray(snapshot.products)
      ? snapshot.products.filter(
          (p: unknown): p is Product =>
            p !== null &&
            typeof p === 'object' &&
            typeof (p as Product).id === 'string' &&
            (p as Product).id.length > 0 &&
            typeof (p as Product).createdAt === 'number' &&
            isProductStatus((p as Product).status),
        )
      : [];

    this.products.set(products);
    this.tick.set(typeof snapshot.tick === 'number' && snapshot.tick >= 0 ? snapshot.tick : 0);
    this.nextNumber.set(
      typeof snapshot.nextNumber === 'number' && snapshot.nextNumber >= 1
        ? snapshot.nextNumber
        : Math.max(
            1,
            ...products.map((p) => extractSequentialNumber(p.id)).filter((n) => n !== null),
          ),
    );
  }
}

/** Достать числовой суффикс из ID вида P-001, чтобы продолжить нумерацию после перезагрузки. */
function extractSequentialNumber(id: string): number | null {
  const match = /^P-(\d+)$/.exec(id.trim());
  return match ? Number(match[1]) : null;
}
