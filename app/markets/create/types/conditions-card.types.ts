import { JSX } from "react"
type FieldType = "select" | "date" | "alert" | "text"
export type LabelType =
  | string
  | React.ReactNode
  | ((first: string, second: string) => JSX.Element)

interface Option {
  value: string
  label: string
  logo?: string
}

interface BaseField {
  name: string
  type: FieldType
  label?: LabelType
  variant?: string
  className?: string
  placeholder?: string
  value?: any
  onChange?: any
}

export interface SelectField extends BaseField {
  type: "select"
  options: Option[]
}

interface DateField extends BaseField {
  type: "date"
}

interface AlertField extends BaseField {
  type: "alert"
}

interface TextField extends BaseField {
  type: "text"
}

export type FormField = SelectField | DateField | AlertField | TextField

interface FieldGroup {
  fields: FormField[]
}

export interface ConditionsForms {
  [key: string]: FieldGroup[]
}
