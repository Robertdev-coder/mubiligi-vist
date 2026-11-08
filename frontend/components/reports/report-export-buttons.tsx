"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
  REGISTRATION_STATUS_LABEL,
  RELATIONSHIP_LABEL,
  TRADE_LABEL,
} from "@/shared/constants";
import {
  downloadBlob,
  formatDateKigali,
  formatTimeKigali,
  toCsv,
} from "@/shared/utils";
import type { RegistrationRow } from "@/shared/types";

const HEADERS = [
  "No.",
  "Reference",
  "Visitor",
  "Phone",
  "Relationship",
  "Student",
  "Trade",
  "Level",
  "Class",
  "Status",
  "Arrival",
  "Departure",
  "Attendance",
];

function tableData(rows: RegistrationRow[]) {
  return rows.map((row, index) => [
    String(index + 1),
    row.reference_code,
    row.visitor.full_name,
    row.visitor.phone,
    RELATIONSHIP_LABEL[row.visitor.relationship],
    row.student.full_name,
    TRADE_LABEL[row.student.trade],
    row.student.level,
    row.student.class_name,
    REGISTRATION_STATUS_LABEL[row.status],
    row.attendance?.arrival_time ? formatTimeKigali(row.attendance.arrival_time) : "—",
    row.attendance?.departure_time ? formatTimeKigali(row.attendance.departure_time) : "—",
    (row.attendance?.status ?? "expected").replace("_", " "),
  ]);
}

export function ReportExportButtons({
  rows,
  date,
}: {
  rows: RegistrationRow[];
  date: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const baseName = `mubiligi-visit-register-${date}`;

  function exportCsv() {
    try {
      setBusy("csv");
      const csv = toCsv(HEADERS, tableData(rows));
      downloadBlob(csv, `${baseName}.csv`, "text/csv;charset=utf-8");
      toast.success("CSV report downloaded.");
    } catch {
      toast.error("Could not generate the CSV report.");
    } finally {
      setBusy(null);
    }
  }

  async function exportExcel() {
    try {
      setBusy("excel");
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...tableData(rows)]);
      worksheet["!cols"] = HEADERS.map((header) => ({ wch: Math.max(12, header.length + 2) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      XLSX.writeFile(workbook, `${baseName}.xlsx`);
      toast.success("Excel report downloaded.");
    } catch {
      toast.error("Could not generate the Excel report.");
    } finally {
      setBusy(null);
    }
  }

  async function exportWord() {
    try {
      setBusy("word");
      const {
        BorderStyle,
        Document,
        HeadingLevel,
        PageOrientation,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        WidthType,
      } = await import("docx");
      const cellWidth = 15840 / HEADERS.length;
      const border = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
      const makeCell = (text: string, bold = false) =>
        new TableCell({
          width: { size: cellWidth, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold, size: 16 })],
            }),
          ],
        });
      const table = new Table({
        width: { size: 15840, type: WidthType.DXA },
        columnWidths: HEADERS.map(() => cellWidth),
        rows: [
          new TableRow({ children: HEADERS.map((header) => makeCell(header, true)) }),
          ...tableData(rows).map(
            (row) => new TableRow({ children: row.map((value) => makeCell(value)) }),
          ),
        ],
        borders: {
          top: border,
          bottom: border,
          left: border,
          right: border,
          insideHorizontal: border,
          insideVertical: border,
        },
      });
      const document = new Document({
        sections: [
          {
            properties: {
              page: {
                size: { orientation: PageOrientation.LANDSCAPE },
                margin: { top: 500, right: 500, bottom: 500, left: 500 },
              },
            },
            children: [
              new Paragraph({
                text: "MSGR MUBILIGI TSS",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({ text: "MUBILIGI VISIT DAY — Attendance Register" }),
              new Paragraph({
                text: `Visit date: ${formatDateKigali(date, "EEEE, dd MMMM yyyy")}`,
              }),
              new Paragraph({
                text: `Generated: ${formatDateKigali(new Date(), "dd MMM yyyy, HH:mm")}`,
              }),
              new Paragraph({ text: "" }),
              table,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(document);
      downloadBlob(blob, `${baseName}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      toast.success("Word report downloaded.");
    } catch {
      toast.error("Could not generate the Word report.");
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    try {
      setBusy("pdf");
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("MSGR MUBILIGI TSS", 14, 14);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("MUBILIGI VISIT DAY — Attendance Register", 14, 20);
      doc.text(`Visit date: ${formatDateKigali(date, "EEEE, dd MMMM yyyy")}`, 14, 25);
      doc.text(`Generated: ${formatDateKigali(new Date(), "dd MMM yyyy, HH:mm")}`, 14, 30);

      autoTable(doc, {
        head: [HEADERS],
        body: tableData(rows),
        startY: 35,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [20, 86, 160], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        margin: { left: 10, right: 10 },
      });

      doc.save(`${baseName}.pdf`);
      toast.success("PDF report downloaded.");
    } catch {
      toast.error("Could not generate the PDF report.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={exportCsv} disabled={busy !== null || rows.length === 0}>
        {busy === "csv" ? <Loader2 className="size-4 animate-spin" /> : <Download />}
        CSV
      </Button>
      <Button size="sm" variant="outline" onClick={exportExcel} disabled={busy !== null || rows.length === 0}>
        {busy === "excel" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet />}
        Excel
      </Button>
      <Button size="sm" variant="outline" onClick={exportWord} disabled={busy !== null || rows.length === 0}>
        {busy === "word" ? <Loader2 className="size-4 animate-spin" /> : <FileText />}
        Word
      </Button>
      <Button size="sm" variant="outline" onClick={exportPdf} disabled={busy !== null || rows.length === 0}>
        {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText />}
        PDF
      </Button>
    </div>
  );
}
