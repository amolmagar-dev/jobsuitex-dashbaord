// components/auto-job-modal/steps/ScheduleStep.tsx
import React from "react";
import { Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ScheduleStepState {
  applyFrequency: string;
  setApplyFrequency: (value: string) => void;
  applyDays: number[];
  setApplyDays: (value: number[]) => void;
  applyTime: string;
  setApplyTime: (value: string) => void;
  applyHourlyInterval: number;
  setApplyHourlyInterval: (value: number) => void;
}

export default function ScheduleStep({ state }: { state: ScheduleStepState }) {
  const {
    applyFrequency,
    setApplyFrequency,
    applyDays,
    setApplyDays,
    applyTime,
    setApplyTime,
    applyHourlyInterval,
    setApplyHourlyInterval,
  } = state;

  return (
    <div className="space-y-5 px-1">
      {/* Frequency Selection - styled as pills */}
      <div className="mb-6">
        <h3 className="text-base font-medium mb-3">How often would you like to apply?</h3>
        <div className="inline-flex bg-muted/30 p-1 rounded-lg">
          {[
            { value: "hourly", label: "Hourly" },
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "custom", label: "Custom" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setApplyFrequency(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                applyFrequency === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options based on selected frequency */}
      <div className="space-y-4">
        {/* Hourly interval selector */}
        {applyFrequency === "hourly" && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Apply every</span>
            <select
              value={applyHourlyInterval}
              onChange={(e) => setApplyHourlyInterval(parseInt(e.target.value))}
              className="w-16 rounded-md border-0 bg-muted/30 px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4, 6, 8, 12].map((hours) => (
                <option key={hours} value={hours}>
                  {hours}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">hours</span>
          </div>
        )}

        {/* Day selector for weekly/custom - visual calendar style */}
        {(applyFrequency === "weekly" || applyFrequency === "custom") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Apply on</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <button
                  key={index}
                  type="button"
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full transition-colors
                    ${
                      applyDays.includes(index)
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-muted hover:border-primary/50"
                    }
                  `}
                  onClick={() => {
                    if (applyDays.includes(index)) {
                      setApplyDays(applyDays.filter((d: number) => d !== index));
                    } else {
                      setApplyDays([...applyDays, index].sort());
                    }
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time picker for non-hourly options */}
        {applyFrequency !== "hourly" && (
          <div className="flex items-center gap-2 pt-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Apply at</span>
            <div className="relative flex items-center">
              <Input
                type="time"
                value={applyTime}
                onChange={(e) => setApplyTime(e.target.value)}
                className="w-32 pl-3 border-0 bg-muted/30 h-9"
              />
            </div>
            <span className="text-xs text-muted-foreground">(24h format)</span>
          </div>
        )}
      </div>
    </div>
  );
}
