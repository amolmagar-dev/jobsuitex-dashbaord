"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { LoaderIcon, AlertCircleIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import jobApplicationService from "@/services/jobApplicationService"

// Custom tooltip component for showing portal breakdown
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    // Convert date string to readable format
    if (!label) return null;
    const dateObj = new Date(label);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Get portal data
    const portals = payload[0]?.payload?.portals || {};
    const portalEntries = Object.entries(portals);
    
    return (
      <div className="rounded-lg border bg-card p-3 shadow-sm">
        <h5 className="mb-2 font-medium">{formattedDate}</h5>
        <p className="mb-2 text-lg font-semibold">
          Total: {payload[0].value} Applications
        </p>
        {portalEntries.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Application sources:</p>
            {portalEntries.map(([portal, count]) => (
              <div key={portal} className="flex items-center justify-between gap-2">
                <span className="text-sm">{portal}:</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No portal data available</p>
        )}
      </div>
    );
  }

  return null;
};

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Effect to handle mobile view
  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d")
    }
  }, [isMobile])

  // Effect to fetch data when time range changes
  React.useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await jobApplicationService.jobApplications.getActivityTimeline(timeRange)
        
        if (response.data && response.data.success) {
          // Format dates for display
          interface TimelineItem {
            date: string;
            count: number;
            portals: Record<string, number>;
          }
          
          const formattedData = response.data.timeline.map((item: TimelineItem) => {
            const date = new Date(item.date);
            return {
              ...item,
              dateFormatted: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })
            }
          });
          
          setChartData(formattedData);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch timeline data');
        }
      } catch (err: unknown) {
        console.error('Error fetching timeline data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [timeRange]);

  interface TimeRangeValue {
    value: '90d' | '30d' | '7d';
  }

  const handleTimeRangeChange = (value: TimeRangeValue['value']): void => {
    if (value) {
      setTimeRange(value);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-[250px] w-full items-center justify-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>Error loading data: {error}</AlertDescription>
        </Alert>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
          No application data available for the selected time period
        </div>
      );
    }

    // For cleaner visualization, if we have many data points, use bar chart for mobile
    // and area chart for desktop
    const ChartComponent = (timeRange === '90d' && isMobile) ? BarChart : AreaChart;
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <ChartComponent data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={isMobile ? 15 : 30}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={[0, 'dataMax + 1']}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {ChartComponent === AreaChart ? (
            <Area 
              type="monotone" 
              dataKey="count" 
              name="Applications" 
              stroke="hsl(var(--chart-1))" 
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          ) : (
            <Bar 
              dataKey="count" 
              name="Applications" 
              fill="hsl(var(--chart-1))" 
              radius={[4, 4, 0, 0]} 
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Job Application Activity</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Track your daily job application submissions</span>
          <span className="@[540px]/card:hidden">Application activity</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={handleTimeRangeChange}
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
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label="Select a time range">
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
        {renderContent()}
      </CardContent>
    </Card>
  );
}