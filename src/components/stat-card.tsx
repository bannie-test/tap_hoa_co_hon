import { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
      {Icon && (
        <div className="p-2 rounded-lg bg-slate-100">
          <Icon size={20} className="text-slate-700" />
        </div>
      )}
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}
