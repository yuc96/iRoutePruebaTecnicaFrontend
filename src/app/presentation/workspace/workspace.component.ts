import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { CommercePort } from '../../application/ports/commerce.port';
import {
  Commerce,
  CommerceQuarantine,
  CsvPreviewRow,
  ProcessResult,
  dateFromCommerceFileName,
  isCommerceFileName,
  parseCommerceCsv,
} from '../../domain/commerce';
import { TokenStore } from '../../infrastructure/storage/token.store';
import { ThemeService } from '../shared/theme.service';

type Tab = 'upload' | 'valid' | 'quarantine';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './workspace.component.html',
})
export class WorkspaceComponent implements OnDestroy {
  private readonly commerces = inject(CommercePort);
  private readonly tokens = inject(TokenStore);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  readonly email = this.tokens.email;
  tab = signal<Tab>('upload');
  processDate = '';
  uploadedDates = signal<string[]>([]);
  stats = signal<ProcessResult>({
    processDate: '2026-10-08',
    processedCount: 0,
    validCount: 0,
    invalidCount: 0,
  });

  validItems = signal<Commerce[]>([]);
  validTotal = signal(0);
  validPage = signal(1);
  validSearch = '';
  quarantineItems = signal<CommerceQuarantine[]>([]);
  quarantineTotal = signal(0);
  quarantinePage = signal(1);
  quarantineSearch = '';
  readonly pageSize = 20;

  previewOpen = signal(false);
  previewRows = signal<CsvPreviewRow[]>([]);
  pendingFile: File | null = null;
  uploading = signal(false);
  processing = signal(false);
  summaryOpen = signal(false);
  message = signal('');
  error = signal('');

  private readonly validSearch$ = new Subject<string>();
  private readonly quarantineSearch$ = new Subject<string>();
  private readonly subs = new Subscription();

