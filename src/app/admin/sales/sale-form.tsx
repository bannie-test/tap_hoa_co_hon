"use client";

import { useState, useTransition, useMemo } from "react";
import { recordSale } from "./actions";
import { formatCurrency } from "@/lib/utils";

type Product = { id: string; name: string; price: number; stock: number };

export function SaleForm({ products }: { products: Product[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("0");
  const [qty, setQty] = useState("1");

  const selected = products.find((p) => p.id === productId);
  const total = Number(price) * Number(qty || 0);

  function onChangeProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setPrice(String(p.price));
  }

  async function onSubmit(fd: FormData) {
    setError(null);
    start(async () => {
      const r = await recordSale(fd);
      if (r?.error) setError(r.error);
      else {
        (document.getElementById("sale-form") as HTMLFormElement)?.reset();
        setProductId("");
        setPrice("0");
        setQty("1");
      }
    });
  }

  return (
    <form
      id="sale-form"
      action={onSubmit}
      className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-2 lg:grid-cols-6 gap-3"
    >
      <select
        name="product_id"
        required
        value={productId}
        onChange={(e) => onChangeProduct(e.target.value)}
        className="border rounded px-3 py-2 col-span-2"
      >
        <option value="">Select product *</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {formatCurrency(p.price)} ({p.stock} in stock)
          </option>
        ))}
      </select>
      <input
        name="quantity"
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        required
        className="border rounded px-3 py-2"
      />
      <input
        name="unit_price"
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Unit price"
        required
        className="border rounded px-3 py-2"
      />
      <input
        name="customer_name"
        placeholder="Customer"
        className="border rounded px-3 py-2"
      />
      <input
        name="customer_phone"
        placeholder="Phone"
        className="border rounded px-3 py-2"
      />
      <div className="col-span-2 lg:col-span-6 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Total:{" "}
          <span className="font-semibold text-slate-900">
            {formatCurrency(total)}
          </span>
          {selected && (
            <span className="ml-3 text-slate-500">
              Remaining after: {selected.stock - Number(qty || 0)}
            </span>
          )}
        </div>
        <button
          disabled={pending}
          className="bg-slate-900 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Recording…" : "Record Sale"}
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-sm col-span-2 lg:col-span-6">{error}</p>
      )}
    </form>
  );
}
