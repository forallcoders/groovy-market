// components/ui/Text.tsx
import { forwardRef } from "react"

import { cn } from "@/lib/utils"

type TextVariant = "body" | "small" | "tiny" | "lead"
type TextWeight = "light" | "normal" | "medium" | "bold"

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant
  weight?: TextWeight
  muted?: boolean
}

const variantClasses: Record<TextVariant, string> = {
  body: "text-base",
  small: "text-sm",
  tiny: "text-xs",
  lead: "text-lg"
}

const weightClasses: Record<TextWeight, string> = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  bold: "font-bold"
}

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = "body", weight = "normal", muted = false, className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          variantClasses[variant],
          weightClasses[weight],
          muted && "text-gray-500",
          className
        )}
        {...props}
      />
    )
  }
)

Text.displayName = "Text"

export { Text }