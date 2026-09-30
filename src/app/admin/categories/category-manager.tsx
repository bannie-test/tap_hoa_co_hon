"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus } from "lucide-react";
import { createCategory, deleteCategory, updateCategory } from "./actions";

type Category = { id: string; name: string; description: string | null };

export function CategoryManager({ initial }: { initial: Category[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onCreate(formData: FormData) {
    setError(null);
    start(async () => {
      const r = await createCategory(formData);
      if (r?.error) setError(r.error);
    });
  }

  async function onUpdate(id: string, formData: FormData) {
    setError(null);
    start(async () => {
      const r = await updateCategory(id, formData);
      if (r?.error) setError(r.error);
      else setEditing(null);
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa danh mục này không?")) return;
    start(async () => {
      const r = await deleteCategory(id);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <>
      <form
        action={onCreate}
        className="bauhaus-panel bauhaus-shadow flex flex-wrap gap-2 p-4"
      >
        <input
          name="name"
          placeholder="Tên danh mục"
          required
          aria-label="Tên danh mục"
          className="bauhaus-field min-w-[180px] flex-1"
        />
        <input
          name="description"
          placeholder="Mô tả (không bắt buộc)"
          aria-label="Mô tả"
          className="bauhaus-field min-w-[200px] flex-1"
        />
        <button
          disabled={pending}
          className="bauhaus-button bauhaus-button-red"
        >
          <Plus size={16} /> Thêm
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm font-bold text-[#D02020]">
          {error}
        </p>
      )}

      <div className="bauhaus-panel bauhaus-shadow overflow-x-auto">
        <table className="bauhaus-table min-w-[560px]">
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Mô tả</th>
              <th className="w-28">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) =>
              editing === c.id ? (
                <tr key={c.id}>
                  <td colSpan={3}>
                    <form
                      action={(fd) => onUpdate(c.id, fd)}
                      className="flex flex-wrap gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={c.name}
                        aria-label="Tên danh mục"
                        className="bauhaus-field min-w-[160px] flex-1"
                      />
                      <input
                        name="description"
                        defaultValue={c.description ?? ""}
                        aria-label="Mô tả"
                        className="bauhaus-field min-w-[180px] flex-1"
                      />
                      <button className="bauhaus-button bauhaus-button-red text-sm">
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="bauhaus-button bauhaus-button-outline text-sm"
                      >
                        Hủy
                      </button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={c.id}>
                  <td className="font-bold">{c.name}</td>
                  <td className="text-black/70">{c.description ?? "—"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(c.id)}
                        className="bauhaus-button bauhaus-button-outline min-h-9 px-2 py-1 text-xs"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        aria-label={`Xóa ${c.name}`}
                        title={`Xóa ${c.name}`}
                        className="bauhaus-button bauhaus-button-outline min-h-9 px-2 py-1 text-[#D02020]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
            {initial.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-black/60">
                  Chưa có danh mục.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
