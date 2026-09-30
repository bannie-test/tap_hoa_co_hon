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
      <h2 className="border-b-4 border-black pb-3 text-3xl font-black uppercase leading-none sm:text-4xl">
        Tổng quan
      </h2>

      <div className="grid grid-cols-1 divide-y-2 divide-black border-4 border-black bg-[#F0C020] sm:grid-cols-2 sm:divide-y-0 sm:divide-x-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
        />
        <StatCard
          title="Doanh thu (30 ngày)"
          value={formatCurrency(monthRevenue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Đơn hàng (30 ngày)"
          value={String(monthSales?.length ?? 0)}
          icon={ShoppingBag}
        />
        <StatCard
          title="Sản phẩm đang bán"
          value={String(productCount ?? 0)}
          icon={ShoppingBag}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bauhaus-panel bauhaus-shadow min-w-0 p-4 lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold uppercase">
            Doanh thu 30 ngày qua
          </h3>
          <RevenueChart data={dailyRevenue ?? []} />
        </div>
        <div className="bauhaus-panel bauhaus-shadow min-w-0 p-4">
          <h3 className="mb-4 text-lg font-bold uppercase">
            Doanh thu theo danh mục
          </h3>
          <CategoryPie data={catRevenue ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bauhaus-panel bauhaus-shadow min-w-0 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold uppercase">
            <AlertTriangle size={18} className="text-[#D02020]" />
            Sắp hết hàng ({lowStockItems.length})
          </h3>
          <ul className="divide-y-2 divide-black">
            {lowStockItems.slice(0, 6).map((p) => (
              <li
                key={p.id}
                className="flex justify-between gap-3 py-2 text-sm"
              >
                <span>{p.name}</span>
                <span className="shrink-0 font-bold text-[#D02020]">
                  Còn {p.stock}
                </span>
              </li>
            ))}
            {lowStockItems.length === 0 && (
              <li className="py-2 text-sm">Tồn kho đang ổn định.</li>
            )}
          </ul>
        </div>

        <div className="bauhaus-panel bauhaus-shadow min-w-0 p-4">
          <h3 className="mb-3 text-lg font-bold uppercase">
            Giao dịch gần đây
          </h3>
          <ul className="divide-y-2 divide-black">
            {(recentSales ?? []).map((s) => (
              <li
                key={s.id}
                className="flex justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold">
                    {(s as any).products?.name}
                  </div>
                  <div className="text-xs text-black/60">
                    {s.customer_name || "Khách lẻ"} · {formatDate(s.sold_at)}
                  </div>
                </div>
                <span className="shrink-0 font-bold">
                  {formatCurrency(s.total)}
                </span>
              </li>
            ))}
            {(recentSales ?? []).length === 0 && (
              <li className="py-2 text-sm text-black/60">Chưa có giao dịch.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
