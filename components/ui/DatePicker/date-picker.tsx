"use client"

import Image from "next/image";
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button/Button"
import { Calendar } from "@/components/ui/Calendar/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  fromYear?: number
  toYear?: number
}

function DatePicker({
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  className,
  disabled,
  fromYear,
  toYear,
  ...props
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-full h-[30px] px-3 bg-neutral-600 justify-between text-left font-normal rounded-full border-0 hover:bg-neutral-600",
            !value && "text-neutral-300 font-medium text-sm",
            className
          )}
          disabled={disabled}
        >
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
          <Image src="/icons/calendar.svg" alt="calendar icon" width={18} height={18} className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-neutral-800/80 backdrop-blur-sm w-auto p-0 border-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          initialFocus
          fromYear={fromYear}
          toYear={toYear}
          {...props}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }