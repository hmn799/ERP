export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined
    ? ""
    : String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/*
 * Parses text produced by downloadCsv (or Excel's own CSV export) -
 * comma-delimited, \r\n or \n line endings, a cell quoted only when
 * it contains a comma/quote/newline with embedded quotes doubled -
 * back into rows of cells. Handles a quoted field spanning multiple
 * physical lines (an embedded newline), which a naive `split("\n")`
 * would break.
 */
export function parseCsv(
  text: string,
): string[][] {
  const rows: string[][] = [];

  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (
        char === '"' &&
        text[i + 1] === '"'
      ) {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\r") {
      // consumed; \n (bare or following) ends the row below
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter(
    (r) => !(r.length === 1 && r[0] === ""),
  );
}

/*
 * Turns parsed CSV rows into objects keyed by the header row, the
 * shape the bulk-import endpoints expect. Extra/missing columns per
 * row are tolerated (missing cells read back as "").
 */
export function csvRowsToObjects(
  rows: string[][],
): Record<string, string>[] {
  if (rows.length === 0) return [];

  const [header, ...dataRows] = rows;

  return dataRows.map((row) => {
    const obj: Record<string, string> = {};

    header.forEach((key, index) => {
      obj[key] = row[index] ?? "";
    });

    return obj;
  });
}

export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
) {
  const header = columns
    .map((col) => escapeCsvCell(col.header))
    .join(",");

  const lines = rows.map((row) =>
    columns
      .map((col) => escapeCsvCell(col.accessor(row)))
      .join(","),
  );

  const csv = [header, ...lines].join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
