import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  iconClassName?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "search" | "error"
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, iconClassName, title, description, action, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-fade-in",
          {
            "border-muted-foreground/25 bg-muted/30": variant === "default",
            "border-muted-foreground/20 bg-muted/20": variant === "search",
            "border-destructive/20 bg-destructive/5": variant === "error",
          },
          className
        )}
        {...props}
      >
        {Icon && (
          <div
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
              {
                "bg-muted": variant === "default",
                "bg-muted/50": variant === "search",
                "bg-destructive/10": variant === "error",
              },
              iconClassName
            )}
          >
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
