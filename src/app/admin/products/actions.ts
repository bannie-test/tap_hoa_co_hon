"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1).max(120),
  sku: z.string().max(60).optional().or(z.literal("")),
  category_id: z.string().uuid().nullable().optional(),
  price: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative().default(0),
  stock: z.coerce.number().int().nonnegative().default(0),
  low_stock_threshold: z.coerce.number().int().nonnegative().default(5),
});

export async function createProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || "",
    category_id: formData.get("category_id") || null,
    price: formData.get("price"),
    cost: formData.get("cost") || 0,
    stock: formData.get("stock") || 0,
    low_stock_threshold: formData.get("low_stock_threshold") || 5,
  });
  if (!parsed.success)
    return { error: "Thông tin sản phẩm không hợp lệ. Vui lòng kiểm tra lại." };

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    ...parsed.data,
    sku: parsed.data.sku || null,
    category_id: parsed.data.category_id || null,
  });
  if (error) return { error: "Không thể thêm sản phẩm. Vui lòng thử lại." };
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || "",
    category_id: formData.get("category_id") || null,
    price: formData.get("price"),
    cost: formData.get("cost") || 0,
    stock: formData.get("stock") || 0,
    low_stock_threshold: formData.get("low_stock_threshold") || 5,
  });
  if (!parsed.success)
    return { error: "Thông tin sản phẩm không hợp lệ. Vui lòng kiểm tra lại." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      ...parsed.data,
      sku: parsed.data.sku || null,
      category_id: parsed.data.category_id || null,
    })
    .eq("id", id);
  if (error) return { error: "Không thể cập nhật sản phẩm. Vui lòng thử lại." };
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: "Không thể xóa sản phẩm. Vui lòng thử lại." };
  revalidatePath("/admin/products");
  return { ok: true };
}
