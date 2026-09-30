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
      className="bauhaus-panel bauhaus-shadow grid grid-cols-2 gap-3 p-4 lg:grid-cols-6"
    >
      <select
        name="product_id"
        required
        value={productId}
        onChange={(e) => onChangeProduct(e.target.value)}
        aria-label="Sản phẩm"
        className="bauhaus-field col-span-2"
      >
        <option value="">Chọn sản phẩm *</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {formatCurrency(p.price)} (còn {p.stock})
          </option>
        ))}
      </select>
      <input
        name="quantity"
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Số lượng"
        required
        aria-label="Số lượng"
        className="bauhaus-field"
      />
      <input
        name="unit_price"
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Đơn giá"
        required
        aria-label="Đơn giá"
        className="bauhaus-field"
      />
      <input
        name="customer_name"
        placeholder="Tên khách hàng"
        aria-label="Tên khách hàng"
        className="bauhaus-field"
      />
      <input
        name="customer_phone"
        placeholder="Số điện thoại"
        aria-label="Số điện thoại khách hàng"
        className="bauhaus-field"
      />
      <div className="col-span-2 lg:col-span-6 flex items-center justify-between">
        <div className="text-sm">
          Thành tiền:{" "}
          <span className="font-black">{formatCurrency(total)}</span>
          {selected && (
            <span className="ml-3 text-black/60">
              Tồn kho sau bán: {selected.stock - Number(qty || 0)}
            </span>
          )}
        </div>
        <button
          disabled={pending}
          className="bauhaus-button bauhaus-button-red"
        >
          {pending ? "Đang ghi nhận…" : "Ghi nhận giao dịch"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="col-span-2 text-sm font-bold text-[#D02020] lg:col-span-6"
        >
          {error}
        </p>
      )}
    </form>
  );
}
