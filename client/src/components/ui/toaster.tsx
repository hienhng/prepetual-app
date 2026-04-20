import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return (
          <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive-foreground">
            <AlertCircle className="h-4 w-4" />
          </div>
        )
      case "success":
        return (
          <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
            <Info className="h-4 w-4" />
          </div>
        )
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-2.5 pr-2 overflow-hidden">
              {getIcon(variant || undefined)}
              <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                {title && <ToastTitle className="text-[13px]">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="opacity-60 truncate font-medium text-[12px] flex items-center">
                    <span className="mx-1 opacity-20">•</span>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
