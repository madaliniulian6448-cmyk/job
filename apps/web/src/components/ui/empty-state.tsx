import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-center py-16 bg-white rounded-2xl border border-border shadow-card",
        className
      )}
    >
      {Icon && (
        <div className="bg-secondary rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
