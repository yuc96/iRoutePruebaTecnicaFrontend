import {
  Commerce,
  CommerceQuarantine,
  PagedResult,
  ProcessResult,
} from '../../domain/commerce';

export interface CommerceQuery {
  processDate: string;
  page: number;
  pageSize: number;
  search?: string;
}

export abstract class CommercePort {
  abstract upload(file: File): Promise<number>;

  abstract process(processDate: string): Promise<ProcessResult>;

  abstract listDates(): Promise<string[]>;

  abstract list(query: CommerceQuery): Promise<PagedResult<Commerce>>;

  abstract listQuarantine(query: CommerceQuery): Promise<PagedResult<CommerceQuarantine>>;

  abstract exportQuarantine(processDate: string): Promise<Blob>;
}
