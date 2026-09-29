import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "./products-table";
import { ProductForm } from "./product-form";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  if (category) query = query.eq("category_id", category);

  const [{ data: products }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Products</h2>

      <ProductForm categories={categories ?? []} />

      <ProductsTable
        products={products ?? []}
        categories={categories ?? []}
        initialQuery={q ?? ""}
        initialCategory={category ?? ""}
      />
    </div>
  );
}
