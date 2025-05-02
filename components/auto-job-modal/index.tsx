import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    goToStep,
    nextStep,
    prevStep,
    state,
  } = useJobConfig(open);

  // Steps configuration
  const steps = [
    { id: 1, title: "Portal", icon: null },
    { id: 2, title: "AI", icon: null },
    { id: 3, title: "Search", icon: null },
    { id: 4, title: "Schedule", icon: null },
    { id: 5, title: "Alerts", icon: null },
    { id: 6, title: "Review", icon: null },
  ];
  
  // Main step content selector
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PortalCredentialsStep state={state} />;
      case 2:
        return <AITrainingStep state={state} />;
      case 3:
        return <SearchCriteriaStep state={state} />;
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
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Configure Job Automation
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator - Responsive with shorter titles on mobile */}
        <div className="pt-2">
          <StepIndicator steps={steps} currentStep={currentStep} goToStep={goToStep} />
        </div>

        {/* Step Content */}
        <div className="py-2">{renderStepContent()}</div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Navigation Buttons - Responsive layout */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-0 mt-4">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto">
              <ChevronLeft size={16} className="mr-2" />
              Previous
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {currentStep < steps.length ? (
            <Button onClick={nextStep} className="w-full sm:w-auto">
              {currentStep === steps.length - 1 ? "Review" : "Continue"}
              <ChevronRight size={16} className="ml-2" />
            </Button>
          ) : (
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">Close</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}