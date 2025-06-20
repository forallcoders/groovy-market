"use client"

import ResponsiveModal from "@/components/modals/responsive-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePriceHistory } from "@/hooks/market/use-price-history"
import { Settings } from "lucide-react"
import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface PriceHistoryPoint {
  t: number
  p: number
  label: string
}

interface GroupedPredictionChartProps {
  marketId: string
  availableLabels: { label: string; color: string }[]
  isCrypto?: boolean
}

const formatData = (rawData: any[], activeTab: string) => {
  return rawData.map((item) => {
    const date = new Date(item.timestamp)
    let formattedDate

    if (activeTab === "1h" || activeTab === "6h") {
      formattedDate = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } else if (activeTab === "1d") {
      formattedDate = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      })
    } else {
      formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }

    return {
      ...item,
      date: formattedDate.trim(),
      timestampObj: date,
    }
  })
}

const getFilteredData = (data: any[], activeTab: string) => {
  if (!data.length) return []
  const now = new Date(data[data.length - 1].timestampObj)
  const msPerHour = 60 * 60 * 1000
  const msPerDay = 24 * msPerHour

  let startTime

  switch (activeTab) {
    case "1h":
      startTime = new Date(now.getTime() - msPerHour)
      break
    case "6h":
      startTime = new Date(now.getTime() - 6 * msPerHour)
      break
    case "1d":
      startTime = new Date(now.getTime() - msPerDay)
      break
    case "1w":
      startTime = new Date(now.getTime() - 7 * msPerDay)
      break
    case "1m":
      startTime = new Date(now.getTime() - 30 * msPerDay)
      break
    default:
      return data
  }

  return data.filter((item) => item.timestampObj >= startTime)
}

const processApiDataGrouped = (
  history: PriceHistoryPoint[],
  displaySettings: Record<string, boolean>
) => {
  const timeMap = new Map<number, any>()

  history.forEach((point) => {
    if (!point.label || !displaySettings[point.label]) return

    const existing = timeMap.get(point.t) || {
      timestamp: point.t * 1000,
      timestampObj: new Date(point.t * 1000),
    }

    timeMap.set(point.t, {
      ...existing,
      [point.label]: point.p * 100,
    })
  })

  return Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp)
}

const formatXAxis = (tickItem: string, index: number, filteredData: any[]) => {
  if (!filteredData || filteredData.length === 0) return ""
  const totalTicks = filteredData.length
  if (totalTicks <= 6) return tickItem

  const indicesToShow = [
    0,
    Math.floor(totalTicks / 5),
    Math.floor((2 * totalTicks) / 5),
    Math.floor((3 * totalTicks) / 5),
    Math.floor((4 * totalTicks) / 5),
    totalTicks - 1,
  ]

  return indicesToShow.includes(index) ? tickItem : ""
}

const GroupedPredictionChart = ({
  marketId,
  availableLabels,
  isCrypto = false,
}: GroupedPredictionChartProps) => {
  const [activeTab, setActiveTab] = useState("all")
  const [openModal, setOpenModal] = useState(false)

  const [displaySettings, setDisplaySettings] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(availableLabels.map((m) => [m.label, true])))
  const { data, isLoading, error } = usePriceHistory({
    marketId,
    interval: activeTab,
  })
  const processedData = useMemo(() => {
    return processApiDataGrouped(data?.history ?? [], displaySettings)
  }, [data, displaySettings])
  const formattedData = useMemo(() => {
    return formatData(processedData, activeTab)
  }, [processedData, activeTab])
  const filteredData = useMemo(() => {
    return getFilteredData(formattedData, activeTab)
  }, [formattedData, activeTab])
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: any[]
  }) => {
    if (active && payload && payload.length) {
      const timestamp = payload[0]?.payload?.timestampObj
      let formattedTime = ""

      if (timestamp) {
        formattedTime = timestamp.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      }

      return (
        <div className="bg-card p-2 border border-foreground rounded-md shadow-md">
          <p className="text-sm text-primary font-medium">
            {payload[0].payload.date}
            {formattedTime && ` ${formattedTime}`}
          </p>
          {payload.map((entry, index) => (
            <p
              key={`${entry.dataKey}-${index}`}
              className="text-sm text-primary"
            >
              {entry.name}: {entry.value?.toFixed(1)}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Card className="p-4 pb-1.5 w-full gap-2 text-white bg-transparent border-[1.5px] border-[#353739] shadow-none">
        <CardHeader className="p-0 flex gap-1 justify-between">
          <h4 className="text-lg font-medium leading-none mb-3">
            {isCrypto ? "Market" : "Game"} Forecast
          </h4>
        </CardHeader>
        <CardContent className="p-0 pt-2 md:pt-4 text-sm">
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p>Loading chart data...</p>
            </div>
          ) : error ? (
            <div className="h-[300px] flex items-center justify-center text-red-500">
              <p>Error: {error.message}</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p>No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={filteredData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick, i) =>
                    formatXAxis(tick, i, filteredData)
                  }
                  tickMargin={10}
                  minTickGap={15}
                  interval={0}
                  padding={{ left: 5 }}
                />
                <YAxis
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  orientation="right"
                  tickMargin={10}
                  domain={[0, 100]}
                  stroke="#81898E"
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#353739"
                />
                <Tooltip
                  content={({ active, payload }) => (
                    <CustomTooltip active={active} payload={payload} />
                  )}
                />
                {availableLabels.map(({ label, color }, index) =>
                  displaySettings[label] ? (
                    <Line
                      key={`${label}-${index}`}
                      type="monotone"
                      dataKey={label}
                      name={label}
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-between md:flex-row items-center mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="gap-0 sm:gap-2 bg-transparent text-[#81898E]">
                {["1h", "6h", "1d", "1w", "1m", "all"].map((time) => (
                  <TabsTrigger
                    key={time}
                    value={time}
                    className="data-[state=active]:text-white font-regular data-[state=active]:bg-[#353739] rounded-[2px] hover:text-white hover:bg-[#353739] !border-0"
                  >
                    {time.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              size="icon"
              className="hover:bg-foreground/10 bg-transparent p-2 h-fit w-fit"
              onClick={() => setOpenModal(true)}
            >
              <Settings size={20} color="#81898E" className="!w-5 !h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <ResponsiveModal open={openModal} onOpenChange={setOpenModal}>
        <h2 className="text-lg font-bold mb-4">Chart Settings</h2>
        {availableLabels.map(({ label }, index) => (
          <div
            key={`${label}-${index}`}
            className="flex justify-between items-center mb-2"
          >
            <span>{label}</span>
            <Switch
              checked={displaySettings[label]}
              onCheckedChange={(val) =>
                setDisplaySettings((prev) => ({ ...prev, [label]: val }))
              }
            />
          </div>
        ))}
      </ResponsiveModal>
    </>
  )
}

export default GroupedPredictionChart
