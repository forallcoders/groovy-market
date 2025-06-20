"use client"

import { Alert, AlertDescription } from "@/components/ui/Alert/alert"
import { Label } from "@/components/ui/Label/label"
import Image from "next/image"
import { useEffect, useState } from "react"

import ConfirmationModal from "@/app/markets/create/components/confirmation-modal"
import { FORM_SCHEMAS } from "@/app/markets/create/data/formSchemas"
import { getResponsiveWidthClass } from "@/app/markets/create/utils/layoutHelpers"
import { renderFormField } from "@/app/markets/create/utils/renderFormField"
import DropdownField from "@/components/ui/Dropdown/dropdown-field"
import { useLeagues, useMatches, useSports } from "@/hooks/sports/use-sports"
import { Match } from "@/types/Matches"
import { Sport } from "@/types/Sports"
import {
  CATEGORY_OPTIONS,
  CONDITIONS_OPTIONS,
  METRIC_OPTIONS,
} from "../utils/constants"

export interface SportsPrediction {
  sport: Sport | null
  match: Match | null
  leagueId?: string
  metric: string
  condition: string
  value: string
}

interface ConditionsCardProps {
  id: string
  index: number
  values: Record<string, any>
  variant?: string
  category: string
  onDeleteCard: (id: string) => void
  onFieldChange: (fieldName: string, value: any) => void
  onCategoryChange: (category: string) => void
  onSportsPredictionChange?: (prediction: SportsPrediction) => void
}

