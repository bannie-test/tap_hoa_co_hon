import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RevenueChart } from "@/components/revenue-chart";
import { CategoryPie } from "@/components/category-pie";
import { StatCard } from "@/components/stat-card";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const start30 = new Date(now);
  start30.setDate(now.getDate() - 29);

  const [
    { data: todaySales },
    { data: monthSales },
    { count: productCount },
    { data: lowStock },
    { data: dailyRevenue },
    { data: catRevenue },
    { data: recentSales },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total")
      .gte("sold_at", startOfToday.toISOString()),
    supabase
      .from("sales")
      .select("total")
      .gte("sold_at", start30.toISOString()),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("products")
      .select("id,name,stock,low_stock_threshold")
      .filter("stock", "lte", "low_stock_threshold") // won't work directly; fallback below
      .limit(0), // replaced below
    supabase.rpc("revenue_by_day", {
      p_from: start30.toISOString(),
      p_to: new Date(now.getTime() + 86400000).toISOString(),
    }),
    supabase.rpc("revenue_by_category", {
      p_from: start30.toISOString(),
      p_to: new Date(now.getTime() + 86400000).toISOString(),
    }),
    supabase
      .from("sales")
      .select("id,total,quantity,customer_name,sold_at,products(name)")
      .order("sold_at", { ascending: false })
      .limit(8),
  ]);

  // Low-stock: filter in JS (simpler than column-to-column filter)
  const { data: allProducts } = await supabase
    .from("products")
    .select("id,name,stock,low_stock_threshold")
    .eq("is_active", true);
  const lowStockItems = (allProducts ?? []).filter(
    (p) => p.stock <= (p.low_stock_threshold ?? 5),
  );

  const todayRevenue = (todaySales ?? []).reduce(
    (s, r) => s + Number(r.total),
    0,
  );
  const monthRevenue = (monthSales ?? []).reduce(
    (s, r) => s + Number(r.total),
    0,
  );
  const avgOrder = monthSales?.length ? monthRevenue / monthSales.length : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue Today"
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
        />
        <StatCard
          title="Revenue (30d)"
          value={formatCurrency(monthRevenue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Orders (30d)"
          value={String(monthSales?.length ?? 0)}
          icon={ShoppingBag}
        />
        <StatCard
          title="Active Products"
          value={String(productCount ?? 0)}
          icon={ShoppingBag}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-medium mb-4">Revenue — last 30 days</h3>
          <RevenueChart data={dailyRevenue ?? []} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-medium mb-4">Revenue by category</h3>
          <CategoryPie data={catRevenue ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Low Stock ({lowStockItems.length})
          </h3>
          <ul className="divide-y">
            {lowStockItems.slice(0, 6).map((p) => (
              <li key={p.id} className="py-2 flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="text-amber-600 font-medium">
                  {p.stock} left
                </span>
              </li>
            ))}
            {lowStockItems.length === 0 && (
              <li className="py-2 text-slate-500 text-sm">All good ✅</li>
            )}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-medium mb-3">Recent Sales</h3>
          <ul className="divide-y">
            {(recentSales ?? []).map((s) => (
              <li key={s.id} className="py-2 flex justify-between text-sm">
                <div>
                  <div className="font-medium">{(s as any).products?.name}</div>
                  <div className="text-slate-500 text-xs">
                    {s.customer_name || "Walk-in"} · {formatDate(s.sold_at)}
                  </div>
                </div>
                <span>{formatCurrency(s.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
