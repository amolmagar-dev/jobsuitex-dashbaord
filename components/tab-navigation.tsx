"use client"

import { Button } from "@/components/ui/button"

interface TabNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavProps) {
  const tabs = ["Overview", "Analytics", "Reports", "Notifications"]
  
  return (
    <div className="flex gap-2 p-1 bg-secondary/20 rounded-lg w-fit">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant={activeTab === tab ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange(tab)}
          className={activeTab === tab ? "" : "text-muted-foreground"}
        >
          {tab}
        </Button>
      ))}
    </div>
  )
}