import { cn } from "@/lib/utils"
import { ComponentProps, ReactNode, forwardRef } from "react"

interface InputProps extends ComponentProps<"input"> {
  icon?: ReactNode
  iconPosition?: "left" | "right"
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, iconPosition = "left", ...props }, ref) => {
    const iconStyles = "absolute top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"

    return (
      <div className={cn("relative", className)}>
        {icon && (
          <div className={cn(
            iconStyles,
            iconPosition === "left" ? "left-3" : "right-3"
          )}>
            {icon}
          </div>
        )}

        <input
          ref={ref}
          className={cn(
            "bg-[#353539] rounded-full text-sm w-full py-[6px]",
            "focus:outline-none focus:ring-1 focus:ring-[#444]",
            "placeholder:text-[13px] placeholder:font-light",
            {
              "pl-10 pr-4": icon && iconPosition === "left",
              "pr-10 pl-4": icon && iconPosition === "right",
              "px-4": !icon
            }
          )}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }