import React from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Settings, Calendar, Bell, PlayCircle, RotateCw } from "lucide-react";

interface ReviewStepProps {
  state: any; // Replace 'any' with a more specific type if possible
  goToStep: (step: number) => void;
}

export function ReviewStep({ state, goToStep }: ReviewStepProps) {
  const {
    isActive,
    setIsActive,
    loading,
    toggleActiveStatus,
    runNow,
    selectedPortal,
    username,
    credentialsSaved,
    jobKeywords,
    jobLocation,
    jobExperience,
    jobType,
    minRating,
    maxApplications,
    applyFrequency,
    applyHourlyInterval,
    applyTime,
    applyDays,
    emailNotifications,
    whatsappNotifications,
    getNextRunTime,
  } = state;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between py-2 sm:py-3 border-b">
          <div>
            <h3 className="font-medium text-sm sm:text-base">Activate Job Automation</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              When active, the system will automatically apply to jobs
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={(checked) => {
            setIsActive(checked);
            toggleActiveStatus();
          }} />
        </div>

        <div className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
          <div className="border rounded-md p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <Briefcase size={16} />
                <h3 className="font-medium text-sm sm:text-base">Portal & Credentials</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(1)} className="h-7 sm:h-8 text-xs sm:text-sm">
                Edit
              </Button>
            </div>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
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
                  className={`text-xs ${credentialsSaved ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                >
                  {credentialsSaved ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <Settings size={16} />
                <h3 className="font-medium text-sm sm:text-base">Search Criteria</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(3)} className="h-7 sm:h-8 text-xs sm:text-sm">
                Edit
              </Button>
            </div>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keywords:</span>
                <span className="text-right max-w-[60%] truncate">{jobKeywords}</span>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min. Rating:</span>
                <span>{minRating}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Applications:</span>
                <span>{maxApplications} per run</span>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar size={16} />
                <h3 className="font-medium text-sm sm:text-base">Schedule</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(4)} className="h-7 sm:h-8 text-xs sm:text-sm">
                Edit
              </Button>
            </div>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
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
                  <span className="text-right max-w-[60%] truncate">
                    {applyDays.map((day: number) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(", ")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Run:</span>
                <span className="font-medium text-primary text-right max-w-[60%] truncate">{getNextRunTime()}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <Bell size={16} />
                <h3 className="font-medium text-sm sm:text-base">Notifications</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(5)} className="h-7 sm:h-8 text-xs sm:text-sm">
                Edit
              </Button>
            </div>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Notifications:</span>
                <Badge
                  variant={emailNotifications ? "default" : "outline"}
                  className={`text-xs ${emailNotifications ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                >
                  {emailNotifications ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WhatsApp Notifications:</span>
                <Badge
                  variant={whatsappNotifications ? "default" : "outline"}
                  className={`text-xs ${whatsappNotifications ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                >
                  {whatsappNotifications ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 sm:pt-4">
          <Button 
            onClick={runNow} 
            disabled={loading || !credentialsSaved} 
            className="w-full h-9 sm:h-10 text-xs sm:text-sm"
          >
            {loading ? (
              <RotateCw size={14} className="mr-2 animate-spin" />
            ) : (
              <PlayCircle size={14} className="mr-2" />
            )}
            Run Now for {selectedPortal.charAt(0).toUpperCase() + selectedPortal.slice(1)}
          </Button>
        </div>
      </div>
    </div>
  );
}