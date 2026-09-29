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
      <h2 className="text-2xl font-semibold">Categories</h2>
      <CategoryManager initial={data ?? []} />
    </div>
  );
}
