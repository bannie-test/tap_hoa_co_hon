"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";
import { Download, FileUp } from "lucide-react";
import ExcelJS from "exceljs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import Papa from "papaparse";
import { formatCurrency } from "@/lib/utils";
import { importWorkbook } from "./actions";

type Daily = { day: string; revenue: number; orders: number };
type Cat = { category: string; revenue: number; orders: number };
type Top = { product_id: string; name: string; units: number; revenue: number };

const workbookColumns = {
  Categories: ["name", "description"],
  Products: [
    "name",
    "sku",
    "category_id",
    "category_name",
    "price",
    "cost",
    "stock",
    "low_stock_threshold",
  ],
  Sales: [
    "product_id",
    "product_name",
    "quantity",
    "unit_price",
    "customer_name",
    "customer_phone",
    "note",
  ],
} as const;

export function ReportsClient({
  from,
  to,
  daily,
  category,
  top,
}: {
  from: string;
  to: string;
  daily: Daily[];
  category: Cat[];
  top: Top[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [fromS, setFromS] = useState(from);
  const [toS, setToS] = useState(to);
  const [importPending, startImport] = useTransition();
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function apply() {
    const next = new URLSearchParams(params);
    next.set("from", fromS);
    next.set("to", toS);
    router.push(`/admin/reports?${next.toString()}`);
  }

  function download(name: string, rows: unknown[]) {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadImportTemplate() {
    const workbook = new ExcelJS.Workbook();
    for (const [sheetName, columns] of Object.entries(workbookColumns)) {
      workbook.addWorksheet(sheetName).addRow(Array.from(columns));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-import-template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  function onImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setImportError(null);
    setImportMessage(null);
    startImport(async () => {
      try {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Choose an XLSX file smaller than 10 MB.");
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const rows = {} as Record<
          keyof typeof workbookColumns,
          Record<string, unknown>[]
        >;

        for (const [sheetName, columns] of Object.entries(workbookColumns)) {
          const sheet = workbook.getWorksheet(sheetName);
          if (!sheet) throw new Error(`Missing required sheet: ${sheetName}.`);

          const headerRow = sheet.getRow(1);
          const headers = Array.from(
            { length: headerRow.cellCount },
            (_, index) =>
              String(headerRow.getCell(index + 1).value ?? "").trim(),
          );
          const missing = columns.filter((column) => !headers.includes(column));
          if (missing.length) {
            throw new Error(
              `${sheetName} sheet is missing columns: ${missing.join(", ")}.`,
            );
          }

          const sheetRows: Record<string, unknown>[] = [];
          sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return;
            const values: Record<string, unknown> = {};
            headers.forEach((header, index) => {
              const cell = row.getCell(index + 1);
              const value = cell.value;
              values[header] =
                typeof value === "object" && value !== null
                  ? cell.text
                  : (value ?? "");
            });
            if (Object.values(values).some((value) => value !== "")) {
              sheetRows.push(values);
            }
          });
          rows[sheetName as keyof typeof workbookColumns] = sheetRows;
        }

        const result = await importWorkbook(rows);
        if ("error" in result) {
          const imported = result.imported;
          setImportError(
            `${result.error}${result.moreErrors ? `\nAnd ${result.moreErrors} more validation errors.` : ""}`,
          );
          if (imported) {
            setImportMessage(
              `Imported before error: ${imported.categories} categories, ${imported.products} products, ${imported.sales} sales.`,
            );
          }
          return;
        }

        setImportMessage(
          `Imported ${result.imported.categories} categories, ${result.imported.products} products, and ${result.imported.sales} sales.`,
        );
      } catch (error) {
        setImportError(
          error instanceof Error
            ? error.message
            : "Unable to read this workbook.",
        );
      }
    });
  }

  const totals = daily.reduce(
    (a, d) => ({
      revenue: a.revenue + Number(d.revenue),
      orders: a.orders + Number(d.orders),
    }),
    { revenue: 0, orders: 0 },
  );

  return (
    <>
      <section className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium">Import workbook</h3>
            <p className="text-sm text-slate-500">
              Upload an XLSX with Categories, Products, and Sales sheets.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadImportTemplate}
            className="border rounded px-3 py-2 text-sm flex items-center gap-2"
          >
            <Download size={15} /> Template
          </button>
        </div>
        <label className="inline-flex items-center gap-2 bg-slate-900 text-white rounded px-3 py-2 text-sm cursor-pointer">
          <FileUp size={16} />
          {importPending ? "Importing…" : "Choose XLSX file"}
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onImportFile}
            disabled={importPending}
            className="sr-only"
          />
        </label>
        <p className="text-xs text-slate-500">
          Categories are imported first, then products, then sales. Use
          category_name and product_name to link rows by exact name, or provide
          IDs.
        </p>
        {importMessage && (
          <p role="status" className="text-sm text-green-700">
            {importMessage}
          </p>
        )}
        {importError && (
          <pre
            role="alert"
            className="text-sm text-red-600 whitespace-pre-wrap"
          >
            {importError}
          </pre>
        )}
      </section>

      <div className="bg-white p-3 rounded-xl shadow-sm flex flex-wrap gap-2 items-center">
        <label className="text-sm">From</label>
        <input
          type="date"
          value={fromS}
          onChange={(e) => setFromS(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <label className="text-sm">To</label>
        <input
          type="date"
          value={toS}
          onChange={(e) => setToS(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={apply}
          className="bg-slate-900 text-white rounded px-3 py-1 text-sm"
        >
          Apply
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => download("daily.csv", daily)}
            className="border rounded px-3 py-1 text-sm flex items-center gap-1"
          >
            <Download size={14} />
            Daily
          </button>
          <button
            onClick={() => download("by-category.csv", category)}
            className="border rounded px-3 py-1 text-sm flex items-center gap-1"
          >
            <Download size={14} />
            Category
          </button>
          <button
            onClick={() => download("top-products.csv", top)}
            className="border rounded px-3 py-1 text-sm flex items-center gap-1"
          >
            <Download size={14} />
            Top
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-slate-500">Total Revenue</div>
          <div className="text-2xl font-semibold">
            {formatCurrency(totals.revenue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-slate-500">Total Orders</div>
          <div className="text-2xl font-semibold">{totals.orders}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-slate-500">Avg. Order Value</div>
          <div className="text-2xl font-semibold">
            {formatCurrency(totals.orders ? totals.revenue / totals.orders : 0)}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="font-medium mb-4">Revenue by day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0f172a"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-medium mb-4">Revenue by category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={category}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="revenue" fill="#0f172a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-medium mb-4">Top products</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Units</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top.map((t) => (
                <tr key={t.product_id} className="border-t">
                  <td className="py-2">{t.name}</td>
                  <td className="py-2 text-right">{t.units}</td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(t.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