  constructor() {
    this.subs.add(
      this.validSearch$.pipe(debounceTime(300)).subscribe(() => {
        this.validPage.set(1);
        void this.refreshValid();
      }),
    );
    this.subs.add(
      this.quarantineSearch$.pipe(debounceTime(300)).subscribe(() => {
        this.quarantinePage.set(1);
        void this.refreshQuarantine();
      }),
    );
    void this.refreshDates();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  switchTab(tab: Tab): void {
    this.tab.set(tab);
  }

  logout(): void {
    this.tokens.clear();
    void this.router.navigateByUrl('/login');
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      void this.openPreview(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      void this.openPreview(file);
    }
  }

  async loadSample(): Promise<void> {
    this.error.set('');
    try {
      const response = await fetch('/assets/commerce_08102026.csv');
      if (!response.ok) {
        this.error.set('No se encontró el CSV de muestra.');
        return;
      }
      const blob = await response.blob();
      const file = new File([blob], 'commerce_08102026.csv', { type: 'text/csv' });
      await this.openPreview(file);
    } catch {
      this.error.set('No se pudo leer el CSV de muestra.');
    }
  }

  private async openPreview(file: File): Promise<void> {
    this.error.set('');
    if (!isCommerceFileName(file.name)) {
      this.error.set('El archivo debe llamarse commerce_DDMMYYYY.csv.');
      return;
    }
    const text = await file.text();
    const rows = parseCommerceCsv(text);
    if (rows.length === 0) {
      this.error.set('El archivo está vacío.');
      return;
    }
    this.pendingFile = file;
    this.previewRows.set(rows);
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  async confirmUpload(): Promise<void> {
    if (!this.pendingFile) {
      return;
    }
    this.uploading.set(true);
    this.error.set('');
    try {
      const inserted = await this.commerces.upload(this.pendingFile);
      const uploadedDate = dateFromCommerceFileName(this.pendingFile.name);
      this.previewOpen.set(false);
      await this.refreshDates(uploadedDate);
      this.message.set(`Se cargaron ${inserted} filas en commerce. Ve a Comercios Válidos y pulsa Procesar Fecha.`);
    } catch (err) {
      this.error.set(this.readError(err, 'No se pudo subir el archivo.'));
    } finally {
      this.uploading.set(false);
    }
  }

  async processDateNow(): Promise<void> {
    if (!this.processDate) {
      this.message.set('');
      this.error.set('No existen archivos que procesar. Sube un CSV en Carga CSV.');
      return;
    }
    this.processing.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const result = await this.commerces.process(this.processDate);
      this.stats.set(result);
      this.validPage.set(1);
      this.quarantinePage.set(1);
      await Promise.all([this.refreshValid(), this.refreshQuarantine()]);
      if (result.processedCount === 0) {
        this.summaryOpen.set(false);
        this.message.set(
          `No existen archivos que procesar para la fecha ${result.processDate}. Sube un CSV en Carga CSV y vuelve a intentar.`,
        );
        return;
      }
      this.summaryOpen.set(true);
    } catch (err) {
      this.error.set(this.readError(err, 'No se pudo procesar la fecha.'));
    } finally {
      this.processing.set(false);
    }
  }

  closeSummary(): void {
    this.summaryOpen.set(false);
  }

  goFromSummary(tab: Tab): void {
    this.summaryOpen.set(false);
    this.tab.set(tab);
  }

  onProcessDateChange(): void {
    this.validPage.set(1);
    this.quarantinePage.set(1);
    void this.refreshValid();
    void this.refreshQuarantine();
  }

  onValidSearch(): void {
    this.validSearch$.next(this.validSearch);
  }

  onQuarantineSearch(): void {
    this.quarantineSearch$.next(this.quarantineSearch);
  }

  async changeValidPage(delta: number): Promise<void> {
    const max = Math.max(1, Math.ceil(this.validTotal() / this.pageSize));
    const next = Math.min(max, Math.max(1, this.validPage() + delta));
    if (next === this.validPage()) {
      return;
    }
    this.validPage.set(next);
    await this.refreshValid();
  }

  async changeQuarantinePage(delta: number): Promise<void> {
    const max = Math.max(1, Math.ceil(this.quarantineTotal() / this.pageSize));
    const next = Math.min(max, Math.max(1, this.quarantinePage() + delta));
    if (next === this.quarantinePage()) {
      return;
    }
    this.quarantinePage.set(next);
    await this.refreshQuarantine();
  }

  async exportQuarantine(): Promise<void> {
    if (!this.processDate) {
      this.error.set('Elige una fecha de archivo subido para descargar.');
      return;
    }
    try {
      const blob = await this.commerces.exportQuarantine(this.processDate);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const compact = this.processDate.replaceAll('-', '');
      const day = compact.slice(6, 8);
      const month = compact.slice(4, 6);
      const year = compact.slice(0, 4);
      link.href = url;
      link.download = `commerce_${day}${month}${year}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      this.error.set('No se pudo descargar la cuarentena.');
    }
  }

  validRangeLabel(): string {
    return this.rangeLabel(this.validPage(), this.validTotal());
  }

  quarantineRangeLabel(): string {
    return this.rangeLabel(this.quarantinePage(), this.quarantineTotal());
  }

  validPercent(): number {
    const total = this.stats().processedCount;
    return total > 0 ? Math.round((this.stats().validCount / total) * 100) : 0;
  }

  invalidPercent(): number {
    const total = this.stats().processedCount;
    return total > 0 ? Math.round((this.stats().invalidCount / total) * 100) : 0;
  }

  private rangeLabel(page: number, total: number): string {
    if (total === 0) {
      return 'Mostrando 0-0 de 0';
    }
    const start = (page - 1) * this.pageSize + 1;
    const end = Math.min(page * this.pageSize, total);
    return `Mostrando ${start}-${end} de ${total}`;
  }

  private async refreshDates(prefer?: string | null): Promise<void> {
    const dates = await this.commerces.listDates();
    this.uploadedDates.set(dates);
    const next = prefer && dates.includes(prefer) ? prefer : dates.includes(this.processDate) ? this.processDate : (dates[0] ?? '');
    this.processDate = next;
    this.validPage.set(1);
    this.quarantinePage.set(1);
    await Promise.all([this.refreshValid(), this.refreshQuarantine()]);
  }

  private async refreshValid(): Promise<void> {
    if (!this.processDate) {
      this.validItems.set([]);
      this.validTotal.set(0);
      this.validPage.set(1);
      return;
    }
    const page = await this.commerces.list({
      processDate: this.processDate,
      page: this.validPage(),
      pageSize: this.pageSize,
      search: this.validSearch,
    });
    this.validItems.set(page.items);
    this.validTotal.set(page.total);
    this.validPage.set(page.page);
  }

  private async refreshQuarantine(): Promise<void> {
    if (!this.processDate) {
      this.quarantineItems.set([]);
      this.quarantineTotal.set(0);
      this.quarantinePage.set(1);
      return;
    }
    const page = await this.commerces.listQuarantine({
      processDate: this.processDate,
      page: this.quarantinePage(),
      pageSize: this.pageSize,
      search: this.quarantineSearch,
    });
    this.quarantineItems.set(page.items);
    this.quarantineTotal.set(page.total);
    this.quarantinePage.set(page.page);
  }

  private readError(err: unknown, fallback: string): string {
    const body = (err as { error?: { title?: string } })?.error;
    return body?.title ?? fallback;
  }
}