export default function ConditionsCard({
  id,
  values,
  category,
  onDeleteCard,
  onFieldChange,
  onCategoryChange,
  onSportsPredictionChange,
}: ConditionsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: sports } = useSports()
  const { data: leagues, isLoading: isLoadingLeagues } = useLeagues({
    sport: values.sport?.short_name,
  })

  const { data: matches, isLoading: isLoadingMatches } = useMatches(
    values.sport && values.league
      ? {
          sportType: values.sport?.short_name,
          leagueId: values.league?.sport_api_league_id,
        }
      : { sportType: undefined, leagueId: undefined }
  )

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleConfirmDelete = () => {
    onDeleteCard(id)
    closeModal()
  }

  const handleSportChange = (sportName: string) => {
    if (!sports) return
    const sport = sports.find((s: any) => s.name === sportName) || null
    onFieldChange("sport", sport)
    onFieldChange("match", null) // reset match
  }

  const handleMatchChange = (matchId: string) => {
    if (!matches) return
    const match = matches.find((m: any) => m.id.toString() === matchId) || null
    onFieldChange("match", match)
  }
  const handleLeagueChange = (leagueId: string) => {
    if (!leagues) return
    const league =
      leagues.find((l: any) => l.sport_api_league_id.toString() === leagueId) ||
      null
    onFieldChange("league", league)
  }

  useEffect(() => {
    if (
      category === "sports" &&
      values.sport &&
      values.match &&
      values.metric &&
      values.condition &&
      values.value &&
      onSportsPredictionChange
    ) {
      onSportsPredictionChange({
        sport: values.sport,
        match: values.match,
        metric: values.metric,
        condition: values.condition,
        value: values.value,
      })
    }
  }, [
    values.sport,
    values.match,
    values.metric,
    values.condition,
    values.value,
  ])

  return (
    <div id={id} className="relative">
      {/* HEADER */}
      <div className="relative p-4 sm:h-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-orchid-700 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <h1
            className="text-lg font-medium cursor-pointer"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            Condition
            {/* {index} */}
          </h1>
          {!isCollapsed && values.match && category === "sports" && (
            <span className="text-sm opacity-80">
              {values.match.home_team_name} vs {values.match.away_team_name}
            </span>
          )}
        </div>
        <div className="flex items-center w-full sm:w-56 gap-2">
          <Label className="mb-0">Category</Label>
          <DropdownField
            placeholder="Select category"
            options={CATEGORY_OPTIONS}
            className="bg-white/30 text-white focus-visible::ring-0 data-[placeholder]:text-white/80"
            value={category}
            variant="orchid"
            onValueChange={onCategoryChange}
          />
          {/* <Trash2
            onClick={openModal}
            className="absolute sm:static top-3 right-3 size-5 sm:size-8 cursor-pointer"
          /> */}
        </div>
      </div>

      {/* CONDITIONS */}
      {!isCollapsed && (
        <div
          className={`flex flex-col w-full bg-neutral-750 rounded-b-lg ${
            isModalOpen && "opacity-25"
          }`}
        >
          {category === "sports" ? (
            <div className="flex flex-col gap-2 p-3.5">
              <div className="mb-4 flex flex-col gap-2">
                <Label>Sport Category</Label>
                <DropdownField
                  placeholder="Select a sport category"
                  options={
                    sports?.map((sport: any) => ({
                      value: sport.name,
                      label: sport.name,
                    })) || []
                  }
                  value={values.sport?.name}
                  onValueChange={handleSportChange}
                />
              </div>

              {values.sport && (
                <div className="mb-4 flex flex-col gap-2">
                  <Label>Leagues</Label>
                  {isLoadingLeagues ? (
                    <div className="text-sm">Loading leagues...</div>
                  ) : (
                    <DropdownField
                      placeholder="Select league"
                      options={
                        leagues?.map((league: any) => ({
                          value: league.sport_api_league_id.toString(),
                          label: league.name,
                        })) || []
                      }
                      value={values.league?.sport_api_league_id?.toString()}
                      onValueChange={handleLeagueChange}
                    />
                  )}
                </div>
              )}
              {values.league && (
                <div className="mb-4 flex flex-col gap-2">
                  <Label>Matches</Label>
                  {isLoadingMatches ? (
                    <div className="text-sm">Loading matches...</div>
                  ) : (
                    <DropdownField
                      placeholder="Select match"
                      options={
                        matches?.map((match: any) => ({
                          value: match.id.toString(),
                          label: `${match.home_team_name} vs ${match.away_team_name}`,
                        })) || []
                      }
                      value={values.match?.id?.toString()}
                      onValueChange={handleMatchChange}
                    />
                  )}
                </div>
              )}

              {values.match && (
                <div className="mb-4 flex flex-col gap-2">
                  <Label>Metric</Label>
                  <DropdownField
                    placeholder="Select a metric"
                    options={
                      values.sport?.short_name?.toLowerCase() === "football"
                        ? METRIC_OPTIONS
                        : METRIC_OPTIONS.filter(
                            (option) => option.value === "winner"
                          )
                    }
                    value={values.metric}
                    onValueChange={(value) => onFieldChange("metric", value)}
                  />
                </div>
              )}

              {values.match && values.metric === "winner" && (
                <div className="mb-4 flex flex-col gap-2">
                  <Label>Winner</Label>
                  <DropdownField
                    placeholder="Select winner"
                    options={[
                      { value: "home", label: values.match.home_team_name },
                      { value: "away", label: values.match.away_team_name },
                      ...(values.sport?.short_name?.toLowerCase() === "football"
                        ? [{ value: "draw", label: "Draw" }]
                        : []),
                    ]}
                    value={values.value}
                    onValueChange={(value) => {
                      onFieldChange("condition", "equal")
                      onFieldChange("value", value)
                    }}
                  />
                </div>
              )}

              {values.match && values.metric && values.metric !== "winner" && (
                <div className="flex flex-row gap-4">
                  <div className="w-1/2">
                    <Label>Condition</Label>
                    <DropdownField
                      placeholder="Select condition"
                      options={CONDITIONS_OPTIONS}
                      value={values.condition}
                      onValueChange={(value) =>
                        onFieldChange("condition", value)
                      }
                    />
                  </div>
                  <div className="w-1/2">
                    <Label>Value</Label>
                    <input
                      type="number"
                      placeholder="Enter value"
                      className="w-full rounded-[10px] px-[10px] py-2 border-2 border-[#81898E] focus:outline-none focus:ring-1 focus:ring-[#3A3A3A]"
                      value={values.value || ""}
                      onChange={(e) => onFieldChange("value", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {category !== "sports" && (
                <div className="md:mt-4">
                  <Label>Prediction time</Label>
                  <div className="flex gap-2 md:items-end md:flex-row flex-col">
                    <div className="md:w-1/2">
                      <input
                        type="date"
                        className="w-full rounded-[10px] px-[10px] py-2 border-2 border-[#81898E] focus:outline-none focus:ring-1 focus:ring-[#3A3A3A]"
                        value={values.date || ""}
                        onChange={(e) => onFieldChange("date", e.target.value)}
                      />
                    </div>
                    <Alert className="md:w-1/2" variant="information">
                      <Image
                        alt="info icon"
                        src="/icons/info.svg"
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                      <AlertDescription className="text-xs">
                        <span className="font-medium">Note: </span>All
                        prediction time is set in UTC.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {FORM_SCHEMAS[category].map((row, i) => {
                console.log(row)
                if (
                  row.fields[0].name === "price" &&
                  values["condition"] !== "between"
                ) {
                  return (
                    <div
                      key={i}
                      className="flex h-fit w-full gap-2 p-3.5 not-last:border-b-2 border-b-white/10"
                    >
                      {row.fields.slice(0, 1).map((data) => (
                        <div
                          key={data.name}
                          className={getResponsiveWidthClass(row.fields.length)}
                        >
                          {renderFormField(
                            {
                              ...data,
                              value: values[data.name],
                              onChange: (value: string) =>
                                onFieldChange(data.name, value),
                            },
                            values.fiat,
                            values["second-fiat"]
                          )}
                        </div>
                      ))}
                    </div>
                  )
                }
                return (
                  <div
                    key={i}
                    className="flex h-fit w-full gap-2 p-3.5 not-last:border-b-2 border-b-white/10"
                  >
                    {row.fields.map((data, index) => (
                      <div
                        key={data.name}
                        className={getResponsiveWidthClass(row.fields.length)}
                      >
                        {renderFormField(
                          {
                            ...data,
                            value: values[data.name],
                            onChange: (value: string) =>
                              onFieldChange(data.name, value),
                            label:
                              row.fields[0].name === "price" &&
                              values["condition"] === "between" &&
                              index === 0
                                ? "From price"
                                : data.label,
                            placeholder:
                              row.fields[0].name === "price" &&
                              values["condition"] === "between" &&
                              index === 0
                                ? "From price"
                                : data.placeholder,
                          },
                          values.fiat,
                          values["second-fiat"]
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title="Delete Conditions Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        confirmText="Yes, delete"
        danger={true}
      />
    </div>
  )
}
