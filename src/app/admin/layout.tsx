import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  BarChart3,
  LogOut,
  Circle,
  Square,
  Triangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const nav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Danh mục", icon: Tags },
  { href: "/admin/sales", label: "Bán hàng", icon: ShoppingCart },
  { href: "/admin/reports", label: "Báo cáo", icon: BarChart3 },
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
    <div className="min-h-screen lg:flex">
      <aside className="border-b-4 border-black bg-[#1040C0] text-white lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r-4">
        <div className="flex items-center gap-3 border-b-2 border-white/50 p-4 lg:p-6">
          <div aria-hidden="true" className="flex flex-col items-center gap-1">
            <Circle size={14} fill="#F0C020" className="text-[#F0C020]" />
            <Square size={14} fill="#D02020" className="text-[#D02020]" />
            <Triangle size={14} fill="white" className="text-white" />
          </div>
          <h1 className="text-lg font-black uppercase leading-none">
            Tạp hóa Cô Hồng
          </h1>
        </div>
        <nav
          aria-label="Điều hướng quản trị"
          className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:gap-1 lg:p-4"
        >
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 shrink-0 items-center gap-2 border-2 border-transparent px-3 py-2 font-bold hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:w-full"
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t-2 border-white/50 p-4 lg:block">
          <div className="truncate text-xs text-white/75">{user.email}</div>
          <form action="/auth/signout" method="post">
            <button className="mt-3 flex min-h-10 items-center gap-2 border-2 border-white px-3 text-sm font-bold uppercase hover:bg-white hover:text-[#1040C0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <LogOut size={16} /> Đăng xuất
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
        <div className="mt-8 flex items-center justify-between border-t-2 border-black pt-4 text-xs font-bold uppercase lg:hidden">
          <span className="max-w-[65%] truncate">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-2 px-2 py-1">
              <LogOut size={15} /> Đăng xuất
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
