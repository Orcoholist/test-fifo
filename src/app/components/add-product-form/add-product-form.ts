import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { QueueStore } from '../../store/queue.store';

/** Допустимый формат пользовательского ID: буквы, цифры, «_» и «-», до 20 символов. */
const CUSTOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;

/**
 * Форма добавления нового продукта в конец очереди (к датчику входа).
 * ID генерируется автоматически (P-001, P-002, …), либо указывается вручную.
 */
@Component({
  selector: 'app-add-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './add-product-form.html',
  styleUrl: './add-product-form.scss',
})
export class AddProductForm {
  private readonly queueStore = inject(QueueStore);
  private readonly products = this.queueStore.queue;

  protected readonly form = new FormGroup({
    id: new FormControl<string>('', {
      validators: [(control: AbstractControl<string>) => this.customIdValidator(control)],
    }),
  });

  /** Флаг первой отправки — чтобы показывать ошибки после нажатия кнопки. */
  protected readonly submitted = signal(false);

  /** Текущая ошибка поля ID (или null). */
  get idError(): string | null {
    const errors = this.form.controls.id.errors;
    if (!errors) {
      return null;
    }
    if (errors['pattern']) {
      return 'Допустимы только буквы, цифры, «_» и «-» (до 20 символов)';
    }
    if (errors['duplicate']) {
      return 'Продукт с таким ID уже есть в очереди';
    }
    return 'Некорректное значение';
  }

  onSubmit(): void {
    this.submitted.set(true);
    const control = this.form.controls.id;
    if (this.form.invalid) {
      control.markAsTouched();
      return;
    }
    const customId = control.value?.trim();
    this.queueStore.addProduct(customId || undefined);
    control.reset();
    this.submitted.set(false);
  }

  /** Пустое поле допустимо (ID сгенерируется) — валидируем только непустое. */
  private customIdValidator(control: AbstractControl<string>): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) {
      return null;
    }
    if (!CUSTOM_ID_PATTERN.test(value)) {
      return { pattern: true };
    }
    if (this.products().some((p) => p.id === value)) {
      return { duplicate: true };
    }
    return null;
  }
}
