"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { DashboardWrapper } from "@/components/dashboard-wrapper"

import data from "./dashboard/data.json"

export default function HomePage() {
  return (
    <DashboardWrapper>
      <SectionCards />
      
      <div className="px-4 lg:px-6 py-4">
        <ChartAreaInteractive />
      </div>
      
      <DataTable data={data} />
    </DashboardWrapper>
  )
}