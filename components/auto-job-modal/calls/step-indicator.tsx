// components/auto-job-modal/StepIndicator.tsx
import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: Array<{
    id: number;
    title: string;
    icon: React.ReactNode;
  }>;
  currentStep: number;
  goToStep: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, goToStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-6 px-2">
      <div className="w-full flex items-center">
        {steps.map((step) => (
          <React.Fragment key={step.id}>
            <div
              className={`flex flex-col items-center ${
                step.id <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              onClick={() => goToStep(step.id)}
            >
              <div
                className={`rounded-full flex items-center justify-center w-8 h-8 text-sm font-medium
                  ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {step.id < currentStep ? <Check size={16} /> : step.id}
              </div>
              <span
                className={`text-xs mt-1 text-center ${
                  step.id === currentStep ? "font-medium" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
            </div>
            {step.id !== steps.length && (
              <div
                className={`flex-1 h-px mx-1 
                  ${step.id < currentStep ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
