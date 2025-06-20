import tokens from "@/assets/data/token-list.json"

export const MOCKED_OPTIONS = {
  sports: [
    { value: "basketball", label: "Basketball" },
    { value: "football", label: "Football" },
    { value: "rugby", label: "Rugby" },
  ],
  leagues: [
    { value: "value1", label: "Value 1" },
    { value: "value2", label: "Value 2" },
    { value: "value3", label: "Value 3" },
  ],
  teams: [
    { value: "team1", label: "Bayer Munich", logo: "/images/bay-logo.png" },
    { value: "team2", label: "Everton", logo: "/images/eve-logo.png" },
    { value: "team3", label: "Manchester City", logo: "/images/mci-logo.png" },
  ],
  outcomes: [
    { value: "price", label: "Price" },
    { value: "volume", label: "Volume" },
    { value: "market-cap", label: "Market Cap" },
    { value: "supply", label: "Supply" },
  ],
  conditions: [
    { value: "greater-than", label: "Greater than" },
    { value: "lower-than", label: "Lower than" },
    { value: "equal-to", label: "Equal to" },
    { value: "between", label: "Between" },
  ],
  currencies: [
    { value: "USD", label: "USD - Dollar" },
    { value: "EUR", label: "EUR - Euro" },
 
  ],
  tokens: tokens.map((token) => ({
    value: token.id,
    label: `${token.symbol.toUpperCase()} - ${token.name}`,
  })),
}
