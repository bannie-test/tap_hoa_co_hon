"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().nonnegative(),
  customer_name: z.string().max(120).optional().or(z.literal("")),
  customer_phone: z.string().max(40).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function recordSale(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_sale", {
    p_product_id: parsed.data.product_id,
    p_quantity: parsed.data.quantity,
    p_unit_price: parsed.data.unit_price,
    p_customer_name: parsed.data.customer_name || null,
    p_customer_phone: parsed.data.customer_phone || null,
    p_note: parsed.data.note || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/sales");
  revalidatePath("/admin");
  return { ok: true };
}
