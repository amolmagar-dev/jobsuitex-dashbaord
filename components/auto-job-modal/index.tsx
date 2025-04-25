// components/auto-job-modal/index.tsx
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft } from "lucide-react";

// Use @ imports for better path management
import { useJobConfig } from "@/components/auto-job-modal/use-job-config";
import { StepIndicator } from "@/components/auto-job-modal/calls/step-indicator";

// Step components with consistent naming and @ imports
import PortalCredentialsStep from "@/components/auto-job-modal/steps/portal-credentials-step";
import SearchCriteriaStep from "@/components/auto-job-modal/steps/search-criteria-step";
import ScheduleStep from "@/components/auto-job-modal/steps/schedule-step";
import { NotificationsStep } from "@/components/auto-job-modal/steps/notifications-step";
import { ReviewStep } from "@/components/auto-job-modal/steps/review-step";
import { AITrainingStep } from "./steps/AI-training-step";

interface AutoJobApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutoJobApplicationModal({ open, onOpenChange }: AutoJobApplicationModalProps) {
  // Core state
  const {
    currentStep,
    currentPortal,
    loading,
    credentialsSaved,
    jobKeywords,
    jobLocation,
    setCurrentStep,
    goToStep,
    setCurrentPortal,
    nextStep,
    prevStep,
    state,
  } = useJobConfig(open);

  // Steps configuration
  const steps = [
    { id: 1, title: "Portal Credentials", icon: null },
    { id: 2, title: "Search Criteria", icon: null },
    { id: 3, title: "AI Training", icon: null },
    { id: 4, title: "Schedule", icon: null },
    { id: 5, title: "Notifications", icon: null },
    { id: 6, title: "Review & Execute", icon: null },
  ];
  
  // Main step content selector
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PortalCredentialsStep state={state} />;
      case 2:
        return <SearchCriteriaStep state={state} />;
      case 3:
        return <AITrainingStep state={state} />;
      case 4:
        return <ScheduleStep state={state} />;
      case 5:
        return <NotificationsStep state={state} />;
      case 6:
        return <ReviewStep state={state} goToStep={goToStep} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentPortal.charAt(0).toUpperCase() + currentPortal.slice(1)} Job Automation
          </DialogTitle>
        </DialogHeader>

        {/* Portal selector - visible in step 1 */}

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} goToStep={goToStep} />

        {/* Step Content */}
        <div className="py-2">{renderStepContent()}</div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Navigation Buttons */}
        <DialogFooter className="flex justify-between sm:justify-between">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={prevStep} className="mr-auto">
              <ChevronLeft size={16} className="mr-2" />
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? "Review" : "Continue"}
              <ChevronRight size={16} className="ml-2" />
            </Button>
          ) : (
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}