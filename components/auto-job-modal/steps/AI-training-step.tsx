// components/auto-job-modal/steps/AITrainingStep.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RotateCw, Save, Download, CheckCircle, AlertCircle, Brain } from "lucide-react";

interface AITrainingStepProps {
  state: {
    selfDescription: string;
    setSelfDescription: (value: string) => void;
    isGeneratingProfile: boolean;
    analyzeProfile: () => void;
    saveAITraining: () => void;
    credentialsSaved: boolean;
    loading: boolean;
  };
}

export function AITrainingStep({ state }: AITrainingStepProps) {
  const {
    selfDescription,
    setSelfDescription,
    isGeneratingProfile,
    analyzeProfile,
    saveAITraining,
    credentialsSaved,
    loading,
  } = state;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="selfDescription">About Yourself</Label>
          <textarea
            id="selfDescription"
            rows={6}
            value={selfDescription}
            onChange={(e) => setSelfDescription(e.target.value)}
            placeholder="Describe your skills, experience, education, and career goals. The more details you provide, the better the AI can represent you."
            className="w-full min-h-24 rounded-md border border-input px-3 py-2 text-sm bg-background resize-none"
          />
          <p className="text-sm text-muted-foreground">
            Write in first person as if you are introducing yourself in an interview
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={saveAITraining} disabled={loading || selfDescription.trim().length === 0}>
            {loading ? <RotateCw size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Save Description
          </Button>

          <Button
            variant="outline"
            onClick={analyzeProfile}
            disabled={isGeneratingProfile || !credentialsSaved || loading}
          >
            {isGeneratingProfile ? (
              <>
                <RotateCw size={16} className="mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Generate from Your Profile
              </>
            )}
          </Button>
        </div>

        {!credentialsSaved && (
          <div className="flex items-start mt-4 p-3 text-sm bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5" />
            <p className="text-amber-700">
              Please save your credentials in the Job Portals step before analyzing your profile.
            </p>
          </div>
        )}

        <div className="mt-6 border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} />
            <h3 className="font-medium">What the AI Can Do</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">Answer common screening questions</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">Highlight relevant skills for each job</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">Maintain professional tone</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">Represent your qualifications accurately</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
