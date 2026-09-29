"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const blankToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(200).optional().or(z.literal("")),
});

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().max(60).optional().or(z.literal("")),
  category_id: z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().uuid().nullable().optional(),
  ),
  category_name: z.string().trim().optional().or(z.literal("")),
  price: z.preprocess(
    blankToUndefined,
    z.coerce.number().finite().nonnegative(),
  ),
  cost: z.preprocess(
    blankToUndefined,
    z.coerce.number().finite().nonnegative().default(0),
  ),
  stock: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().nonnegative().default(0),
  ),
  low_stock_threshold: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().nonnegative().default(5),
  ),
});

const saleSchema = z
  .object({
    product_id: z.preprocess(blankToUndefined, z.string().uuid().optional()),
    product_name: z.string().trim().optional().or(z.literal("")),
    quantity: z.coerce.number().int().positive(),
    unit_price: z.coerce.number().finite().nonnegative(),
    customer_name: z.string().max(120).optional().or(z.literal("")),
    customer_phone: z.string().max(40).optional().or(z.literal("")),
    note: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((row) => row.product_id || row.product_name, {
    message: "Enter product_id or product_name",
    path: ["product_id"],
  });

function parseRows<T>(sheet: string, rows: unknown[], schema: z.ZodType<T>) {
  const parsedRows: { value: T; rowNumber: number }[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const parsed = schema.safeParse(row);
    if (parsed.success) {
      parsedRows.push({ value: parsed.data, rowNumber: index + 2 });
    } else {
      errors.push(
        `${sheet} row ${index + 2}: ${parsed.error.issues[0].message}`,
      );
    }
  });

  return { rows: parsedRows, errors };
}

type WorkbookRows = {
  Categories: unknown[];
  Products: unknown[];
  Sales: unknown[];
};

type ImportCounts = { categories: number; products: number; sales: number };
type ImportResult =
  | { error: string; imported?: ImportCounts; moreErrors?: number }
  | { ok: true; imported: ImportCounts };

export async function importWorkbook(
  input: WorkbookRows,
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to import data." };

  if (
    !input ||
    !Array.isArray(input.Categories) ||
    !Array.isArray(input.Products) ||
    !Array.isArray(input.Sales)
  ) {
    return { error: "The workbook is missing one or more required sheets." };
  }

  const totalRows =
    input.Categories.length + input.Products.length + input.Sales.length;
  if (totalRows > 500) {
    return { error: "Import is limited to 500 total data rows per workbook." };
  }
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 700_000) {
    return { error: "The workbook data is too large to import in one batch." };
  }

  const categories = parseRows("Categories", input.Categories, categorySchema);
  const products = parseRows("Products", input.Products, productSchema);
  const sales = parseRows("Sales", input.Sales, saleSchema);
  const validationErrors = [
    ...categories.errors,
    ...products.errors,
    ...sales.errors,
  ];
  if (validationErrors.length) {
    return {
      error: validationErrors.slice(0, 20).join("\n"),
      ...(validationErrors.length > 20
        ? { moreErrors: validationErrors.length - 20 }
        : {}),
    };
  }

  const counts: ImportCounts = { categories: 0, products: 0, sales: 0 };

  if (categories.rows.length) {
    const { error } = await supabase.from("categories").insert(
      categories.rows.map(({ value }) => ({
        name: value.name,
        description: value.description || null,
      })),
    );
    if (error)
      return { error: `Categories: ${error.message}`, imported: counts };
    counts.categories = categories.rows.length;
  }

  if (products.rows.length) {
    const { data: categoryRows, error } = await supabase
      .from("categories")
      .select("id,name");
    if (error) return { error: `Products: ${error.message}`, imported: counts };

    const categoryIds = new Map<string, string[]>();
    for (const category of categoryRows ?? []) {
      const key = category.name.trim().toLocaleLowerCase();
      categoryIds.set(key, [...(categoryIds.get(key) ?? []), category.id]);
    }

    const productRows: Record<string, unknown>[] = [];
    const referenceErrors: string[] = [];
    for (const { value, rowNumber } of products.rows) {
      let categoryId = value.category_id || null;
      if (!categoryId && value.category_name) {
        const matches =
          categoryIds.get(value.category_name.toLocaleLowerCase()) ?? [];
        if (matches.length !== 1) {
          referenceErrors.push(
            `Products row ${rowNumber}: category_name must match one category exactly.`,
          );
          continue;
        }
        categoryId = matches[0];
      }
      productRows.push({
        name: value.name,
        sku: value.sku || null,
        category_id: categoryId,
        price: value.price,
        cost: value.cost,
        stock: value.stock,
        low_stock_threshold: value.low_stock_threshold,
      });
    }
    if (referenceErrors.length) {
      return {
        error: referenceErrors.slice(0, 20).join("\n"),
        imported: counts,
      };
    }

    const { error: insertError } = await supabase
      .from("products")
      .insert(productRows);
    if (insertError) {
      return { error: `Products: ${insertError.message}`, imported: counts };
    }
    counts.products = productRows.length;
  }

  if (sales.rows.length) {
    const { data: productRows, error } = await supabase
      .from("products")
      .select("id,name");
    if (error) return { error: `Sales: ${error.message}`, imported: counts };

    const productIds = new Map<string, string[]>();
    for (const product of productRows ?? []) {
      const key = product.name.trim().toLocaleLowerCase();
      productIds.set(key, [...(productIds.get(key) ?? []), product.id]);
    }

    for (const { value, rowNumber } of sales.rows) {
      let productId = value.product_id;
      if (!productId && value.product_name) {
        const matches =
          productIds.get(value.product_name.toLocaleLowerCase()) ?? [];
        if (matches.length !== 1) {
          return {
            error: `Sales row ${rowNumber}: product_name must match one product exactly.`,
            imported: counts,
          };
        }
        productId = matches[0];
      }

      const { error: saleError } = await supabase.rpc("record_sale", {
        p_product_id: productId,
        p_quantity: value.quantity,
        p_unit_price: value.unit_price,
        p_customer_name: value.customer_name || null,
        p_customer_phone: value.customer_phone || null,
        p_note: value.note || null,
      });
      if (saleError) {
        return {
          error: `Sales row ${rowNumber}: ${saleError.message}`,
          imported: counts,
        };
      }
      counts.sales += 1;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/reports");

  return { ok: true, imported: counts };
}
