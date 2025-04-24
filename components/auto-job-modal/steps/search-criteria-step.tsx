// components/auto-job-modal/steps/SearchCriteriaStep.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchCriteriaStepProps {
  state: {
    jobKeywords: string;
    setJobKeywords: (keywords: string) => void;
    jobLocation: string;
    setJobLocation: (location: string) => void;
    jobExperience: number;
    setJobExperience: (experience: number) => void;
    jobType: string;
    setJobType: (type: string) => void;
    minRating: number;
    setMinRating: (rating: number) => void;
    maxApplications: number;
    setMaxApplications: (max: number) => void;
  };
}

export default function SearchCriteriaStep({ state }: SearchCriteriaStepProps) {
  const {
    jobKeywords,
    setJobKeywords,
    jobLocation,
    setJobLocation,
    jobExperience,
    setJobExperience,
    jobType,
    setJobType,
    minRating,
    setMinRating,
    maxApplications,
    setMaxApplications,
  } = state;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jobKeywords">Job Keywords</Label>
          <Input
            id="jobKeywords"
            value={jobKeywords}
            onChange={(e) => setJobKeywords(e.target.value)}
            placeholder="e.g. javascript, react, node.js"
          />
          <p className="text-sm text-muted-foreground">Separate multiple keywords with commas</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobLocation">Job Location</Label>
          <Input
            id="jobLocation"
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            placeholder="e.g. Bangalore, Remote"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobExperience">Experience (years)</Label>
            <Input
              id="jobExperience"
              type="number"
              min="0"
              max="30"
              value={jobExperience}
              onChange={(e) => setJobExperience(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
            <select
              id="jobType"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full h-10 px-3 border border-input rounded-md bg-background"
            >
              <option value="fulltime">Full Time</option>
              <option value="parttime">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Minimum Company Rating: {minRating}</Label>
          <div className="pt-2">
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Maximum Applications Per Run: {maxApplications}</Label>
          <div className="pt-2">
            <input
              type="range"
              min="1"
              max="50"
              value={maxApplications}
              onChange={(e) => setMaxApplications(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
