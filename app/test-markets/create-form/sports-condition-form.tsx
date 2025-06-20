// SportsConditionForm.jsx
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSports } from "@/hooks/sports/use-sports"
import { Match } from "@/types/Matches"
import { Sport } from "@/types/Sports"
import { useEffect, useState } from "react"
import MatchCombobox from "./match-combobox"

const metrics = [
  {
    id: 1,
    name: "Home Score",
    value: "homescore",
  },
  {
    id: 2,
    name: "Away Score",
    value: "awayscore",
  },
  {
    id: 3,
    name: "Winner",
    value: "winner",
  },
  {
    id: 4,
    name: "Spread",
    value: "spread",
  },
]

export interface SportsPrediction {
  sport: Sport
  match: Match
  metric: string
  condition: string
  value: string
}

const SportsConditionForm = ({
  conditionId,
  onConfirm,
  sportsCondition,
}: {
  conditionId: number
  onConfirm: (prediction: SportsPrediction) => void
  sportsCondition?: SportsPrediction
}) => {
  const [sport, setSport] = useState<Sport | null>(
    sportsCondition?.sport || null
  )

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(
    sportsCondition?.match || null
  )

  const [metric, setMetric] = useState<string | undefined>(
    sportsCondition?.metric || undefined
  )

  const [direction, setDirection] = useState<string | undefined>(
    sportsCondition?.condition || undefined
  )

  const [value, setValue] = useState<string | undefined>(
    sportsCondition?.value || undefined
  )

  const { data: sports } = useSports()

  useEffect(() => {
    if (!selectedMatch) {
      setMetric(undefined)
      setDirection(undefined)
      setValue(undefined)
    }
  }, [selectedMatch])

  const handlePrediction = () => {
    if (!selectedMatch) return
    if (!metric) return
    if (!direction) return
    if (!value) return
    if (!sport) return

    console.log("Prediction", {
      sport,
      selectedMatch,
      metric,
      direction,
      value,
    })
    const prediction = {
      sport: sport,
      match: selectedMatch,
      metric,
      condition: direction,
      value: value,
    }

    onConfirm(prediction)

    console.log("Prediction", prediction)
  }

  if (!sports) return <>Fetching sports...</>

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor={`sport-${conditionId}`}>Sport Category</Label>
        <Select
          value={sport?.name}
          onValueChange={(value) => {
            console.log({ value })
            const selectedSport = sports.find(
              (sport: any) => sport.name === value
            )
            setSport(selectedSport || null)
          }}
        >
          <SelectTrigger className="w-full" id={`sport-${conditionId}`}>
            <SelectValue placeholder="Select a sport category" />
          </SelectTrigger>
          <SelectContent>
            {sports?.map((sport: any) => (
              <SelectItem key={sport.id} value={sport.name}>
                {sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sport && (
        <div className="mb-4 flex flex-col gap-2">
          <Label htmlFor={`match-${conditionId}`}>Match</Label>
          <MatchCombobox
            id={sport.id}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
          />
        </div>
      )}
      {selectedMatch && (
        <div className="mb-4 flex flex-col gap-2">
          <Label htmlFor={`outcomeType-${conditionId}`}>Metric</Label>
          <Select
            value={metric}
            onValueChange={(value) => {
              setMetric(value)
              setDirection(undefined)
              setValue(undefined)
            }}
          >
            <SelectTrigger className="w-full" id={`outcomeType-${conditionId}`}>
              <SelectValue placeholder="Select a metric" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((metric) => (
                <SelectItem key={metric.id} value={metric.value}>
                  {metric.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedMatch && metric === "winner" && (
        <div className="mb-4 flex flex-col gap-2">
          <Label htmlFor={`winner-${conditionId}`}>Winner</Label>
          <Select
            value={value}
            onValueChange={(value) => {
              setDirection("equal")
              setValue(value)
            }}
          >
            <SelectTrigger className="w-full" id={`winner-${conditionId}`}>
              <SelectValue placeholder="Select a winner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">
                {selectedMatch?.home_team_name}
              </SelectItem>
              <SelectItem value="away">
                {selectedMatch?.away_team_name}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedMatch && metric !== "winner" && (
        <div className="mb-4 flex flex-row gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`metric-${conditionId}`}>Condition</Label>
            <Select
              value={direction}
              onValueChange={(value) => {
                setDirection(value)
              }}
            >
              <SelectTrigger className="w-full" id={`metric-${conditionId}`}>
                <SelectValue placeholder="Select a direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="over">Over or Equal</SelectItem>
                <SelectItem value="under">Under or Equal</SelectItem>
                <SelectItem value="equal">Equal to</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`value-${conditionId}`}>Value</Label>
            <Input
              className="w-full"
              id={`value-${conditionId}`}
              placeholder="Enter value"
              value={value}
              type="number"
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
      )}
      <Button
        disabled={!selectedMatch || !metric || !direction || !value || !sport}
        onClick={handlePrediction}
        type="button"
        className="w-full mt-4"
      >
        {sportsCondition ? "Update Condition" : "Confirm Condition"}
      </Button>
    </>
  )
}

export default SportsConditionForm
