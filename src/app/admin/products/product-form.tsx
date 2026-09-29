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
      className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <input
        name="name"
        placeholder="Name *"
        required
        className="border rounded px-3 py-2 col-span-2"
      />
      <input
        name="sku"
        placeholder="SKU"
        className="border rounded px-3 py-2"
      />
      <select name="category_id" className="border rounded px-3 py-2">
        <option value="">No category</option>
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
        placeholder="Price *"
        required
        className="border rounded px-3 py-2"
      />
      <input
        name="cost"
        type="number"
        step="0.01"
        placeholder="Cost"
        className="border rounded px-3 py-2"
      />
      <input
        name="stock"
        type="number"
        placeholder="Stock"
        className="border rounded px-3 py-2"
      />
      <input
        name="low_stock_threshold"
        type="number"
        placeholder="Low stock alert"
        className="border rounded px-3 py-2"
      />
      <button
        disabled={pending}
        className="bg-slate-900 text-white rounded px-4 py-2 col-span-2 lg:col-span-4 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add Product"}
      </button>
      {error && (
        <p className="text-red-600 text-sm col-span-2 lg:col-span-4">{error}</p>
      )}
    </form>
  );
}
