"use client";

import { useState, useEffect } from "react";
import { DashboardWrapper } from "@/components/dashboard-wrapper";
import { BellDot, Settings, PowerOff, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AutoJobApplicationModal } from "@/components/auto-job-modal";
import { jobConfigService } from "@/services/jobConfigService";

export default function AutoJobPage() {
  const [isActive, setIsActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);

  // Fetch initial status when component mounts
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        setStatusError(false);
        
        // Use the new getStatus method instead of getConfig
        const statusData = await jobConfigService.getStatus();
        
        if (statusData.success) {
          setIsActive(statusData.isActive);
        } else {
          setStatusError(true);
          toast.error("Could not determine service status");
        }
      } catch (error) {
        console.error("Failed to fetch job status:", error);
        setStatusError(true);
        toast.error("Failed to load service status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Handle toggle change
  interface ToggleResponse {
    success: boolean;
    isActive: boolean;
  }

  const handleToggleChange = async (checked: boolean): Promise<void> => {
    setIsLoading(true);
    try {
      const response: ToggleResponse = await jobConfigService.toggleActive();
      
      if (response.success) {
        setIsActive(response.isActive);
        toast.success(response.isActive ? "Service activated" : "Service deactivated");
      } else {
        toast.error("Failed to update service status");
        // Don't change UI state if API reported failure
      }
    } catch (error: unknown) {
      console.error("Failed to toggle service:", error);
      toast.error("Failed to update service status");
      // Revert the UI state back as the API call failed
      setIsActive(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle service activation/deactivation button click
  const handleServiceToggleButton = async () => {
    await handleToggleChange(!isActive);
  };

  // Display a loading state while checking status
  if (isLoading && statusError === false) {
    return (
      <DashboardWrapper>
        <div className="w-full p-6 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Loading service status...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <Toaster position="top-right" />

      <div className="w-full p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auto Job Application</h1>
          <p className="text-muted-foreground">Our automated job application service</p>
        </div>

        {/* Service description section with buttons */}
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium mb-2">AI-Powered Job Applications</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
                    <Switch 
                      checked={isActive} 
                      onCheckedChange={handleToggleChange} 
                      disabled={isLoading}
                      aria-label="Toggle service activation"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Our service helps you apply to jobs automatically with AI assistance. Set up your preferences once, 
                  and let our system handle the rest. The AI will help answer screening questions based on your profile, 
                  saving you time and increasing your chances of getting interviews.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-slate-50">Automatic Application</Badge>
                  <Badge variant="outline" className="bg-slate-50">AI Screening Assistance</Badge>
                  <Badge variant="outline" className="bg-slate-50">Job Matching</Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pb-6 flex justify-end gap-3">
            <Button 
              variant="outline" 
              className="flex gap-2 items-center"
              onClick={handleServiceToggleButton}
              disabled={isLoading}
            >
              <PowerOff className="h-4 w-4" />
              {isActive ? "Deactivate Service" : "Activate Service"}
            </Button>
            <Button 
              className="flex gap-2 items-center"
              onClick={() => setModalOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Manage Service
            </Button>
          </CardFooter>
        </Card>

        {/* Coming Soon Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">More Services Coming Soon</h2>
            <BellDot className="h-5 w-5 text-primary" />
          </div>
          <Card className="bg-slate-50/50 border-dashed">
            <CardContent className="p-6 flex flex-col items-center">
              <p className="text-muted-foreground text-center mb-2">We're working on more AI-powered services to help with your job search</p>
              <Badge variant="outline" className="bg-slate-100">Stay tuned for updates</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <AutoJobApplicationModal open={modalOpen} onOpenChange={setModalOpen} />
    </DashboardWrapper>
  );
}