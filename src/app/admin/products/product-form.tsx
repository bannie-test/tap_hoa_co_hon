"use client";

import { useTransition, useState } from "react";
import { createProduct } from "./actions";

type Category = { id: string; name: string };

export function ProductForm({ categories }: { categories: Category[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const r = await createProduct(formData);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <form
      action={onSubmit}
      className="bauhaus-panel bauhaus-shadow grid grid-cols-2 gap-3 p-4 lg:grid-cols-4"
    >
      <input
        name="name"
        placeholder="Tên sản phẩm *"
        required
        aria-label="Tên sản phẩm"
        className="bauhaus-field col-span-2"
      />
      <input
        name="sku"
        placeholder="Mã SKU"
        aria-label="Mã SKU"
        className="bauhaus-field"
      />
      <select
        name="category_id"
        aria-label="Danh mục"
        className="bauhaus-field"
      >
        <option value="">Không có danh mục</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="price"
        type="number"
        step="0.01"
        placeholder="Giá bán *"
        required
        aria-label="Giá bán"
        className="bauhaus-field"
      />
      <input
        name="cost"
        type="number"
        step="0.01"
        placeholder="Giá vốn"
        aria-label="Giá vốn"
        className="bauhaus-field"
      />
      <input
        name="stock"
        type="number"
        placeholder="Tồn kho"
        aria-label="Tồn kho"
        className="bauhaus-field"
      />
      <input
        name="low_stock_threshold"
        type="number"
        placeholder="Ngưỡng cảnh báo tồn kho"
        aria-label="Ngưỡng cảnh báo tồn kho thấp"
        className="bauhaus-field"
      />
      <button
        disabled={pending}
        className="bauhaus-button bauhaus-button-red col-span-2 lg:col-span-4"
      >
        {pending ? "Đang thêm…" : "Thêm sản phẩm"}
      </button>
      {error && (
        <p
          role="alert"
          className="col-span-2 text-sm font-bold text-[#D02020] lg:col-span-4"
        >
          {error}
        </p>
      )}
    </form>
  );
}
