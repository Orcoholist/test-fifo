import { Injectable } from '@angular/core';

/**
 * обёртка над LocalStorage:
 * безопасное чтение/запись JSON с защитой от повреждённых данных.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage: Storage | null =
    typeof window !== 'undefined' ? window.localStorage : null;

  /** Прочитать и распарсить значение по ключу; null, если данных нет или они битые. */
  read<T>(key: string): T | null {
    try {
      const raw = this.storage?.getItem(key);
      return raw == null ? null : (JSON.parse(raw) as T);
    } catch (error) {
      console.warn(`[Storage] Не удалось прочитать ключ "${key}"`, error);
      return null;
    }
  }

  /** Сериализовать и сохранить значение по ключу. */
  write(key: string, value: unknown): void {
    try {
      this.storage?.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Storage] Не удалось сохранить ключ "${key}"`, error);
    }
  }

  /** Удалить значение по ключу. */
  remove(key: string): void {
    try {
      this.storage?.removeItem(key);
    } catch (error) {
      console.warn(`[Storage] Не удалось удалить ключ "${key}"`, error);
    }
  }
}
