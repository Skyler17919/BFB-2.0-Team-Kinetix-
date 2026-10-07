/** Lightweight CSV parser for client-side dataset upload preview. */

export interface ParsedDataset {
  id: string;
  fileName: string;
  uploadedAt: string;
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
  columnCount: number;
  missingCells: number;
  duplicateRows: number;
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  status: "Ready" | "Unsupported format";
  note?: string;
  /** Original file for FastAPI /api/train upload */
  file?: File;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function looksNumeric(v: string): boolean {
  if (v === "") return false;
  return /^-?\d+(\.\d+)?$/.test(v);
}

function looksDate(v: string): boolean {
  if (!v) return false;
  return !Number.isNaN(Date.parse(v)) && /[-/]/.test(v);
}

export function parseCsvText(fileName: string, text: string, file?: File): ParsedDataset {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    const empty: ParsedDataset = {
      id: crypto.randomUUID(),
      fileName,
      uploadedAt: new Date().toISOString(),
      columns: [],
      rows: [],
      rowCount: 0,
      columnCount: 0,
      missingCells: 0,
      duplicateRows: 0,
      numericColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      status: "Ready",
      note: "File appears empty or missing a header row.",
    };
    if (file) empty.file = file;
    return empty;
  }

  const columns = splitCsvLine(lines[0]!);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      row[col] = cells[i] ?? "";
    });
    return row;
  });

  let missingCells = 0;
  const seen = new Map<string, number>();
  let duplicateRows = 0;
  for (const row of rows) {
    for (const col of columns) {
      if (!row[col]) missingCells++;
    }
    const key = JSON.stringify(row);
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n === 2) duplicateRows++;
  }

  const numericColumns: string[] = [];
  const dateColumns: string[] = [];
  const categoricalColumns: string[] = [];

  for (const col of columns) {
    const vals = rows.map((r) => r[col] ?? "").filter(Boolean);
    if (!vals.length) {
      categoricalColumns.push(col);
      continue;
    }
    const numRatio = vals.filter(looksNumeric).length / vals.length;
    const dateRatio = vals.filter(looksDate).length / vals.length;
    if (numRatio >= 0.7) numericColumns.push(col);
    else if (dateRatio >= 0.6) dateColumns.push(col);
    else categoricalColumns.push(col);
  }

  const parsed: ParsedDataset = {
    id: crypto.randomUUID(),
    fileName,
    uploadedAt: new Date().toISOString(),
    columns,
    rows,
    rowCount: rows.length,
    columnCount: columns.length,
    missingCells,
    duplicateRows,
    numericColumns,
    categoricalColumns,
    dateColumns,
    status: "Ready",
  };
  if (file) parsed.file = file;
  return parsed;
}

export async function parseUploadedFile(file: File): Promise<ParsedDataset> {
  const name = file.name;
  const lower = name.toLowerCase();

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = await file.text();
    return parseCsvText(name, text, file);
  }

  if (lower.endsWith(".parquet") || lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    try {
      const { previewDataset } = await import("@/lib/mlApi");
      const preview = await previewDataset(file);
      return {
        id: crypto.randomUUID(),
        fileName: name,
        uploadedAt: new Date().toISOString(),
        columns: preview.columns,
        rows: preview.sample_rows.map((r) =>
          Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v == null ? "" : String(v)])),
        ),
        rowCount: preview.rows,
        columnCount: preview.columns.length,
        missingCells: preview.missing_values,
        duplicateRows: preview.duplicate_rows,
        numericColumns: preview.numeric_columns,
        categoricalColumns: preview.categorical_columns,
        dateColumns: preview.date_columns,
        status: "Ready",
        note: "Previewed via ML backend /api/preview",
        file,
      };
    } catch (e) {
      return {
        id: crypto.randomUUID(),
        fileName: name,
        uploadedAt: new Date().toISOString(),
        columns: [],
        rows: [],
        rowCount: 0,
        columnCount: 0,
        missingCells: 0,
        duplicateRows: 0,
        numericColumns: [],
        categoricalColumns: [],
        dateColumns: [],
        status: "Unsupported format",
        note: `Backend preview failed: ${e instanceof Error ? e.message : "unreachable"}. Start ml-backend to ingest Parquet/Excel.`,
        file,
      };
    }
  }

  return {
    id: crypto.randomUUID(),
    fileName: name,
    uploadedAt: new Date().toISOString(),
    columns: [],
    rows: [],
    rowCount: 0,
    columnCount: 0,
    missingCells: 0,
    duplicateRows: 0,
    numericColumns: [],
    categoricalColumns: [],
    dateColumns: [],
    status: "Unsupported format",
    note: "Unsupported file type. Use CSV, XLSX, or Parquet.",
    file,
  };
}
