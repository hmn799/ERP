import ExcelJS from "exceljs";

import type { CsvColumn } from "./csv";

/*
 * Mirrors downloadCsv's exact signature so any existing CSV export
 * call site can add an Excel option by reusing the same columns
 * array, rather than defining the export shape twice.
 */
export async function downloadXlsx<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.header,
    width: Math.max(col.header.length + 4, 14),
  }));

  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(
      columns.map((col) => col.accessor(row) ?? ""),
    );
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
