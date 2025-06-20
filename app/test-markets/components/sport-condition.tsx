/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Match } from "@/types/Matches";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

const sportsOptions = [
  {
    value: "Outcome",
    label: "Outcome",
  },
  {
    value: "Total",
    label: "Total Score",
  },
  {
    value: "Home",
    label: "Home Score",
  },
  {
    value: "Away",
    label: "Away Score",
  },
];

const totalOptions = [
  {
    value: "over",
    label: "Over or Equal",
  },
  {
    value: "under",
    label: "Under or Equal",
  },
];

export default function SportCondition({
  matches,
  onAddCondition,
  condition,
}: {
  matches: Match[];
  onAddCondition: (condition: unknown) => void;
  condition: any;
}) {
  const [selectedSportsOption, setSelectedSportsOption] = useState<
    string | undefined
  >(condition?.data?.condition);
  const [selectedMatch, setSelectedMatch] = useState<string | undefined>(
    condition?.data?.subCategory
  );
  const [selectedTotalOption, setSelectedTotalOption] = useState<
    string | undefined
  >(condition?.data?.condition);
  const [totalValue, setTotalValue] = useState<number>(
    condition?.data?.value
  );
  const [selectedWinner, setSelectedWinner] = useState<string | undefined>(
    condition?.data?.winner
  );

  const disabled =
    !selectedMatch ||
    !selectedSportsOption ||
    (selectedSportsOption === "Outcome" && !selectedWinner) ||
    (selectedSportsOption !== "Outcome" &&
      (!selectedTotalOption || !totalValue));

  const handleAddCondition = () => {
    if (disabled) return;
    const condition = {
      type: "sports",
      data: {
        subCategory: selectedSportsOption.toLowerCase(),
        condition:
          selectedSportsOption === "Outcome" ? "equal" : selectedTotalOption,
        value:
          selectedSportsOption === "Outcome"
            ? selectedWinner?.toLocaleLowerCase()
            : totalValue.toString(),
      },
    };
    onAddCondition(condition.data);
  };

  return (
    <>
      <div>
        <MatchesSearch
          matches={matches.map((i) => ({
            value: i.id.toString(),
            label: `${i.home_team_name} vs ${i.away_team_name}`,
          }))}
          selectedMatch={selectedMatch}
          setSelectedMatch={(match) => {
            setSelectedWinner(undefined);
            setSelectedTotalOption(undefined);
            setTotalValue(0);
            setSelectedMatch(match);
            setSelectedSportsOption(undefined);
          }}
        />
      </div>

      {selectedMatch && (
        <div>
          <Select
            value={selectedSportsOption}
            onValueChange={(value) => {
              setSelectedSportsOption(value);
              setSelectedWinner(undefined);
              setSelectedTotalOption(undefined);
              setTotalValue(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Options" />
            </SelectTrigger>
            <SelectContent>
              {sportsOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedSportsOption === "Outcome" && (
        <Select
          value={selectedWinner || undefined}
          onValueChange={setSelectedWinner}
          disabled={!selectedMatch}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Winner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Home">
              {
                matches.find((m) => m.id.toString() === selectedMatch)
                  ?.home_team_name
              }
            </SelectItem>
            <SelectItem value="Away">
              {
                matches.find((m) => m.id.toString() === selectedMatch)
                  ?.away_team_name
              }
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {selectedSportsOption && selectedSportsOption !== "Outcome" && (
        <div className="flex gap-2">
          <Select
            value={selectedTotalOption}
            onValueChange={setSelectedTotalOption}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              {totalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Enter Value"
            value={totalValue}
            onChange={(e) => setTotalValue(Number(e.target.value))}
          />
        </div>
      )}
      <Button
        className="w-full"
        disabled={disabled}
        onClick={handleAddCondition}
        type="button"
      >
        Add Condition
      </Button>
    </>
  );
}

const MatchesSearch = ({
  matches,
  selectedMatch,
  setSelectedMatch,
}: {
  matches: { value: string; label: string }[];
  selectedMatch: string | undefined;
  setSelectedMatch: (match: string | undefined) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedMatch
            ? matches.find((m) => m.value === selectedMatch)?.label
            : "Select Match..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command
          filter={(value, search) => {
            const match = matches.find((m) => m.value === value);
            if (match?.label.toLowerCase().includes(search.toLowerCase()))
              return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Search match..." />
          <CommandList>
            <CommandEmpty>No match found</CommandEmpty>
            <CommandGroup>
              {matches.map((match) => (
                <CommandItem
                  key={match.value}
                  value={match.value}
                  onSelect={(currentValue) => {
                    setSelectedMatch(
                      currentValue === selectedMatch ? undefined : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMatch === match.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {match.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
