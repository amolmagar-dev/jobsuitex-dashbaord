"use client";

import { useState } from "react";
import { DashboardWrapper } from "@/components/dashboard-wrapper";
import { Button } from "@/components/ui/button";
import { AutoJobApplicationModal } from "@/components/auto-job-modal";
import { Briefcase, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "sonner";

export default function AutoJobPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <DashboardWrapper>
      <Toaster position="top-right" />

      <div className="w-full p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Auto Job Application</h1>
            <p className="text-muted-foreground">Create and manage configurations for automated job applications</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Configuration
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <span>Software Engineer</span>
                <div className="w-4 h-4 rounded-full bg-green-500" title="Active"></div>
              </CardTitle>
              <CardDescription>Naukri Portal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keywords:</span>
                  <span>react, javascript, node.js</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>Bangalore, Remote</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span>Daily at 09:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applications:</span>
                  <span>42 sent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <span>UI/UX Designer</span>
                <div className="w-4 h-4 rounded-full bg-red-500/30" title="Inactive"></div>
              </CardTitle>
              <CardDescription>Naukri Portal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keywords:</span>
                  <span>figma, UI, design, UX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>Mumbai, Delhi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span>Weekly Mon, Wed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applications:</span>
                  <span>23 sent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center p-6" onClick={() => setModalOpen(true)}>
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Add New Config</p>
            <p className="text-sm text-muted-foreground text-center mt-2">Set up a new automated job application workflow</p>
          </Card>
        </div>
      </div>

      <AutoJobApplicationModal open={modalOpen} onOpenChange={setModalOpen} />
    </DashboardWrapper>
  );
}