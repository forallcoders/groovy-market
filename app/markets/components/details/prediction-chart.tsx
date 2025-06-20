"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Settings } from "lucide-react"
import { usePriceHistory } from "@/hooks/market/use-price-history"
import { Switch } from "@/components/ui/switch"
import ResponsiveModal from "@/components/modals/responsive-modal"
import { Button } from "@/components/ui/button"

const formatData = (rawData: any, activeTab: string) => {
  return rawData.map((item: any) => {
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

const getFilteredData = (data: any, activeTab: string) => {
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

  return data.filter((item: any) => item.timestampObj >= startTime)
}

const processApiData = (
  yesData: PriceHistoryPoint[] = [],
  noData: PriceHistoryPoint[] = []
) => {
  const timeMap = new Map<number, { yes?: number; no?: number }>()

  yesData.forEach((point) => {
    timeMap.set(point.t, {
      ...timeMap.get(point.t),
      yes: point.p * 100,
    })
  })

  noData.forEach((point) => {
    timeMap.set(point.t, {
      ...timeMap.get(point.t),
      no: point.p * 100,
    })
  })

  return Array.from(timeMap.entries())
    .map(([timestamp, values]) => {
      const yesValue = values.yes ?? (values.no ? 100 - values.no : 50)
      const noValue = values.no ?? (values.yes ? 100 - values.yes : 50)

      return {
        timestamp: timestamp * 1000,
        yes: yesValue,
        no: noValue,
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
}

const formatXAxis = (tickItem: string, index: number, filteredData: any[]) => {
  if (!filteredData || filteredData.length === 0) return ""

  const totalTicks = filteredData.length

  // If we have 6 or fewer data points, show all of them
  if (totalTicks <= 6) {
    return tickItem
  }

  // We want to show exactly 6 labels evenly distributed
  // Always show first and last, then 4 points in between
  const indicesToShow = [
    0,
    Math.floor(totalTicks / 5),
    Math.floor((2 * totalTicks) / 5),
    Math.floor((3 * totalTicks) / 5),
    Math.floor((4 * totalTicks) / 5),
    totalTicks - 1,
  ]

  if (indicesToShow.includes(index)) {
    return tickItem
  }

  return ""
}

interface PriceHistoryPoint {
  t: number
  p: number
}

interface PredictionChartProps {
  marketId: string
  showOptions: string[]
}

const PredictionChart = ({ marketId, showOptions }: PredictionChartProps) => {
  const [activeTab, setActiveTab] = useState("all")
  const [openModal, setOpenModal] = useState(false)
  const [displaySettings, setDisplaySettings] = useState({
    showYes: true,
    showNo: true,
    xAxis: true,
    yAxis: true,
    decimals: true,
  })
  const {
    data: priceData,
    isLoading,
    error,
  } = usePriceHistory({ marketId, interval: activeTab })

  const processedData = useMemo(() => {
    if (!priceData) return []

    if (priceData.history) {
      return priceData.history.map((point: any) => ({
        timestamp: point.t * 1000,
        yes: point.p * 100,
        label: point.label,
      }))
    }

    if (priceData.yes && priceData.no) {
      return processApiData(priceData.yes, priceData.no)
    }

    return []
  }, [priceData])

  const formattedData = useMemo(() => {
    return formatData(processedData, activeTab)
  }, [processedData, activeTab])

  const filteredData = useMemo(() => {
    return getFilteredData(formattedData, activeTab)
  }, [formattedData, activeTab])

  const latestData = filteredData.length
    ? filteredData[filteredData.length - 1]
    : null

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
          {payload.find((p) => p.dataKey === "yes") && (
            <p className="text-sm text-primary">
              {showOptions?.[0] || "Yes"}:{" "}
              {payload
                .find((p) => p.dataKey === "yes")
                ?.value.toFixed(displaySettings.decimals ? 1 : 0)}
              %
            </p>
          )}
          {payload.find((p) => p.dataKey === "no") && (
            <p className="text-sm text-primary">
              {showOptions?.[1] || "No"}:{" "}
              {payload
                .find((p) => p.dataKey === "no")
                ?.value.toFixed(displaySettings.decimals ? 1 : 0)}
              %
            </p>
          )}
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
            Game Forecast
          </h4>
          <div className="flex gap-4 text-[#81898E]">
            {displaySettings.showYes && latestData && (
              <div className="flex items-baseline gap-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-[#CC0066]" />
                <p>{showOptions?.[0] || "Yes"}</p>
                <p>{Math.round(latestData.yes)}%</p>
              </div>
            )}
            {displaySettings.showNo && latestData && (
              <div className="flex items-baseline gap-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-[#9900CC]" />
                <p>{showOptions?.[1] || "No"}</p>
                <p>{Math.round(latestData.no)}%</p>
              </div>
            )}
          </div>
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
          ) : formattedData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p>No price data available for this time period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={filteredData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                {displaySettings.xAxis && (
                  <XAxis
                    dataKey="date"
                    tickFormatter={(tick, index) =>
                      formatXAxis(tick, index, filteredData)
                    }
                    tickMargin={10}
                    minTickGap={15}
                    interval={0}
                    padding={{ left: 5 }}
                  />
                )}
                {displaySettings.yAxis && (
                  <YAxis
                    tickFormatter={(value) =>
                      `${value.toFixed(displaySettings.decimals ? 1 : 0)}%`
                    }
                    orientation="right"
                    tickMargin={10}
                    domain={[0, 100]}
                    stroke="#81898E"
                  />
                )}
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
                {displaySettings.showNo && (
                  <Line
                    type="monotone"
                    dataKey="no"
                    stroke="#9900CC"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {displaySettings.showYes && (
                  <Line
                    type="monotone"
                    dataKey="yes"
                    stroke="#CC0066"
                    strokeWidth={2}
                    dot={false}
                  />
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
            <div className="flex gap-2 items-center">
              <Button
                size="icon"
                className="hover:bg-foreground/10 bg-transparent p-2 h-fit w-fit"
                onClick={() => setOpenModal(true)}
              >
                <Settings size={20} color="#81898E" className="!w-5 !h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ResponsiveModal open={openModal} onOpenChange={setOpenModal}>
        <h2 className="text-lg font-bold mb-4">Chart Settings</h2>
        {Object.keys(displaySettings).map((key) => {
          const value = key.replace(/([A-Z])/g, " $1")
          const formattedValue = value
            .replace("Yes", showOptions[0])
            .replace("No", showOptions[1])

          return (
            <div key={key} className="flex justify-between items-center mb-2">
              <span>{formattedValue}</span>
              <Switch
                checked={(displaySettings as any)[key]}
                onCheckedChange={(val) =>
                  setDisplaySettings({ ...displaySettings, [key]: val })
                }
              />
            </div>
          )
        })}
      </ResponsiveModal>
    </>
  )
}

export default PredictionChart
