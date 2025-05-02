import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RotateCw, Save, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

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
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="selfDescription" className="text-sm sm:text-base">About Yourself</Label>
          <textarea
            id="selfDescription"
            rows={5}
            value={selfDescription}
            onChange={(e) => setSelfDescription(e.target.value)}
            placeholder="Describe your skills, experience, education, and career goals. The more details you provide, the better the AI can represent you."
            className="w-full min-h-20 sm:min-h-24 rounded-md border border-input px-2 py-2 sm:px-3 text-xs sm:text-sm bg-background resize-none"
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Write in first person as if you are introducing yourself in an interview
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
          <Button 
            onClick={saveAITraining} 
            disabled={loading || selfDescription.trim().length === 0}
            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
          >
            {loading ? <RotateCw size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
            Save Description
          </Button>

          <Button
            variant="outline"
            onClick={analyzeProfile}
            disabled={isGeneratingProfile || !credentialsSaved || loading}
            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
          >
            {isGeneratingProfile ? (
              <>
                <RotateCw size={14} className="mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-2" />
                Generate from Your Profile
              </>
            )}
          </Button>
        </div>

        {!credentialsSaved && (
          <div className="flex items-start mt-3 p-2 sm:p-3 text-xs sm:text-sm bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle size={14} className="text-amber-500 mr-1 sm:mr-2 shrink-0 mt-0.5" />
            <p className="text-amber-700">
              Please save your credentials in the Job Portals step before analyzing your profile.
            </p>
          </div>
        )}

        <div className="mt-4 sm:mt-6 border rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Sparkles size={16} />
            <h3 className="font-medium text-sm sm:text-base">What the AI Can Do</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="flex items-start gap-1 sm:gap-2">
              <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm">Answer screening questions</span>
            </div>
            <div className="flex items-start gap-1 sm:gap-2">
              <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm">Highlight relevant skills</span>
            </div>
            <div className="flex items-start gap-1 sm:gap-2">
              <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm">Maintain professional tone</span>
            </div>
            <div className="flex items-start gap-1 sm:gap-2">
              <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm">Represent you accurately</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}