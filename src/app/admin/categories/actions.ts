"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).optional().or(z.literal("")),
});

export async function createCategory(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: "Thông tin danh mục không hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { error: "Không thể thêm danh mục. Vui lòng thử lại." };
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: "Thông tin danh mục không hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .eq("id", id);
  if (error) return { error: "Không thể cập nhật danh mục. Vui lòng thử lại." };
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: "Không thể xóa danh mục. Vui lòng thử lại." };
  revalidatePath("/admin/categories");
  return { ok: true };
}
