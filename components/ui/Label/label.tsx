// components/ui/Label.tsx
import { forwardRef } from "react"

import { cn } from "@/lib/utils"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  variant?: "default" | "floating"
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, variant = "default", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-medium mb-2",
          variant === "floating" && "absolute top-3 left-3 transition-all pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )
  }
)

Label.displayName = "Label"

export { Label }