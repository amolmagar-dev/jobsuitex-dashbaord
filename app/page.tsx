"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { DashboardWrapper } from "@/components/dashboard-wrapper"

import data from "./dashboard/data.json"
import { ApplicationsTable } from "@/components/applications-table"

export default function HomePage() {
  return (
    <DashboardWrapper>
      <SectionCards />
      
      <div className="px-4 lg:px-6 py-4">
        <ChartAreaInteractive />
      </div>
      
      <ApplicationsTable data={data} />
    </DashboardWrapper>
  )
}