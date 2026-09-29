import { createClient } from "@/lib/supabase/server";
import { SaleForm } from "./sale-form";
import { SalesTable } from "./sales-table";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; product?: string }>;
}) {
  const { from, to, product } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("sales")
    .select(
      "id, quantity, unit_price, total, customer_name, sold_at, products(name,id)",
    )
    .order("sold_at", { ascending: false })
    .limit(500);

  if (from) query = query.gte("sold_at", new Date(from).toISOString());
  if (to) {
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    query = query.lt("sold_at", end.toISOString());
  }
  if (product) query = query.eq("product_id", product);

  const [{ data: sales }, { data: products }] = await Promise.all([
    query,
    supabase
      .from("products")
      .select("id,name,price,stock")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Sales</h2>
      <SaleForm products={products ?? []} />
      <SalesTable
        sales={sales ?? []}
        products={(products ?? []).map((p) => ({ id: p.id, name: p.name }))}
        initial={{ from: from ?? "", to: to ?? "", product: product ?? "" }}
      />
    </div>
  );
}
