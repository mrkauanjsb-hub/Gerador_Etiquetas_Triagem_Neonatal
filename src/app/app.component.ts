import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BarcodeService } from './core/barcode.service';
import {
  buildPage, formatIdentifier, getPageCount, getValidationError,
  positionMm, SHEET, totalLabels,
  type LabelConfig, type LabelPage
} from './core/label-engine';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly barcode = inject(BarcodeService);
  private readonly fb = inject(FormBuilder);
  readonly sheet = SHEET;
  readonly slots = Array.from({ length: 80 }, (_, i) => i);
  readonly stage = signal<1 | 2 | 3>(1);
  readonly job = signal<LabelConfig | null>(null);
  readonly previewPageIndex = signal(0);
  readonly printPages = signal<LabelPage[]>([]);
  readonly preparing = signal(false);
  readonly progress = signal('');
  readonly error = signal('');
  readonly generationDate = signal(this.formatDate(new Date()));

  readonly form = this.fb.nonNullable.group({
    start: [9000000, [Validators.required, Validators.min(0)]],
    quantity: [40, [Validators.required, Validators.min(1)]],
    digits: [7, [Validators.required, Validators.min(1), Validators.max(12)]],
    copies: [2, [Validators.required, Validators.min(1)]],
    firstSlot: [1, [Validators.required, Validators.min(1), Validators.max(80)]],
    sheetStart: [1, [Validators.required, Validators.min(0)]],
    offsetX: [0, Validators.required],
    offsetY: [-3, Validators.required]
  });

  readonly pageCount = computed(() => {
    const config = this.job();
    return config ? getPageCount(config) : 0;
  });
  readonly page = computed(() => {
    const config = this.job();
    return config ? buildPage(config, this.previewPageIndex()) : null;
  });
  readonly labelCount = computed(() => {
    const config = this.job();
    return config ? totalLabels(config) : 0;
  });
  readonly firstIdentifier = computed(() => {
    const c = this.job();
    return c ? formatIdentifier(c.start, c.digits) : '';
  });
  readonly lastIdentifier = computed(() => {
    const c = this.job();
    return c ? formatIdentifier(c.start + c.quantity - 1, c.digits) : '';
  });

  createJob(): void {
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Confira os campos obrigatórios e os limites informados.');
      return;
    }
    const config = this.form.getRawValue() as LabelConfig;
    const validation = getValidationError(config);
    if (validation) {
      this.error.set(validation);
      return;
    }
    this.generationDate.set(this.formatDate(new Date()));
    this.job.set(config);
    this.previewPageIndex.set(0);
    this.printPages.set([]);
    this.stage.set(2);
    window.scrollTo({top:0, behavior:'auto'});
  }

  previousPage(): void {
    this.previewPageIndex.update(i => Math.max(0, i - 1));
  }

  nextPage(): void {
    this.previewPageIndex.update(i => Math.min(this.pageCount() - 1, i + 1));
  }

  goTo(step: 1 | 2 | 3): void {
    if (step > 1 && !this.job()) return;
    this.stage.set(step);
    this.error.set('');
    window.scrollTo({top:0, behavior:'auto'});
  }

  startOver(): void {
    this.job.set(null);
    this.printPages.set([]);
    this.error.set('');
    this.progress.set('');
    this.stage.set(1);
  }

  x(config: LabelConfig, slot: number): number { return positionMm(config, slot).left; }
  y(config: LabelConfig, slot: number): number { return positionMm(config, slot).top; }

  async print(): Promise<void> {
    const config = this.job();
    if (!config || this.preparing()) return;
    const count = getPageCount(config);
    // Uma confirmação só para trabalhos extraordinariamente grandes, sem um teto arbitrário.
    if (count > 200 && !window.confirm(`Preparar ${count} folhas pode consumir bastante memória. Continuar?`)) return;
    this.preparing.set(true);
    this.error.set('');
    this.printPages.set([]);
    try {
      let pages: LabelPage[] = [];
      for (let i = 0; i < count; i++) {
        pages.push(buildPage(config, i));
        if (pages.length === 5 || i === count - 1) {
          this.printPages.update(previous => [...previous, ...pages]);
          pages = [];
          this.progress.set(`Preparando ${i + 1} de ${count} folhas...`);
          // Cede tempo ao navegador e evita bloquear a interface durante lotes grandes.
          await new Promise<void>(resolve => setTimeout(resolve, 0));
        }
      }
      this.progress.set('Abrindo a janela de impressão...');
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      window.addEventListener('afterprint', () => this.printPages.set([]), { once: true });
      window.print();
      this.progress.set('Janela de impressão aberta. Confira o resultado no equipamento.');
    } catch (cause) {
      this.error.set('Não foi possível preparar a impressão. Reduza o lote ou tente novamente.');
      console.error(cause);
    } finally {
      this.preparing.set(false);
      // Páginas removidas no evento 'afterprint', após o diálogo do navegador fechar.
    }
  }

  private formatDate(date: Date): string {
    return [String(date.getDate()).padStart(2, '0'), String(date.getMonth() + 1).padStart(2, '0'), date.getFullYear()].join('/');
  }
}
