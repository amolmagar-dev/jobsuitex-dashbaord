// File: app/page.tsx

"use client"

import { useAuth } from "@/components/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { DashboardWrapper } from "@/components/dashboard-wrapper"
import data from "./dashboard/data.json"
import { ApplicationsTable } from "@/components/applications-table"

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render the dashboard if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect due to the useEffect
  }

  // Your existing dashboard content
  return (
    <DashboardWrapper>
      <SectionCards />
      
      <div className="px-4 lg:px-6 py-4">
        <ChartAreaInteractive />
      </div>
      
      <ApplicationsTable data={data} />
    </DashboardWrapper>
  );
}