import { MOCKED_OPTIONS } from "@/app/markets/create/data/mockedOptions"
import { ConditionsForms } from "@/app/markets/create/types/conditions-card.types"
import { Label } from "@/components/ui/Label/label"

export const FORM_SCHEMAS: ConditionsForms = {
  sports: [
    {
      fields: [
        {
          label: "Select Sport",
          name: "sport",
          type: "select",
          options: MOCKED_OPTIONS.sports,
          placeholder: "Select sport",
          variant: "orchid",
        },
        {
          label: "Select League",
          name: "league",
          type: "select",
          options: MOCKED_OPTIONS.leagues,
          placeholder: "Select league",
          variant: "orchid",
        },
      ],
    },
    {
      fields: [
        {
          label: "Team 1",
          name: "team1",
          type: "select",
          options: MOCKED_OPTIONS.teams,
          placeholder: "Select team",
        },
        {
          label: "Team 2",
          name: "team2",
          type: "select",
          options: MOCKED_OPTIONS.teams,
          placeholder: "Select team",
        },
      ],
    },
    {
      fields: [
        {
          label: "Outcome",
          name: "outcome1",
          type: "select",
          options: MOCKED_OPTIONS.outcomes,
          placeholder: "Select outcome",
        },
        {
          label: "Outcome",
          name: "outcome2",
          type: "select",
          options: MOCKED_OPTIONS.outcomes,
          placeholder: "Select outcome",
        },
      ],
    },
    {
      fields: [
        {
          label: "Prediction time",
          name: "date",
          type: "date",
          placeholder: "dd.mm.yyyy",
          className: "w-full",
        },
      ],
    },
  ],
  crypto: [
    {
      fields: [
        {
          label: "Select token",
          name: "fiat",
          type: "select",
          options: MOCKED_OPTIONS.tokens,
          placeholder: "Select token",
          variant: "orchid",
        },
        {
          label: "Select currency",
          name: "second-fiat",
          type: "select",
          options: MOCKED_OPTIONS.currencies,
          placeholder: "Select currency",
          variant: "orchid",
        },
      ],
    },
    {
      fields: [
        {
          label: "Outcome",
          name: "outcome",
          type: "select",
          options: MOCKED_OPTIONS.outcomes,
          placeholder: "Select outcome",
        },
        {
          label: "Condition",
          name: "condition",
          type: "select",
          options: MOCKED_OPTIONS.conditions,
          placeholder: "Select condition",
        },
      ],
    },
    {
      fields: [
        {
          label: (firstFiat: string, secondFiat: string) => (
            <Label>
              Target price{" "}
              {firstFiat && secondFiat && (
                <>
                  <span>of </span>
                  <span className="text-orchid-300 uppercase">
                    {firstFiat}
                  </span>{" "}
                  in{" "}
                  <span className="text-orchid-300 uppercase">
                    {secondFiat}
                  </span>
                </>
              )}
            </Label>
          ),
          name: "price",
          type: "text",
          placeholder: "Set price",
        },
        {
          label: () => (
            <Label>
              To price
            </Label>
          ),
          name: "price2",
          type: "text",
          placeholder: "To price",
        },
      ],
    },
    {
      fields: [
        {
          label: "Prediction time",
          name: "date",
          type: "date",
          placeholder: "dd.mm.yyyy",
        },
      ],
    },
  ],
}
