"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Search } from "lucide-react";
import { deleteProduct, updateProduct } from "./actions";
import { formatCurrency } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  price: number;
  cost: number | null;
  stock: number;
  low_stock_threshold: number | null;
  categories: { name: string } | null;
};
type Category = { id: string; name: string };

export function ProductsTable({
  products,
  categories,
  initialQuery,
  initialCategory,
}: {
  products: Row[];
  categories: Category[];
  initialQuery: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState(initialCategory);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function applyFilters() {
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    if (cat) next.set("category", cat);
    else next.delete("category");
    router.push(`/admin/products?${next.toString()}`);
  }

  async function onUpdate(id: string, fd: FormData) {
    start(async () => {
      const r = await updateProduct(id, fd);
      if (!r?.error) setEditing(null);
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete product?")) return;
    start(async () => {
      await deleteProduct(id);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-3 flex flex-wrap gap-2 border-b">
        <div className="flex items-center gap-2 border rounded px-2 py-1 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search by name or SKU…"
            className="w-full outline-none text-sm"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={applyFilters}
          className="bg-slate-900 text-white rounded px-3 py-1 text-sm"
        >
          Filter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) =>
              editing === p.id ? (
                <tr key={p.id} className="border-t">
                  <td colSpan={6} className="p-3">
                    <form
                      action={(fd) => onUpdate(p.id, fd)}
                      className="grid grid-cols-2 lg:grid-cols-6 gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={p.name}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        name="sku"
                        defaultValue={p.sku ?? ""}
                        className="border rounded px-2 py-1"
                      />
                      <select
                        name="category_id"
                        defaultValue={p.category_id ?? ""}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">None</option>
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
                        defaultValue={p.price}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        name="stock"
                        type="number"
                        defaultValue={p.stock}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        name="cost"
                        type="number"
                        step="0.01"
                        defaultValue={p.cost ?? 0}
                        className="border rounded px-2 py-1"
                        hidden
                      />
                      <input
                        name="low_stock_threshold"
                        type="number"
                        defaultValue={p.low_stock_threshold ?? 5}
                        className="border rounded px-2 py-1"
                      />
                      <div className="col-span-2 lg:col-span-6 flex gap-2">
                        <button className="bg-slate-900 text-white rounded px-3 py-1">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="border rounded px-3 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-slate-500">{p.sku ?? "—"}</td>
                  <td className="p-3">{p.categories?.name ?? "—"}</td>
                  <td className="p-3 text-right">{formatCurrency(p.price)}</td>
                  <td
                    className={`p-3 text-right ${p.stock <= (p.low_stock_threshold ?? 5) ? "text-amber-600 font-medium" : ""}`}
                  >
                    {p.stock}
                  </td>
                  <td className="p-3 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditing(p.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ),
            )}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
