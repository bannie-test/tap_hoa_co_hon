"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

type Sale = {
  id: string;
  quantity: number;
  unit_price: number;
  total: number;
  customer_name: string | null;
  sold_at: string;
  products: { name: string; id: string } | null;
};

export function SalesTable({
  sales,
  products,
  initial,
}: {
  sales: Sale[];
  products: { id: string; name: string }[];
  initial: { from: string; to: string; product: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [product, setProduct] = useState(initial.product);

  function apply() {
    const next = new URLSearchParams(params);
    from ? next.set("from", from) : next.delete("from");
    to ? next.set("to", to) : next.delete("to");
    product ? next.set("product", product) : next.delete("product");
    router.push(`/admin/sales?${next.toString()}`);
  }

  const total = sales.reduce((s, x) => s + Number(x.total), 0);

  return (
    <div className="bauhaus-panel bauhaus-shadow overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-black p-3">
        <label htmlFor="sales-from" className="text-sm font-bold uppercase">
          Từ ngày
        </label>
        <input
          id="sales-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bauhaus-field w-auto text-sm"
        />
        <label htmlFor="sales-to" className="text-sm font-bold uppercase">
          Đến ngày
        </label>
        <input
          id="sales-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bauhaus-field w-auto text-sm"
        />
        <select
          aria-label="Lọc theo sản phẩm"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="bauhaus-field w-auto text-sm"
        >
          <option value="">Tất cả sản phẩm</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={apply}
          className="bauhaus-button bauhaus-button-blue text-sm"
        >
          Áp dụng
        </button>
        <div className="ml-auto text-sm font-bold">
          Tổng cộng: <span className="font-black">{formatCurrency(total)}</span>{" "}
          ({sales.length} giao dịch)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="bauhaus-table min-w-[760px]">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Sản phẩm</th>
              <th>Khách hàng</th>
              <th className="text-right">Số lượng</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{formatDate(s.sold_at)}</td>
                <td className="font-bold">{s.products?.name}</td>
                <td className="text-black/60">
                  {s.customer_name ?? "Khách lẻ"}
                </td>
                <td className="text-right">{s.quantity}</td>
                <td className="text-right">{formatCurrency(s.unit_price)}</td>
                <td className="text-right font-bold">
                  {formatCurrency(s.total)}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-black/60">
                  Chưa có giao dịch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
