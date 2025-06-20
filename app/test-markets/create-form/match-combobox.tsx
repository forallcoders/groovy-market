// MatchCombobox.jsx
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useMatches } from "@/hooks/sports/use-sports"
import { cn } from "@/lib/utils"
import { Match } from "@/types/Matches"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"

const MatchCombobox = ({
  id,
  selectedMatch,
  setSelectedMatch,
}: {
  id: number
  selectedMatch: Match | null
  setSelectedMatch: (match: Match | null) => void
}) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(selectedMatch?.id.toString() || "")
  const {
    data: matches,
    isLoading,
    error,
  } = useMatches({ sportType: "football" })

  if (isLoading) return <>Loading...</>

  if (error) return <>Error: {error.message}</>

  if (!matches) return <>No matches found</>

  const mappedMatches = matches.map((match: any) => ({
    label: `${match.home_team_name} vs ${match.away_team_name}`,
    value: match.id.toString(),
  }))
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          id={id.toString()}
        >
          {value
            ? mappedMatches.find((match: any) => match.value === value)?.label
            : "Select match..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command
          filter={(value, search) => {
            const match = mappedMatches.find((m: any) => m.value === value)
            if (match?.label.toLowerCase().includes(search.toLowerCase()))
              return 1
            return 0
          }}
        >
          <CommandInput placeholder="Search matches..." />
          <CommandEmpty>No match found.</CommandEmpty>
          <CommandGroup>
            {mappedMatches.map((match: any) => (
              <CommandItem
                key={match.value}
                value={match.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue)
                  if (currentValue !== value) {
                    setSelectedMatch(
                      matches.find(
                        (match: any) => match.id === parseInt(currentValue)
                      ) ?? null
                    )
                  } else {
                    setSelectedMatch(null)
                  }
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === match.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {match.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default MatchCombobox
