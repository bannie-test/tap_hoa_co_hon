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
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;
    start(async () => {
      await deleteProduct(id);
    });
  }

  return (
    <div className="bauhaus-panel bauhaus-shadow overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b-2 border-black p-3">
        <div className="flex min-h-11 min-w-[200px] flex-1 items-center gap-2 border-2 border-black bg-white px-2">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Tìm sản phẩm theo tên hoặc mã SKU"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Tìm theo tên hoặc mã SKU…"
            className="w-full border-0 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Lọc theo danh mục"
          className="bauhaus-field w-auto text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={applyFilters}
          className="bauhaus-button bauhaus-button-blue text-sm"
        >
          Lọc
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="bauhaus-table min-w-[760px]">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Mã SKU</th>
              <th>Danh mục</th>
              <th className="text-right">Giá bán</th>
              <th className="text-right">Tồn kho</th>
              <th className="w-40">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) =>
              editing === p.id ? (
                <tr key={p.id}>
                  <td colSpan={6}>
                    <form
                      action={(fd) => onUpdate(p.id, fd)}
                      className="grid grid-cols-2 gap-2 lg:grid-cols-6"
                    >
                      <input
                        name="name"
                        defaultValue={p.name}
                        aria-label="Tên sản phẩm"
                        className="bauhaus-field"
                      />
                      <input
                        name="sku"
                        defaultValue={p.sku ?? ""}
                        aria-label="Mã SKU"
                        className="bauhaus-field"
                      />
                      <select
                        name="category_id"
                        defaultValue={p.category_id ?? ""}
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
                        defaultValue={p.price}
                        aria-label="Giá bán"
                        className="bauhaus-field"
                      />
                      <input
                        name="stock"
                        type="number"
                        defaultValue={p.stock}
                        aria-label="Tồn kho"
                        className="bauhaus-field"
                      />
                      <input
                        name="cost"
                        type="number"
                        step="0.01"
                        defaultValue={p.cost ?? 0}
                        className="bauhaus-field"
                        hidden
                      />
                      <input
                        name="low_stock_threshold"
                        type="number"
                        defaultValue={p.low_stock_threshold ?? 5}
                        aria-label="Ngưỡng cảnh báo tồn kho thấp"
                        className="bauhaus-field"
                      />
                      <div className="col-span-2 flex gap-2 lg:col-span-6">
                        <button
                          disabled={pending}
                          className="bauhaus-button bauhaus-button-red text-sm"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="bauhaus-button bauhaus-button-outline text-sm"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td className="font-bold">{p.name}</td>
                  <td className="text-black/60">{p.sku ?? "—"}</td>
                  <td>{p.categories?.name ?? "—"}</td>
                  <td className="text-right">{formatCurrency(p.price)}</td>
                  <td
                    className={`text-right ${p.stock <= (p.low_stock_threshold ?? 5) ? "font-bold text-[#D02020]" : ""}`}
                  >
                    {p.stock}
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(p.id)}
                        className="bauhaus-button bauhaus-button-outline min-h-9 px-2 py-1 text-xs"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        aria-label={`Xóa ${p.name}`}
                        title={`Xóa ${p.name}`}
                        className="bauhaus-button bauhaus-button-outline min-h-9 px-2 py-1 text-[#D02020]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-black/60">
                  Không tìm thấy sản phẩm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
