import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const now = new Date();
  const fromDate = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = to ? new Date(to) : now;
  toDate.setHours(23, 59, 59, 999);

  const supabase = await createClient();
  const [daily, cat, top] = await Promise.all([
    supabase.rpc("revenue_by_day", {
      p_from: fromDate.toISOString(),
      p_to: toDate.toISOString(),
    }),
    supabase.rpc("revenue_by_category", {
      p_from: fromDate.toISOString(),
      p_to: toDate.toISOString(),
    }),
    supabase.rpc("top_products", {
      p_from: fromDate.toISOString(),
      p_to: toDate.toISOString(),
      p_limit: 15,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="border-b-4 border-black pb-3 text-3xl font-black uppercase leading-none sm:text-4xl">
        Báo cáo
      </h2>
      <ReportsClient
        from={fromDate.toISOString().slice(0, 10)}
        to={toDate.toISOString().slice(0, 10)}
        daily={daily.data ?? []}
        category={cat.data ?? []}
        top={top.data ?? []}
      />
    </div>
  );
}
