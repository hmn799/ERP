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
