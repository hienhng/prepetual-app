import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border shadow-[0_4px_0_0_var(--primary-3d-shadow)] active:translate-y-[4px] active:shadow-none disabled:translate-y-0 disabled:shadow-none transition-all duration-75 no-default-active-elevate",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border shadow-[0_4px_0_0_var(--destructive-3d-shadow)] active:translate-y-[4px] active:shadow-none disabled:translate-y-0 disabled:shadow-none transition-all duration-75 no-default-active-elevate",
        outline:
          "border [border-color:var(--button-outline)] shadow-[0_4px_0_0_var(--outline-3d-shadow)] active:translate-y-[4px] active:shadow-none disabled:translate-y-0 disabled:shadow-none transition-all duration-75 no-default-active-elevate",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border shadow-[0_4px_0_0_var(--secondary-3d-shadow)] active:translate-y-[4px] active:shadow-none disabled:translate-y-0 disabled:shadow-none transition-all duration-75 no-default-active-elevate",
        // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
        ghost: "border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-sm",
        lg: "min-h-10 rounded-md px-6 text-lg",
        xl: "min-h-14 px-8 text-xl rounded-xl",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
