// components/auto-job-modal/steps/ReviewStep.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Settings, Calendar, PlayCircle, Save, RotateCw } from "lucide-react";

interface ReviewStepProps {
  state: any; // Replace 'any' with a more specific type if possible
  goToStep: (step: number) => void;
}

export function ReviewStep({ state, goToStep }: ReviewStepProps) {
  const {
    configName,
    setConfigName,
    isActive,
    setIsActive,
    loading,
    currentConfigId,
    saveConfig,
    runNow,
    selectedPortal,
    username,
    credentialsSaved,
    jobKeywords,
    jobLocation,
    jobExperience,
    jobType,
    applyFrequency,
    applyHourlyInterval,
    applyTime,
    applyDays,
    getNextRunTime,
  } = state;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="configName">Configuration Name</Label>
          <Input
            id="configName"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="Enter a name for this configuration"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <h3 className="font-medium">Activate Configuration</h3>
            <p className="text-sm text-muted-foreground">
              When active, the system will automatically apply to jobs based on your schedule
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div className="space-y-4 mt-4">
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} />
                <h3 className="font-medium">Portal & Credentials</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(1)}>
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job Portal:</span>
                <span className="capitalize">{selectedPortal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username:</span>
                <span>{username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={credentialsSaved ? "default" : "outline"}
                  className={credentialsSaved ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                >
                  {credentialsSaved ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} />
                <h3 className="font-medium">Search Criteria</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(2)}>
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keywords:</span>
                <span>{jobKeywords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span>{jobLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience:</span>
                <span>{jobExperience} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job Type:</span>
                <span className="capitalize">{jobType}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <h3 className="font-medium">Schedule</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(4)}>
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency:</span>
                <span className="capitalize">{applyFrequency}</span>
              </div>
              {applyFrequency === "hourly" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Every:</span>
                  <span>{applyHourlyInterval} hour(s)</span>
                </div>
              )}
              {applyFrequency !== "hourly" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span>{applyTime}</span>
                </div>
              )}
              {(applyFrequency === "weekly" || applyFrequency === "custom") && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days:</span>
                  <span>
                    {applyDays.map((day: number) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(", ")}
                    </span>
                  </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Run:</span>
                <span className="font-medium text-primary">{getNextRunTime()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={runNow} disabled={loading || !currentConfigId}>
            <PlayCircle size={16} className="mr-2" />
            Run Now
          </Button>
          <Button onClick={saveConfig} disabled={loading}>
            {loading ? <RotateCw size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            {currentConfigId ? "Update Configuration" : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
