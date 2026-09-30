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
    <div className="flex min-h-28 items-center gap-4 p-4">
      {Icon && (
        <div className="flex size-11 shrink-0 items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0_0_#121212]">
          <Icon size={20} className="text-[#1040C0]" />
        </div>
      )}
      <div>
        <div className="text-xs font-bold uppercase">{title}</div>
        <div className="break-words text-xl font-black sm:text-2xl">
          {value}
        </div>
      </div>
    </div>
  );
}
