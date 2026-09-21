export type ProductStatus = 'in_queue' | 'checked' | 'rejected';

/** Допустимые статусы (в порядке «жизненного цикла» продукта). */
export const PRODUCT_STATUSES: readonly ProductStatus[] = ['in_queue', 'checked', 'rejected'];

/** Подписи статусов для отображения в UI. */
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  in_queue: 'В очереди',
  checked: 'Проверен',
  rejected: 'Отбракован',
};

/** Проверка значения на принадлежность к статусу (для данных из LocalStorage). */
export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === 'string' && (PRODUCT_STATUSES as readonly string[]).includes(value);
}

/**
 * Единица продукции на производственной линии.
 */
export interface Product {
  /** Уникальный идентификатор. */
  id: string;
  /** Время поступления на линию (Unix-время, мс). */
  createdAt: number;
  /** Текущий статус продукта. */
  status: ProductStatus;
}
