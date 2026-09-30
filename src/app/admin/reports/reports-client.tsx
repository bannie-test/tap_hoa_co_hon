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
import { formatCurrency, formatDay } from "@/lib/utils";
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
          throw new Error("Vui lòng chọn tệp XLSX có dung lượng dưới 10 MB.");
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const rows = {} as Record<
          keyof typeof workbookColumns,
          Record<string, unknown>[]
        >;

        for (const [sheetName, columns] of Object.entries(workbookColumns)) {
          const sheet = workbook.getWorksheet(sheetName);
          if (!sheet)
            throw new Error(`Thiếu trang tính bắt buộc: ${sheetName}.`);

          const headerRow = sheet.getRow(1);
          const headers = Array.from(
            { length: headerRow.cellCount },
            (_, index) =>
              String(headerRow.getCell(index + 1).value ?? "").trim(),
          );
          const missing = columns.filter((column) => !headers.includes(column));
          if (missing.length) {
            throw new Error(
              `Trang tính ${sheetName} thiếu các cột bắt buộc: ${missing.join(", ")}.`,
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
            `${result.error}${result.moreErrors ? `\nVà còn ${result.moreErrors} lỗi kiểm tra dữ liệu khác.` : ""}`,
          );
          if (imported) {
            setImportMessage(
              `Đã nhập trước khi xảy ra lỗi: ${imported.categories} danh mục, ${imported.products} sản phẩm, ${imported.sales} giao dịch.`,
            );
          }
          return;
        }

        setImportMessage(
          `Đã nhập ${result.imported.categories} danh mục, ${result.imported.products} sản phẩm và ${result.imported.sales} giao dịch.`,
        );
      } catch {
        setImportError(
          "Không thể đọc tệp XLSX. Vui lòng kiểm tra định dạng và cấu trúc tệp.",
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
      <section className="bauhaus-panel bauhaus-shadow space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold uppercase">Nhập dữ liệu từ tệp</h3>
            <p className="text-sm text-black/65">
              Tải lên tệp XLSX có các trang tính Categories, Products và Sales.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadImportTemplate}
            className="bauhaus-button bauhaus-button-outline text-sm"
          >
            <Download size={15} /> Tệp mẫu
          </button>
        </div>
        <label className="bauhaus-button bauhaus-button-blue cursor-pointer text-sm">
          <FileUp size={16} />
          {importPending ? "Đang nhập…" : "Chọn tệp XLSX"}
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onImportFile}
            disabled={importPending}
            className="sr-only"
          />
        </label>
        <p className="text-xs text-black/65">
          Dữ liệu được nhập theo thứ tự danh mục, sản phẩm rồi giao dịch. Dùng
          category_name và product_name để liên kết theo tên chính xác, hoặc
          cung cấp mã định danh.
        </p>
        {importMessage && (
          <p role="status" className="text-sm font-bold text-[#1040C0]">
            {importMessage}
          </p>
        )}
        {importError && (
          <pre
            role="alert"
            className="whitespace-pre-wrap text-sm font-bold text-[#D02020]"
          >
            {importError}
          </pre>
        )}
      </section>

      <div className="bauhaus-panel flex flex-wrap items-center gap-2 p-3">
        <label htmlFor="reports-from" className="text-sm font-bold uppercase">
          Từ ngày
        </label>
        <input
          id="reports-from"
          type="date"
          value={fromS}
          onChange={(e) => setFromS(e.target.value)}
          className="bauhaus-field w-auto text-sm"
        />
        <label htmlFor="reports-to" className="text-sm font-bold uppercase">
          Đến ngày
        </label>
        <input
          id="reports-to"
          type="date"
          value={toS}
          onChange={(e) => setToS(e.target.value)}
          className="bauhaus-field w-auto text-sm"
        />
        <button
          onClick={apply}
          className="bauhaus-button bauhaus-button-blue text-sm"
        >
          Áp dụng
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => download("daily.csv", daily)}
            className="bauhaus-button bauhaus-button-outline text-sm"
          >
            <Download size={14} />
            Theo ngày
          </button>
          <button
            onClick={() => download("by-category.csv", category)}
            className="bauhaus-button bauhaus-button-outline text-sm"
          >
            <Download size={14} />
            Theo danh mục
          </button>
          <button
            onClick={() => download("top-products.csv", top)}
            className="bauhaus-button bauhaus-button-outline text-sm"
          >
            <Download size={14} />
            Bán chạy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y-2 divide-black border-4 border-black bg-[#F0C020] sm:grid-cols-3 sm:divide-y-0 sm:divide-x-2">
        <div className="p-4">
          <div className="text-xs font-bold uppercase">Tổng doanh thu</div>
          <div className="break-words text-2xl font-black">
            {formatCurrency(totals.revenue)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs font-bold uppercase">Tổng giao dịch</div>
          <div className="text-2xl font-black">{totals.orders}</div>
        </div>
        <div className="p-4">
          <div className="text-xs font-bold uppercase">
            Giá trị trung bình mỗi giao dịch
          </div>
          <div className="break-words text-2xl font-black">
            {formatCurrency(totals.orders ? totals.revenue / totals.orders : 0)}
          </div>
        </div>
      </div>

      <div className="bauhaus-panel bauhaus-shadow min-w-0 p-4">
        <h3 className="mb-4 text-lg font-bold uppercase">
          Doanh thu theo ngày
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#b8b8b8" />
            <XAxis dataKey="day" fontSize={11} tickFormatter={formatDay} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Doanh thu"
              stroke="#D02020"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bauhaus-panel bauhaus-shadow min-w-0 p-4">
          <h3 className="mb-4 text-lg font-bold uppercase">
            Doanh thu theo danh mục
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={category}>
              <CartesianGrid strokeDasharray="3 3" stroke="#b8b8b8" />
              <XAxis dataKey="category" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="revenue" name="Doanh thu" fill="#1040C0" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bauhaus-panel bauhaus-shadow min-w-0 p-4">
          <h3 className="mb-4 text-lg font-bold uppercase">
            Sản phẩm bán chạy
          </h3>
          <table className="bauhaus-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th className="text-right">Số lượng</th>
                <th className="text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {top.map((t) => (
                <tr key={t.product_id}>
                  <td className="font-bold">{t.name}</td>
                  <td className="text-right">{t.units}</td>
                  <td className="text-right font-bold">
                    {formatCurrency(t.revenue)}
                  </td>
                </tr>
              ))}
              {top.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-black/60">
                    Chưa có dữ liệu trong khoảng thời gian này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
