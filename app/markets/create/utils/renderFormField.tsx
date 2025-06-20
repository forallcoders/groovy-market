import Image from "next/image"

import { Alert, AlertDescription } from "@/components/ui/Alert/alert"
import { DatePicker } from "@/components/ui/DatePicker/date-picker"
import { Label } from "@/components/ui/Label/label"

import { FormField } from "@/app/markets/create/types/conditions-card.types"
import DropdownField from "@/components/ui/Dropdown/dropdown-field"
import { Input } from "@/components/ui/Input/input"

export const renderFormField = (
  field: FormField,
  firstToken?: string,
  secondToken?: string
) => {
  const renderLabel = () => {
    if (!field.label) return null
    if (typeof field.label === "function") {
      return field.label(firstToken || "", secondToken || "")
    }
    if (typeof field.label === "string") return <Label>{field.label}</Label>

    return field.label
  }

  switch (field.type) {
    case "select":
      return (
        <>
          {renderLabel()}
          <DropdownField
            placeholder={field.placeholder}
            options={field.options}
            value={field.value}
            onValueChange={field.onChange}
            className={field.className}
            variant={field.variant}
          />
        </>
      )
    case "date":
      return (
        <>
          <Label>{field.label?.toString()}</Label>
          <div className="flex gap-2 items-end">
            <DatePicker
              placeholder="dd.mm.yyyy"
              className="w-1/2"
              value={field.value}
              onChange={field.onChange}
            />
            <Alert className="w-1/2" variant="information">
              <Image
                alt="info icon"
                src="/icons/info.svg"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <AlertDescription className="text-xs">
                <span className="font-medium">Note: </span>All prediction time
                is set in UTC.
              </AlertDescription>
            </Alert>
          </div>
        </>
      )
    case "text":
      return (
        <>
          {renderLabel()}
          <Input
            type="text"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            className={`${field.className}`}
            placeholder={field.placeholder}
          />
        </>
      )
    default:
      return "DEFAULT"
  }
}
