import type { Collection } from './collections';

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'lista'
  );
}

function formatDateForFilename(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildCsv(collection: Collection): string {
  const headers = ['source_url', 'source_title', 'captured_at', ...collection.schema.map((f) => f.key)];
  const rows = [headers.join(',')];
  for (const item of collection.items) {
    const baseCells = [
      escapeCsvCell(item.source.url),
      escapeCsvCell(item.source.title),
      escapeCsvCell(new Date(item.source.capturedAt).toISOString()),
    ];
    const schemaCells = collection.schema.map((f) => escapeCsvCell(item.values[f.key]));
    rows.push([...baseCells, ...schemaCells].join(','));
  }
  return rows.join('\n');
}

export async function downloadCsv(collection: Collection): Promise<void> {
  const csv = buildCsv(collection);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `${slugify(collection.name)}-${formatDateForFilename(Date.now())}.csv`;
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
