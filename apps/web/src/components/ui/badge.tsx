import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Centralizes the ~15 near-identical inline "pill" badges that were
// hand-rolled across CategoryPage/FavoritesPage/HomePage/ListingDetailPage/
// ProfilePage/DashboardPage/AdminPage — same shape, slightly different
// colors each time. One definition keeps new badges on-brand by default.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground",
        brand: "bg-brand-accent text-brand-accent-foreground shadow-sm",
        outline: "border border-border text-muted-foreground bg-transparent",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        subtle: "bg-white/95 backdrop-blur text-foreground shadow-sm",
      },
      size: {
        sm: "px-2 py-0.5",
        md: "px-2.5 py-1",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
