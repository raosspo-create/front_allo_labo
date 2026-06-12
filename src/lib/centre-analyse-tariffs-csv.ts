export type TariffCsvRow = {
  line: number;
  centre?: string;
  code?: string;
  name?: string;
  price: number | null;
};

type AnalyseRef = { id: string; code?: string | null; name: string };

type TariffExportRow = {
  centre: { siteName: string };
  analyse: { code?: string | null; name: string };
  price: string;
  currency: string;
  active: boolean;
};

const HEADER_EXPORT =
  'centre;code_analyse;nom_analyse;prix;devise;actif';
const HEADER_TEMPLATE = 'centre;code_analyse;nom_analyse;prix';

function escapeCsvCell(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function detectSeparator(headerLine: string): string {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi >= comma ? ';' : ',';
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_');
}

function parsePrice(raw: string | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function tariffsToCsv(rows: TariffExportRow[]): string {
  const lines = [HEADER_EXPORT];
  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(row.centre.siteName),
        escapeCsvCell(row.analyse.code ?? ''),
        escapeCsvCell(row.analyse.name),
        row.price,
        escapeCsvCell(row.currency || 'XOF'),
        row.active ? 'oui' : 'non',
      ].join(';'),
    );
  }
  return lines.join('\r\n');
}

export function tariffsTemplateCsv(
  centreName: string,
  analyses: AnalyseRef[],
  priceByAnalyseId: Record<string, string>,
): string {
  const lines = [HEADER_TEMPLATE];
  for (const a of analyses) {
    const price = priceByAnalyseId[a.id]?.trim() ?? '';
    lines.push(
      [
        escapeCsvCell(centreName),
        escapeCsvCell(a.code ?? ''),
        escapeCsvCell(a.name),
        price,
      ].join(';'),
    );
  }
  return lines.join('\r\n');
}

export function parseTariffsCsv(text: string): TariffCsvRow[] {
  const normalized = text.replace(/^\uFEFF/, '').trim();
  if (!normalized) return [];

  const lines = normalized.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  const sep = detectSeparator(lines[0]);
  const headerCells = lines[0].split(sep).map(normalizeHeader);
  const hasHeader = headerCells.some((h) =>
    ['code_analyse', 'code', 'nom_analyse', 'nom', 'name', 'prix', 'price', 'centre'].includes(h),
  );

  const idx = {
    centre: headerCells.findIndex((h) => h === 'centre'),
    code: headerCells.findIndex((h) => h === 'code_analyse' || h === 'code'),
    name: headerCells.findIndex((h) =>
      ['nom_analyse', 'nom', 'name', 'analyse'].includes(h),
    ),
    price: headerCells.findIndex((h) => h === 'prix' || h === 'price' || h === 'montant'),
    active: headerCells.findIndex((h) => h === 'actif' || h === 'active'),
  };

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const fallbackHasCode = !hasHeader && lines[0].split(sep).length >= 2;

  const out: TariffCsvRow[] = [];

  for (let i = 0; i < dataLines.length; i += 1) {
    const lineNo = hasHeader ? i + 2 : i + 1;
    const cells = dataLines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));

    let code: string | undefined;
    let name: string | undefined;
    let centre: string | undefined;
    let priceRaw: string | undefined;

    if (hasHeader) {
      code = idx.code >= 0 ? cells[idx.code] : undefined;
      name = idx.name >= 0 ? cells[idx.name] : undefined;
      centre = idx.centre >= 0 ? cells[idx.centre] : undefined;
      priceRaw = idx.price >= 0 ? cells[idx.price] : undefined;
    } else if (fallbackHasCode) {
      code = cells[0];
      name = cells[1];
      priceRaw = cells[2];
    } else {
      name = cells[0];
      priceRaw = cells[1];
    }

    if (!code?.trim() && !name?.trim()) continue;

    out.push({
      line: lineNo,
      centre: centre?.trim() || undefined,
      code: code?.trim() || undefined,
      name: name?.trim() || undefined,
      price: parsePrice(priceRaw),
    });
  }

  return out;
}

export function resolveAnalyseFromCsvRow(
  row: TariffCsvRow,
  analyses: AnalyseRef[],
): AnalyseRef | null {
  if (row.code) {
    const codeLower = row.code.toLowerCase();
    const byCode = analyses.find(
      (a) => a.code?.trim().toLowerCase() === codeLower,
    );
    if (byCode) return byCode;
  }
  if (row.name) {
    const nameLower = row.name.toLowerCase();
    const byName = analyses.find((a) => a.name.trim().toLowerCase() === nameLower);
    if (byName) return byName;
  }
  return null;
}
