import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommercePort, CommerceQuery } from '../../application/ports/commerce.port';
import {
  Commerce,
  CommerceQuarantine,
  PagedResult,
  ProcessResult,
} from '../../domain/commerce';

@Injectable({ providedIn: 'root' })
export class HttpCommerceAdapter extends CommercePort {
  private readonly http = inject(HttpClient);

  async upload(file: File): Promise<number> {
    const form = new FormData();
    form.append('file', file, file.name);
    const body = await firstValueFrom(
      this.http.post<{ insertedCount: number }>('/api/commerces/upload', form),
    );
    return body.insertedCount;
  }

  process(processDate: string): Promise<ProcessResult> {
    return firstValueFrom(
      this.http.post<ProcessResult>('/api/commerces/process', { processDate }),
    );
  }

  async listDates(): Promise<string[]> {
    const body = await firstValueFrom(this.http.get<{ dates: string[] }>('/api/commerces/dates'));
    return body.dates ?? [];
  }

  list(query: CommerceQuery): Promise<PagedResult<Commerce>> {
    return firstValueFrom(
      this.http.get<PagedResult<Commerce>>('/api/commerces', { params: this.toParams(query) }),
    );
  }

  listQuarantine(query: CommerceQuery): Promise<PagedResult<CommerceQuarantine>> {
    return firstValueFrom(
      this.http.get<PagedResult<CommerceQuarantine>>('/api/commerces/quarantine', {
        params: this.toParams(query),
      }),
    );
  }

  exportQuarantine(processDate: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get('/api/commerces/quarantine/export', {
        params: { processDate },
        responseType: 'blob',
      }),
    );
  }

  private toParams(query: CommerceQuery): HttpParams {
    let params = new HttpParams()
      .set('processDate', query.processDate)
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    return params;
  }
}
