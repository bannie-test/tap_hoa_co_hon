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
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-3 flex flex-wrap gap-2 border-b items-center">
        <label className="text-sm text-slate-600">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <label className="text-sm text-slate-600">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={apply}
          className="bg-slate-900 text-white rounded px-3 py-1 text-sm"
        >
          Apply
        </button>
        <div className="ml-auto text-sm">
          Total: <span className="font-semibold">{formatCurrency(total)}</span>{" "}
          ({sales.length} rows)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Product</th>
              <th className="p-3">Customer</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Unit</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{formatDate(s.sold_at)}</td>
                <td className="p-3">{s.products?.name}</td>
                <td className="p-3 text-slate-600">
                  {s.customer_name ?? "Walk-in"}
                </td>
                <td className="p-3 text-right">{s.quantity}</td>
                <td className="p-3 text-right">
                  {formatCurrency(s.unit_price)}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(s.total)}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  No sales
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
