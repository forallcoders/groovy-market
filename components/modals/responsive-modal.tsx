import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import React, { useEffect, useState, useCallback } from "react"
import { ActionButton } from "../ui/action-button"

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  contentClassName?: string
  showTrigger?: boolean
  displayCloseButton?: boolean
  preventClose?: boolean
}

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  contentClassName,
  showTrigger = false,
  displayCloseButton = true,
  preventClose = false,
  open,
  onOpenChange,
}) => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)")
    const updateModalType = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }

    updateModalType(mediaQuery)
    mediaQuery.addEventListener("change", updateModalType)
    return () => mediaQuery.removeEventListener("change", updateModalType)
  }, [])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (preventClose && !newOpen) {
        return
      }
      onOpenChange(newOpen)
    },
    [preventClose, onOpenChange]
  )

  if (isMobile === null) return null

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        {showTrigger && <SheetTrigger asChild />}
        <SheetContent
          side="bottom"
          className={cn(contentClassName, "bg-[#29292C] border-0")}
        >
          <SheetTitle />
          {displayCloseButton && (
            <ActionButton
              src="/icons/close.svg"
              alt="close"
              onClick={() => handleOpenChange(false)}
              className="right-3 top-3"
              imageClassName="transform -scale-x-100"
            />
          )}
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && <DialogTrigger asChild />}
      <DialogContent className={cn(contentClassName, "bg-[#29292C] border-0")}>
        <DialogTitle />
        {displayCloseButton && (
          <ActionButton
            src="/icons/close.svg"
            alt="close"
            onClick={() => handleOpenChange(false)}
            className="right-3 top-3"
            imageClassName="transform -scale-x-100"
          />
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default ResponsiveModal
