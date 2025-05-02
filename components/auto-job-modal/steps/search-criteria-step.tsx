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
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="jobKeywords" className="text-sm sm:text-base">Job Keywords</Label>
          <Input
            id="jobKeywords"
            value={jobKeywords}
            onChange={(e) => setJobKeywords(e.target.value)}
            placeholder="e.g. javascript, react, node.js"
            className="text-xs sm:text-sm h-8 sm:h-10"
          />
          <p className="text-xs text-muted-foreground">Separate multiple keywords with commas</p>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="jobLocation" className="text-sm sm:text-base">Job Location</Label>
          <Input
            id="jobLocation"
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            placeholder="e.g. Bangalore, Remote"
            className="text-xs sm:text-sm h-8 sm:h-10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="jobExperience" className="text-sm sm:text-base">Experience (years)</Label>
            <Input
              id="jobExperience"
              type="number"
              min="0"
              max="30"
              value={jobExperience}
              onChange={(e) => setJobExperience(Number(e.target.value))}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="jobType" className="text-sm sm:text-base">Job Type</Label>
            <select
              id="jobType"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full h-8 sm:h-10 px-2 sm:px-3 border border-input rounded-md bg-background text-xs sm:text-sm"
            >
              <option value="fulltime">Full Time</option>
              <option value="parttime">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label className="text-sm sm:text-base">Minimum Company Rating: {minRating}</Label>
          <div className="pt-1 sm:pt-2">
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full h-6"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label className="text-sm sm:text-base">Maximum Applications Per Run: {maxApplications}</Label>
          <div className="pt-1 sm:pt-2">
            <input
              type="range"
              min="1"
              max="50"
              value={maxApplications}
              onChange={(e) => setMaxApplications(Number(e.target.value))}
              className="w-full h-6"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}