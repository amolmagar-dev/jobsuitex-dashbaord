"use client"

import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TabNavigation } from "@/components/tab-navigation"

export function DashboardWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
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
                                <TabNavigation />
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}