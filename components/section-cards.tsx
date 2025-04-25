import { useState, useEffect } from "react"
import { TrendingDownIcon, TrendingUpIcon, BriefcaseIcon, XCircleIcon, ClockIcon, LoaderIcon, CalendarClockIcon } from "lucide-react"

interface Statistics {
  totalApplications?: {
    value: number;
    trend: number;
    recentCount: number;
  };
  earlyApplications?: {
    value: number;
    percentage: number;
  };
  rejectionRate?: {
    value: number;
    trend: number;
    improving: boolean;
  };
}

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import jobApplicationService from "@/services/jobApplicationService"

export function SectionCards() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)
        const response = await jobApplicationService.jobApplications.getDashboardStatistics()
        
        if (response.data && response.data.success) {
          setStatistics(response.data.statistics)
        } else {
          throw new Error(response.data?.message || 'Failed to fetch statistics')
        }
      } catch (err) {
        console.error('Error fetching statistics:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching statistics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStatistics()
    
    // Optional: Set up a refresh interval
    const intervalId = setInterval(fetchStatistics, 5 * 60 * 1000) // Refresh every 5 minutes
    
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
        <Card className="flex h-32 items-center justify-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
        <Card className="p-4 text-destructive">
          <p>Error loading statistics: {error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {/* Total Applications Card */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Applications</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {statistics?.totalApplications?.value || 0}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge 
              variant="outline" 
              className={`flex gap-1 rounded-lg text-xs ${(statistics?.totalApplications?.trend ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {(statistics?.totalApplications?.trend ?? 0) >= 0 ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {(statistics?.totalApplications?.trend ?? 0) >= 0 ? '+' : ''}
              {statistics?.totalApplications?.trend ?? 0}%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <BriefcaseIcon className="size-4" /> {statistics?.totalApplications?.recentCount || 0} new applications this week
          </div>
          <div className="text-muted-foreground">
            {(statistics?.totalApplications?.trend ?? 0) >= 0 
              ? 'Increased activity from last month' 
              : 'Decreased activity from last month'}
          </div>
        </CardFooter>
      </Card>
      
      {/* Early Applications Card */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Early Applications</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {statistics?.earlyApplications?.value || 0}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {statistics?.earlyApplications?.percentage || 0}%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <CalendarClockIcon className="size-4" /> Posted "Just Now" or "Today"
          </div>
          <div className="text-muted-foreground">
            {(statistics?.earlyApplications?.percentage ?? 0) >= 20 
              ? 'Great job! Quick application rate is high' 
              : 'Apply faster to fresh job postings'}
          </div>
        </CardFooter>
      </Card>
      
      {/* Rejection Rate Card */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Rejection Rate</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {statistics?.rejectionRate?.value || 0}%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge 
              variant="outline" 
              className={`flex gap-1 rounded-lg text-xs ${statistics?.rejectionRate?.improving ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {statistics?.rejectionRate?.improving ? (
                <TrendingDownIcon className="size-3" />
              ) : (
                <TrendingUpIcon className="size-3" />
              )}
              {(statistics?.rejectionRate?.trend ?? 0) < 0 ? '' : '+'}
              {statistics?.rejectionRate?.trend ?? 0}%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <XCircleIcon className="size-4" /> {statistics?.rejectionRate?.improving ? 'Improving trend' : 'Working on improvement'}
          </div>
          <div className="text-muted-foreground">
            {statistics?.rejectionRate?.improving
              ? 'Lower rejection rate than last month' 
              : 'Higher rejection rate than last month'}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}