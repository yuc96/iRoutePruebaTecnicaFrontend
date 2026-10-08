export interface Commerce {
  id: number;
  pcProcessdate: string;
  pcNomcomred: string | null;
  pcNumdoc: string | null;
}

export interface CommerceQuarantine extends Commerce {
  motivo: string;
}

export interface PagedResult<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface ProcessResult {
  processDate: string;
  processedCount: number;
  validCount: number;
  invalidCount: number;
}

export interface CsvPreviewRow {
  pcProcessdate: string;
  pcNomcomred: string;
  pcNumdoc: string;
  observed: boolean;
}

export function isCommerceFileName(fileName: string): boolean {
  const name = fileName.split(/[/\\]/).pop() ?? '';
  return /^commerce_\d{8}\.csv$/i.test(name);
}

export function dateFromCommerceFileName(fileName: string): string | null {
  const name = fileName.split(/[/\\]/).pop() ?? '';
  const match = name.match(/^commerce_(\d{2})(\d{2})(\d{4})\.csv$/i);
  if (!match) {
    return null;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function previewRowLooksInvalid(row: CsvPreviewRow): boolean {
  const name = row.pcNomcomred.trim();
  const doc = row.pcNumdoc.trim();
  return !name || !/^\d+$/.test(doc);
}

export function parseCommerceCsv(text: string): CsvPreviewRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }

  const header = splitCsvLine(lines[0]).map((cell) => cell.trim().replace(/^\uFEFF/, '').toLowerCase());
  const dateIndex = header.indexOf('pc_processdate');
  const nameIndex = header.indexOf('pc_nomcomred');
  const docIndex = header.indexOf('pc_numdoc');
  const start = dateIndex >= 0 && nameIndex >= 0 && docIndex >= 0 ? 1 : 0;

  const rows: CsvPreviewRow[] = [];
  for (let index = start; index < lines.length; index++) {
    const parts = splitCsvLine(lines[index]);
    const date = (start === 1 ? parts[dateIndex] : parts[0] ?? '').trim();
    const name = (start === 1 ? parts[nameIndex] : parts[1] ?? '').trim();
    const doc = (start === 1 ? parts[docIndex] : parts[2] ?? '').trim();
    if (!date && !name && !doc) {
      continue;
    }
    const row: CsvPreviewRow = {
      pcProcessdate: date,
      pcNomcomred: name,
      pcNumdoc: doc,
      observed: false,
    };
    row.observed = previewRowLooksInvalid(row);
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}
