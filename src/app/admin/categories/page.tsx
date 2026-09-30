import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "./category-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="border-b-4 border-black pb-3 text-3xl font-black uppercase leading-none sm:text-4xl">
        Danh mục
      </h2>
      <CategoryManager initial={data ?? []} />
    </div>
  );
}
