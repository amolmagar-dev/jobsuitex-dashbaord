// Overview Tab Content
export function OverviewContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Revenue" 
          value="$45,231.89" 
          change="+20.1%" 
          timeframe="from last month"
          icon="$"
        />
        <MetricCard 
          title="Subscriptions" 
          value="+2350" 
          change="+180.1%" 
          timeframe="from last month"
          icon="👥"
        />
        <MetricCard 
          title="Sales" 
          value="+12,234" 
          change="+19%" 
          timeframe="from last month"
          icon="💳"
        />
        <MetricCard 
          title="Active Now" 
          value="+573" 
          change="+201" 
          timeframe="since last hour"
          icon="📈"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-medium mb-6">Overview</h3>
            <div className="h-60 w-full bg-muted/20 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Revenue Chart Placeholder</p>
            </div>
          </div>
        </div>
        
        <div>
          <div className="border rounded-xl p-6">
            <h3 className="text-lg font-medium mb-2">Recent Sales</h3>
            <p className="text-sm text-muted-foreground mb-4">You made 265 sales this month.</p>
            
            <div className="space-y-4">
              <SaleItem 
                name="Olivia Martin"
                email="olivia.martin@email.com"
                amount="+$1,999.00"
              />
              <SaleItem 
                name="Jackson Lee"
                email="jackson.lee@email.com"
                amount="+$39.00"
              />
              <SaleItem 
                name="Isabella Nguyen"
                email="isabella.nguyen@email.com"
                amount="+$299.00"
              />
              <SaleItem 
                name="William Kim"
                email="will@email.com"
                amount="+$99.00"
              />
              <SaleItem 
                name="Sofia Davis"
                email="sofia.davis@email.com"
                amount="+$39.00"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Content
export function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Traffic Sources</h3>
            <div className="h-60 w-full bg-muted/20 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Pie Chart Placeholder</p>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">User Engagement</h3>
            <div className="h-60 w-full bg-muted/20 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Line Chart Placeholder</p>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Conversion Rates</h3>
            <div className="h-60 w-full bg-muted/20 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Funnel Chart Placeholder</p>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">User Demographics</h3>
            <div className="h-60 w-full bg-muted/20 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Bar Chart Placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reports Tab Content
export function ReportsContent() {
  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Reports</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Q1 Financial Report</h3>
              <p className="text-sm text-muted-foreground">Generated on April 1, 2023</p>
            </div>
            <Button variant="outline" size="sm">Download</Button>
          </div>
          <div className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Monthly Sales Report</h3>
              <p className="text-sm text-muted-foreground">Generated on May 1, 2023</p>
            </div>
            <Button variant="outline" size="sm">Download</Button>
          </div>
          <div className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">User Acquisition Report</h3>
              <p className="text-sm text-muted-foreground">Generated on May 15, 2023</p>
            </div>
            <Button variant="outline" size="sm">Download</Button>
          </div>
          <div className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Marketing Campaign Performance</h3>
              <p className="text-sm text-muted-foreground">Generated on June 1, 2023</p>
            </div>
            <Button variant="outline" size="sm">Download</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notifications Tab Content
export function NotificationsContent() {
  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Notifications</h2>
        <div className="space-y-4">
          <NotificationItem 
            title="New subscription"
            message="You have a new premium subscriber"
            time="2 minutes ago"
            type="success"
          />
          <NotificationItem 
            title="Payment failed"
            message="Customer payment failed for order #45678"
            time="1 hour ago"
            type="error"
          />
          <NotificationItem 
            title="New comment"
            message="Someone commented on your latest post"
            time="3 hours ago"
            type="info"
          />
          <NotificationItem 
            title="Server maintenance"
            message="Scheduled maintenance on June 15th"
            time="1 day ago"
            type="warning"
          />
          <NotificationItem 
            title="New feature"
            message="Check out our new analytics dashboard"
            time="2 days ago"
            type="info"
          />
        </div>
      </div>
    </div>
  )
}

// Helper Components
interface MetricCardProps {
  title: string
  value: string
  change: string
  timeframe: string
  icon: string
}

function MetricCard({ title, value, change, timeframe, icon }: MetricCardProps) {
  return (
    <div className="border rounded-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">
        <span className="text-green-500">{change}</span> {timeframe}
      </div>
    </div>
  )
}

interface SaleItemProps {
  name: string
  email: string
  amount: string
}

function SaleItem({ name, email, amount }: SaleItemProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>
      <p className="font-medium">{amount}</p>
    </div>
  )
}

interface NotificationItemProps {
  title: string
  message: string
  time: string
  type: "success" | "error" | "warning" | "info"
}

function NotificationItem({ title, message, time, type }: NotificationItemProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "success": return "bg-green-500/10 border-green-500/20";
      case "error": return "bg-red-500/10 border-red-500/20";
      case "warning": return "bg-yellow-500/10 border-yellow-500/20";
      case "info": return "bg-blue-500/10 border-blue-500/20";
      default: return "";
    }
  };
  
  return (
    <div className={`border rounded-lg p-4 ${getTypeStyles()}`}>
      <div className="flex justify-between">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
    </div>
  )
}

import { Button } from "@/components/ui/button"