"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const chartData = [
  { date: "2024-01-01", applications: 5, interviews: 0, offers: 0 },
  { date: "2024-01-08", applications: 8, interviews: 2, offers: 0 },
  { date: "2024-01-15", applications: 12, interviews: 3, offers: 1 },
  { date: "2024-01-22", applications: 7, interviews: 4, offers: 0 },
  { date: "2024-01-29", applications: 10, interviews: 2, offers: 0 },
  { date: "2024-02-05", applications: 15, interviews: 5, offers: 1 },
  { date: "2024-02-12", applications: 9, interviews: 3, offers: 0 },
  { date: "2024-02-19", applications: 11, interviews: 4, offers: 1 },
  { date: "2024-02-26", applications: 14, interviews: 6, offers: 2 },
  { date: "2024-03-04", applications: 8, interviews: 3, offers: 0 },
  { date: "2024-03-11", applications: 12, interviews: 5, offers: 1 },
  { date: "2024-03-18", applications: 16, interviews: 7, offers: 2 },
  { date: "2024-03-25", applications: 10, interviews: 4, offers: 1 },
  { date: "2024-04-01", applications: 13, interviews: 6, offers: 1 },
  { date: "2024-04-08", applications: 18, interviews: 8, offers: 2 },
  { date: "2024-04-15", applications: 14, interviews: 5, offers: 1 },
  { date: "2024-04-22", applications: 11, interviews: 4, offers: 0 },
]

const chartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(var(--chart-1))",
  },
  interviews: {
    label: "Interviews",
    color: "hsl(var(--chart-2))",
  },
  offers: {
    label: "Offers",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-04-22")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Job Application Activity</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Track your applications, interviews, and offers over time</span>
          <span className="@[540px]/card:hidden">Application activity</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-applications)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-applications)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillInterviews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-interviews)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-interviews)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillOffers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-offers)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-offers)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="applications"
              type="monotone"
              fill="url(#fillApplications)"
              stroke="var(--color-applications)"
            />
            <Area dataKey="interviews" type="monotone" fill="url(#fillInterviews)" stroke="var(--color-interviews)" />
            <Area dataKey="offers" type="monotone" fill="url(#fillOffers)" stroke="var(--color-offers)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
