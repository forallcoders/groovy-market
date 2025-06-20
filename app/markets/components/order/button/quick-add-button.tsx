import { Button } from "@/components/ui/button"
import React from "react"

export default function QuickAddButton({
  onClick,
  value,
}: {
  onClick: () => void
  value: string
}) {
  return (
    <Button
      className="w-[33px] py-[3px] rounded-[10px] border-[1.5px] border-[#353739] font-medium text-[13px] hover:bg-[#3A3A3A] bg-transparent cursor-pointer"
      onClick={onClick}
    >
      {value}
    </Button>
  )
}
