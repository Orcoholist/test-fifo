/** Генерация уникального идентификатора (для событий журнала). */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Форматирование времени как ЧЧ:ММ:СС. */
export function formatTime(timestamp: number): string {
  return timeFormatter.format(timestamp);
}
