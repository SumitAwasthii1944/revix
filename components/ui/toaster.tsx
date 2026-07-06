'use client'

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { type Toast as ToastItem, useToast } from "./use-toast"

function variantStyles(variant: ToastItem["variant"] = "default") {
  switch (variant) {
    case "success":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-50"
    case "warning":
      return "border-amber-500/35 bg-amber-500/10 text-amber-50"
    case "destructive":
      return "border-rose-500/35 bg-rose-500/10 text-rose-50"
    default:
      return "border-white/10 bg-[#11161d] text-[#f5f1ea]"
  }
}

function variantIcon(variant: ToastItem["variant"] = "default") {
  switch (variant) {
    case "success":
      return <CheckCircle2 className="h-4 w-4" />
    case "warning":
      return <AlertTriangle className="h-4 w-4" />
    case "destructive":
      return <XCircle className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastPrimitives.Provider swipeDirection="right">
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <ToastPrimitives.Root
          key={id}
          {...props}
          className={cn(
            "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 pr-12 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=move]:transition-none data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-4",
            variantStyles(variant),
          )}
        >
          <div className="mt-0.5 shrink-0 opacity-90">{variantIcon(variant)}</div>
          <div className="grid gap-1">
            {title ? <ToastPrimitives.Title className="text-sm font-semibold leading-none">{title}</ToastPrimitives.Title> : null}
            {description ? (
              <ToastPrimitives.Description className="text-sm leading-5 text-white/72">
                {description}
              </ToastPrimitives.Description>
            ) : null}
          </div>
          {action}
          <ToastPrimitives.Close className="absolute right-3 top-3 rounded-md p-1 text-white/55 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20">
            <X className="h-4 w-4" />
          </ToastPrimitives.Close>
        </ToastPrimitives.Root>
      ))}

      <ToastViewport />
    </ToastPrimitives.Provider>
  )
}

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-100 flex max-h-screen w-full flex-col-reverse gap-3 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-105",
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName
