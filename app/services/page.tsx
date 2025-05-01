"use client";

import { useState, useEffect } from "react";
import { DashboardWrapper } from "@/components/dashboard-wrapper";
import { BellDot, Settings, Power, Sparkles } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AutoJobApplicationModal } from "@/components/auto-job-modal";
import { jobConfigService } from "@/services/jobConfigService";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AutoJobPage() {
  const isMobile = useIsMobile();
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

  // Handle service toggle
  const handleServiceToggle = async () => {
    setIsLoading(true);
    try {
      const response = await jobConfigService.toggleActive();
      
      if (response.success) {
        setIsActive(response.isActive);
        toast.success(response.isActive ? "Service activated" : "Service deactivated");
      } else {
        toast.error("Failed to update service status");
      }
    } catch (error) {
      console.error("Failed to toggle service:", error);
      toast.error("Failed to update service status");
    } finally {
      setIsLoading(false);
    }
  };

  // Display a loading state while checking status
  if (isLoading && statusError === false) {
    return (
      <DashboardWrapper>
        <div className="w-full p-4 sm:p-6 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Loading service status...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <Toaster position="top-right" />

      <div className="w-full p-4 sm:p-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auto Job Services</h1>
          <p className="text-muted-foreground mt-1">Configure your automated job application services</p>
        </div>

        {/* Main Service Card */}
        <Card className="overflow-hidden">
          <div className={`p-4 sm:p-6 ${isActive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                isActive 
                  ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300' 
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-300'
              }`}>
                <Power className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Auto Job Application</h2>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium">{isActive ? 'Active' : 'Inactive'}</span>
                </p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium mb-2">AI-Powered Job Applications</h3>
                <p className="text-muted-foreground mb-4">
                  Our automated system helps you apply to relevant job opportunities with minimal effort. 
                  Set your preferences once, and our AI will find matching jobs and apply on your behalf. 
                  The service can handle application forms, screening questions, and follow-ups automatically.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-1">
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">Automated Applications</Badge>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">AI Form Filling</Badge>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">Smart Job Matching</Badge>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">Screening Questions</Badge>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="px-6 py-4 bg-muted/20 border-t flex flex-col sm:flex-row gap-3 sm:justify-end">
            {/* <Button 
              variant={isActive ? "outline" : "default"}
              className="flex gap-2 items-center w-full sm:w-auto"
              onClick={handleServiceToggle}
              disabled={isLoading}
            >
              <Power className="h-4 w-4" />
              {isActive ? "Deactivate Service" : "Activate Service"}
            </Button> */}
            <Button 
              className="flex gap-2 items-center w-full sm:w-auto"
              onClick={() => setModalOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Configure Settings
            </Button>
          </CardFooter>
        </Card>

        {/* Coming Soon Card */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">More Services Coming Soon</h2>
            <BellDot className="h-5 w-5 text-primary" />
          </div>
          
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-dashed">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-background/60 p-3 rounded-full h-fit">
                  <BellDot className="h-6 w-6 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Interview Preparation Assistant</h3>
                  <p className="text-muted-foreground mb-4">
                    We're developing an AI-powered interview preparation service to help you practice 
                    and improve your interviewing skills. Join our waitlist to be notified when it launches.
                  </p>
                  
                  <Button variant="outline" className="bg-background/60">
                    Join Waitlist
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AutoJobApplicationModal open={modalOpen} onOpenChange={setModalOpen} />
    </DashboardWrapper>
  );
}