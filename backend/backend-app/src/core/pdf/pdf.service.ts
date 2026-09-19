import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

interface CompanyProfile {
  name: string;
  gstin?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

function money(value: number | string | null | undefined): string {
  return `Rs. ${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN");
}

@Injectable()
export class PdfService {
  private drawLetterhead(
    doc: PDFKit.PDFDocument,
    company: CompanyProfile | null,
    title: string,
  ) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(company?.name ?? "Company Name", { align: "center" });

    doc.font("Helvetica").fontSize(9);

    const details = [
      company?.address,
      company?.phone ? `Ph: ${company.phone}` : null,
      company?.gstin ? `GSTIN: ${company.gstin}` : null,
    ]
      .filter(Boolean)
      .join("  |  ");

    if (details) {
      doc.text(details, { align: "center" });
    }

    doc.moveDown(0.5);

    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    doc.moveDown(0.5);

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text(title, { align: "center" });

    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(10);
  }

  private drawTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    columns: { text: string; x: number; width: number; align?: "left" | "right" | "center" }[],
    bold = false,
  ) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);

    for (const col of columns) {
      doc.text(col.text, col.x, y, {
        width: col.width,
        align: col.align ?? "left",
      });
    }
  }

  // =========================================================
  // SALES INVOICE
  // =========================================================

  generateInvoicePdf(
    bill: {
      billNo: string;
      billDate: Date | string;
      isCredit?: boolean;
      customer?: { name: string; gstin?: string | null; mobile?: string | null; address?: string | null } | null;
      warehouse?: { name: string } | null;
      items: {
        item?: { name: string; itemCode: string } | null;
        batch?: { batchNo: string } | null;
        qty: number | string;
        saleRate: number | string;
        discountPercent: number | string;
        gstPercent: number | string;
        netAmount: number | string;
      }[];
      grossAmount: number | string;
      itemDiscountAmount: number | string;
      billDiscountAmount: number | string;
      taxableAmount: number | string;
      cgstAmount: number | string;
      sgstAmount: number | string;
      igstAmount: number | string;
      finalPayable: number | string;
    },
    company: CompanyProfile | null,
  ): PDFKit.PDFDocument {
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    this.drawLetterhead(doc, company, "TAX INVOICE");

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    doc.text(`Invoice No: ${bill.billNo}`, left, doc.y, { continued: true });
    doc.text(`Date: ${formatDate(bill.billDate)}`, {
      align: "right",
    });

    doc.moveDown(0.3);
    doc.text(`Type: ${bill.isCredit ? "Credit" : "Cash"} Sale`);

    if (bill.warehouse?.name) {
      doc.text(`Warehouse: ${bill.warehouse.name}`);
    }

    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").text("Bill To:");
    doc.font("Helvetica");
    doc.text(bill.customer?.name ?? "Cash Customer");

    if (bill.customer?.address) doc.text(bill.customer.address);
    if (bill.customer?.mobile) doc.text(`Mobile: ${bill.customer.mobile}`);
    if (bill.customer?.gstin) doc.text(`GSTIN: ${bill.customer.gstin}`);

    doc.moveDown(0.8);

    const columns = [
      { key: "sn", header: "#", x: left, width: 25, align: "left" as const },
      { key: "item", header: "Item", x: left + 25, width: 155, align: "left" as const },
      { key: "batch", header: "Batch", x: left + 180, width: 55, align: "left" as const },
      { key: "qty", header: "Qty", x: left + 235, width: 40, align: "right" as const },
      { key: "rate", header: "Rate", x: left + 275, width: 55, align: "right" as const },
      { key: "disc", header: "Disc%", x: left + 330, width: 40, align: "right" as const },
      { key: "gst", header: "GST%", x: left + 370, width: 40, align: "right" as const },
      { key: "amount", header: "Amount", x: left + 410, width: width - 410, align: "right" as const },
    ];

    let y = doc.y;

    this.drawTableRow(
      doc,
      y,
      columns.map((c) => ({ text: c.header, x: c.x, width: c.width, align: c.align })),
      true,
    );

    y += 14;
    doc.moveTo(left, y).lineTo(right, y).stroke();
    y += 4;

    bill.items.forEach((line, index) => {
      const rowValues: Record<string, string> = {
        sn: String(index + 1),
        item: `${line.item?.itemCode ?? ""} ${line.item?.name ?? ""}`.trim(),
        batch: line.batch?.batchNo ?? "-",
        qty: String(Number(line.qty)),
        rate: Number(line.saleRate).toFixed(2),
        disc: Number(line.discountPercent).toFixed(1),
        gst: Number(line.gstPercent).toFixed(1),
        amount: Number(line.netAmount).toFixed(2),
      };

      this.drawTableRow(
        doc,
        y,
        columns.map((c) => ({
          text: rowValues[c.key],
          x: c.x,
          width: c.width,
          align: c.align,
        })),
      );

      y += 16;

      if (y > doc.page.height - 150) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    });

    doc.moveTo(left, y).lineTo(right, y).stroke();
    y += 10;

    doc.y = y;

    const summaryX = left + width - 200;

    const summaryRows: [string, string][] = [
      ["Gross Amount", money(bill.grossAmount)],
      ["Item Discount", money(bill.itemDiscountAmount)],
      ["Bill Discount", money(bill.billDiscountAmount)],
      ["Taxable Amount", money(bill.taxableAmount)],
      ["CGST", money(bill.cgstAmount)],
      ["SGST", money(bill.sgstAmount)],
      ["IGST", money(bill.igstAmount)],
    ];

    for (const [label, value] of summaryRows) {
      doc.font("Helvetica").fontSize(9);
      doc.text(label, summaryX, doc.y, { width: 100, continued: true });
      doc.text(value, { width: 100, align: "right" });
    }

    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Total Payable", summaryX, doc.y, { width: 100, continued: true });
    doc.text(money(bill.finalPayable), { width: 100, align: "right" });

    doc.moveDown(2);
    doc.font("Helvetica").fontSize(8).text(
      "This is a computer-generated invoice.",
      left,
      doc.page.height - doc.page.margins.bottom - 20,
      { width, align: "center" },
    );

    doc.end();

    return doc;
  }

  // =========================================================
  // PARTY STATEMENT
  // =========================================================

  generateStatementPdf(
    party: {
      name: string;
      code?: string;
      gstin?: string | null;
      address?: string | null;
      mobile?: string | null;
    },
    statement: {
      openingBalance: number;
      closingBalance: number;
      transactions: {
        date: Date | string;
        type: string;
        debit: number;
        credit: number;
        balance: number;
        remarks?: string | null;
      }[];
    },
    company: CompanyProfile | null,
    from: string,
    to: string,
  ): PDFKit.PDFDocument {
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    this.drawLetterhead(doc, company, "ACCOUNT STATEMENT");

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    doc.font("Helvetica-Bold").text(party.name);
    doc.font("Helvetica");
    if (party.address) doc.text(party.address);
    if (party.mobile) doc.text(`Mobile: ${party.mobile}`);
    if (party.gstin) doc.text(`GSTIN: ${party.gstin}`);

    doc.moveDown(0.3);
    doc.text(`Statement Period: ${formatDate(from)} to ${formatDate(to)}`);

    doc.moveDown(0.6);

    const columns = [
      { key: "date", header: "Date", x: left, width: 70, align: "left" as const },
      { key: "type", header: "Type", x: left + 70, width: 100, align: "left" as const },
      { key: "remarks", header: "Remarks", x: left + 170, width: width - 170 - 250, align: "left" as const },
      { key: "debit", header: "Debit", x: right - 250, width: 80, align: "right" as const },
      { key: "credit", header: "Credit", x: right - 165, width: 80, align: "right" as const },
      { key: "balance", header: "Balance", x: right - 80, width: 80, align: "right" as const },
    ];

    let y = doc.y;

    this.drawTableRow(
      doc,
      y,
      columns.map((c) => ({ text: c.header, x: c.x, width: c.width, align: c.align })),
      true,
    );

    y += 14;
    doc.moveTo(left, y).lineTo(right, y).stroke();
    y += 4;

    this.drawTableRow(doc, y, [
      { text: "", x: left, width: 170 },
      { text: "Opening Balance", x: left + 170, width: width - 170 - 250 },
      { text: "", x: right - 250, width: 80, align: "right" },
      { text: "", x: right - 165, width: 80, align: "right" },
      {
        text: money(statement.openingBalance),
        x: right - 80,
        width: 80,
        align: "right",
      },
    ]);

    y += 16;

    for (const row of statement.transactions) {
      const values = {
        date: formatDate(row.date),
        type: row.type,
        remarks: row.remarks ?? "",
        debit: row.debit ? row.debit.toFixed(2) : "",
        credit: row.credit ? row.credit.toFixed(2) : "",
        balance: row.balance.toFixed(2),
      };

      this.drawTableRow(
        doc,
        y,
        columns.map((c) => ({
          text: (values as Record<string, string>)[c.key],
          x: c.x,
          width: c.width,
          align: c.align,
        })),
      );

      y += 16;

      if (y > doc.page.height - 100) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    doc.moveTo(left, y).lineTo(right, y).stroke();
    y += 6;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Closing Balance", left, y, { width: width - 80 });
    doc.text(money(statement.closingBalance), right - 80, y, {
      width: 80,
      align: "right",
    });

    doc.end();

    return doc;
  }
}
