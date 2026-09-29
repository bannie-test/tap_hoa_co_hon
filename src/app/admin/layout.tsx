import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  BarChart3,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/sales", label: "Sales", icon: ShoppingCart },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-slate-900 text-slate-100 p-4 flex flex-col">
        <h1 className="text-lg font-bold mb-6">Admin Tracker</h1>
        <nav className="flex-1 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-800"
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 text-xs text-slate-400 truncate">{user.email}</div>
        <form action="/auth/signout" method="post">
          <button className="mt-2 flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6 overflow-x-auto">{children}</main>
    </div>
  );
}
