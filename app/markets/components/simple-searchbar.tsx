import { Search } from "lucide-react"

interface SearchBarProps {
  placeholder?: string
  className?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function SimpleSearchBar({
  className = "",
  placeholder = "",
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-[#353539] rounded-full pl-10 pr-4 py-[6px] text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#444] placeholder:text-[13px] placeholder:font-light"
      />
    </div>
  )
}
