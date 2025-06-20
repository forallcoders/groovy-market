import Image from "next/image";

import { cn } from "@/lib/utils";

import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/Select/select";

interface Option {
  value: string;
  label: string;
  logo?: string;
}

interface DropdownFieldProps {
  value?: string;
  label?: string;
  name?: string;
  options: Option[];
  variant?: string;
  className?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

const VARIANT_STYLES = {
  orchid: {
    trigger: "bg-orchid-700 text-white focus-visible::ring-0 data-[placeholder]:text-white/80",
    content: "bg-orchid-700",
    item: "text-white focus:bg-orchid-300 hover:bg-orchid-400"
  }
}

const getVariantClasses = (variant?: string) => {
  if (!variant) return { trigger: '', content: '', item: '' };
  return VARIANT_STYLES[variant as keyof typeof VARIANT_STYLES] || { trigger: '', content: '', item: '' };
}

export default function DropdownField({ placeholder, options, className = '', variant, value, onValueChange }: DropdownFieldProps) {
  const { trigger, content, item } = getVariantClasses(variant);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full cursor-pointer", trigger, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={content}>
        {options.map(({ value, logo, label }) => (
          <SelectItem key={value} value={value} className={cn("cursor-pointer", item)}>
            {logo && <Image alt={`${label} logo`} src={logo} width={30} height={30} className="h-5 w-5 object-cover rounded-[2px]" />}
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}