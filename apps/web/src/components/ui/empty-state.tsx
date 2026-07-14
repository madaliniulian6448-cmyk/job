import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GenericEmptyIllustration } from "./illustrations";

export function EmptyState({
  icon: Icon,
  illustration: Illustration,
  title,
  description,
  action,
  className,
}: {
  /** Legacy path — still supported for one-off spots, but prefer `illustration`. */
  icon?: LucideIcon;
  /** A brand illustration component from ./illustrations, e.g. EmptyFavoritesIllustration. */
  illustration?: React.ComponentType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const Art = Illustration ?? (Icon ? null : GenericEmptyIllustration);
  return (
    <div
      className={cn(
        "text-center py-16 bg-white rounded-2xl border border-border shadow-card",
        className
      )}
    >
      {Art ? (
        <div className="mb-4">
          <Art />
        </div>
      ) : Icon ? (
        <div className="bg-secondary rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
      ) : null}
      <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
