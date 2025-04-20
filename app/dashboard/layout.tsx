"use client";

import ProtectedRoute from "@/components/protected-route";
import { DashboardWrapper } from "@/components/dashboard-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardWrapper>{children}</DashboardWrapper>
    </ProtectedRoute>
  );
}