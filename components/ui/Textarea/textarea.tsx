// components/ui/Textarea.tsx
import { cn } from "@/lib/utils"
import { ComponentProps, forwardRef } from "react"

interface TextareaProps extends ComponentProps<"textarea"> {
  variant?: "default" | "filled"
  resize?: "none" | "vertical" | "horizontal" | "both"
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", resize = "none", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[80px] w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-[13px] placeholder:font-light",
          "focus:outline-none focus:ring-1 focus:ring-[#444]",
          variant === "filled" && "bg-muted border-transparent",
          {
            'resize-none': resize === 'none',
            'resize-y': resize === 'vertical',
            'resize-x': resize === 'horizontal',
            'resize': resize === 'both'
          },
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }