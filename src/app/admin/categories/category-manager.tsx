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
    if (!confirm("Delete this category?")) return;
    start(async () => {
      const r = await deleteCategory(id);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <>
      <form
        action={onCreate}
        className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-2"
      >
        <input
          name="name"
          placeholder="Name"
          required
          className="border rounded px-3 py-2 flex-1 min-w-[180px]"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
        />
        <button
          disabled={pending}
          className="bg-slate-900 text-white rounded px-4 py-2 flex items-center gap-1 disabled:opacity-50"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Description</th>
              <th className="p-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) =>
              editing === c.id ? (
                <tr key={c.id} className="border-t">
                  <td colSpan={3} className="p-3">
                    <form
                      action={(fd) => onUpdate(c.id, fd)}
                      className="flex gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={c.name}
                        className="border rounded px-2 py-1 flex-1"
                      />
                      <input
                        name="description"
                        defaultValue={c.description ?? ""}
                        className="border rounded px-2 py-1 flex-1"
                      />
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
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-slate-600">{c.description ?? "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => setEditing(c.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
