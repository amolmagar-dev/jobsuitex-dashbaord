"use client"

import { useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

import data from "./dashboard/data.json"

export default function Page() {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "0px",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="px-4 py-4 lg:px-6">

              
              <div className="mb-1">
                <div className="inline-flex bg-muted/20 rounded-lg p-1">
                  {["Overview", "Analytics", "Reports", "Notifications"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm rounded-md transition-colors ${
                        activeTab === tab 
                          ? "bg-background text-foreground font-medium shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <SectionCards />
            
            <div className="px-4 lg:px-6 py-4">
              <ChartAreaInteractive />
            </div>
            
            <DataTable data={data} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}