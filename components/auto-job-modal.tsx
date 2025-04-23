// Render the appropriate step content
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Settings, Calendar, Bell, Clock, Info,
  CheckCircle, AlertCircle, PlayCircle, Save, 
  Eye, EyeOff, User, Lock, RotateCw, Brain, 
  Download, ChevronRight, ChevronLeft, Check,
  X
} from 'lucide-react';

import { toast } from 'sonner';
import { 
Dialog, 
DialogContent, 
DialogHeader, 
DialogTitle,
DialogFooter,
DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

// Main modal component for auto job application configuration
export const AutoJobApplicationModal = ({ open, onOpenChange }) => {
const [currentStep, setCurrentStep] = useState(1);
const [configName, setConfigName] = useState('my auto job config');
const [isActive, setIsActive] = useState(false);
const [loading, setLoading] = useState(false);
const [configs, setConfigs] = useState([]);
const [currentConfigId, setCurrentConfigId] = useState(null);

// Credentials state
const [selectedPortal, setSelectedPortal] = useState('naukri');
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [credentialsSaved, setCredentialsSaved] = useState(false);
const [showPassword, setShowPassword] = useState(false);

// Search criteria state
const [jobKeywords, setJobKeywords] = useState('');
const [jobLocation, setJobLocation] = useState('');
const [jobExperience, setJobExperience] = useState(2);
const [jobType, setJobType] = useState('fulltime');
const [minRating, setMinRating] = useState(3.5);
const [maxApplications, setMaxApplications] = useState(10);

// AI Training state
const [selfDescription, setSelfDescription] = useState('');
const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

// Schedule state
const [applyFrequency, setApplyFrequency] = useState('daily');
const [applyDays, setApplyDays] = useState([1, 2, 3, 4, 5]); // Monday to Friday
const [applyTime, setApplyTime] = useState('09:00');
const [applyHourlyInterval, setApplyHourlyInterval] = useState(1);

// Notification state
const [emailNotifications, setEmailNotifications] = useState(true);
const [whatsappNotifications, setWhatsappNotifications] = useState(false);

// Portal data
const portalData = [
  { id: 'N', name: 'Naukri', available: true, status: 'Available' },
  { id: 'L', name: 'Linkedin', available: false, status: 'Coming Soon' },
  { id: 'I', name: 'Indeed', available: false, status: 'Coming Soon' },
  { id: 'M', name: 'Monster', available: false, status: 'Coming Soon' }
];

// Steps configuration
const steps = [
  { id: 1, title: 'Portal Credentials', icon: <Briefcase size={20} /> },
  { id: 2, title: 'Search Criteria', icon: <Settings size={20} /> },
  { id: 3, title: 'AI Training', icon: <Brain size={20} /> },
  { id: 4, title: 'Schedule', icon: <Calendar size={20} /> },
  { id: 5, title: 'Notifications', icon: <Bell size={20} /> },
  { id: 6, title: 'Review & Save', icon: <CheckCircle size={20} /> }
];

// Move to next step
const nextStep = () => {
  if (currentStep === 1 && !credentialsSaved) {
    toast.error('Please save your credentials before proceeding');
    return;
  }
  
  if (currentStep === 2 && (!jobKeywords || !jobLocation)) {
    toast.error('Job keywords and location are required');
    return;
  }
  
  if (currentStep < steps.length) {
    setCurrentStep(currentStep + 1);
  }
};

// Move to previous step
const prevStep = () => {
  if (currentStep > 1) {
    setCurrentStep(currentStep - 1);
  }
};

// Go to specific step
const goToStep = (step) => {
  if (step <= currentStep) {
    setCurrentStep(step);
  }
};

// Mock function to save credentials - would be replaced with actual API call
const saveCredentials = async () => {
  try {
    setLoading(true);
    
    if (!username) {
      toast.error('Username is required');
      return;
    }

    // Only require password for new credentials
    if (!credentialsSaved && !password) {
      toast.error('Password is required');
      return;
    }

    // Mock successful save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCredentialsSaved(true);
    setPassword('');
    toast.success('Credentials saved successfully');
    
  } catch (error) {
    toast.error('Failed to save credentials');
  } finally {
    setLoading(false);
  }
};

// Mock function to verify credentials - would be replaced with actual API call
const verifyConnection = async () => {
  try {
    setLoading(true);
    
    // Check if we have credentials to verify
    if (!username) {
      toast.error('Username is required');
      return;
    }

    // For verification, we need the password
    if (!password && !credentialsSaved) {
      toast.error('Password is required for verification');
      return;
    }

    // Mock successful verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Credentials verified successfully');
    
  } catch (error) {
    toast.error('Failed to verify connection');
  } finally {
    setLoading(false);
  }
};

// Mock function to analyze profile - would be replaced with actual API call
const analyzeProfile = async () => {
  try {
    setIsGeneratingProfile(true);

    // Mock successful analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update with a generated description
    setSelfDescription('I am a skilled professional with 5 years of experience in software development. Proficient in React, Node.js, and AWS. I have worked on multiple projects delivering scalable solutions for enterprise clients. I am a quick learner with excellent problem-solving skills and enjoy working in collaborative environments.');
    
    toast.success('Profile analyzed and description generated successfully');
  } catch (error) {
    toast.error('Failed to analyze profile');
  } finally {
    setIsGeneratingProfile(false);
  }
};

// Mock function to save configuration - would be replaced with actual API call
const saveConfig = async () => {
  try {
    setLoading(true);
    
    // Validate required fields
    if (!configName || !jobKeywords || !jobLocation) {
      toast.error('Name, job keywords, and location are required');
      return;
    }

    // Mock successful save
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (currentConfigId) {
      toast.success('Configuration updated successfully');
    } else {
      setCurrentConfigId('config-1');
      toast.success('Configuration created successfully');
    }

  } catch (error) {
    toast.error('Failed to save configuration');
  } finally {
    setLoading(false);
  }
};

// Mock function to run job now - would be replaced with actual API call
const runNow = async () => {
  try {
    setLoading(true);
    if (!currentConfigId) {
      toast.error('You must have a saved configuration to run it');
      return;
    }
    
    // Mock successful run
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Job execution triggered successfully');
    
  } catch (error) {
    toast.error('Failed to run job');
  } finally {
    setLoading(false);
  }
};

// Helper function to get next run time
const getNextRunTime = () => {
  // Calculate next run based on current settings
  const now = new Date();
  
  if (applyFrequency === 'hourly') {
    const nextRun = new Date(now);
    nextRun.setHours(now.getHours() + parseInt(applyHourlyInterval));
    return nextRun.toLocaleString();
  }
  
  const [hours, minutes] = applyTime.split(':').map(Number);
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  if (applyFrequency === 'weekly' || applyFrequency === 'custom') {
    if (applyDays.length > 0) {
      const currentDay = now.getDay();
      let daysUntilNext = 7;

      for (const day of applyDays) {
        const daysUntil = (day - currentDay + 7) % 7;
        if (daysUntil < daysUntilNext && (daysUntil > 0 || (daysUntil === 0 && nextRun > now))) {
          daysUntilNext = daysUntil;
        }
      }

      nextRun = new Date(now);
      nextRun.setDate(now.getDate() + daysUntilNext);
      nextRun.setHours(hours, minutes, 0, 0);
    } else {
      return "No days selected";
    }
  }

  return nextRun.toLocaleString();
};

// Render the portal credentials step
const renderPortalStep = () => {
  return (
    <div className="space-y-6">
      <div className="portal-selector flex flex-wrap gap-3">
        {portalData.map(portal => (
          <div
            key={portal.id}
            className={`flex items-center p-3 border rounded-lg ${portal.id === 'N' ? 'border-primary bg-primary/5' : ''} ${!portal.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
            onClick={() => portal.available && setSelectedPortal(portal.name.toLowerCase())}
          >
            <div className="portal-letter bg-primary/10 text-primary font-semibold w-10 h-10 rounded-full flex items-center justify-center mr-3">
              {portal.id}
            </div>
            <div className="portal-info">
              <div className="font-medium">{portal.name}</div>
              <div className={`text-xs ${portal.available ? 'text-green-600' : 'text-muted-foreground'}`}>
                {portal.status}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            <User size={16} className="inline mr-2" />
            Username / Email
          </Label>
          <Input
            id="email"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Naukri email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            <Lock size={16} className="inline mr-2" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={credentialsSaved ? "Enter new password only if you want to change it" : "Enter your Naukri password"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {credentialsSaved && (
            <div className="text-sm flex items-center text-green-600 mt-1">
              <CheckCircle size={14} className="mr-1" />
              <span>Credentials saved</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={saveCredentials} disabled={loading}>
            <Save size={16} className="mr-2" />
            Save Credentials
          </Button>
          <Button variant="outline" onClick={verifyConnection} disabled={loading}>
            <RotateCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verify Connection
          </Button>
        </div>
        
        <div className="flex items-start mt-4 p-3 text-sm bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle size={16} className="text-amber-500 mr-2 shrink-0 mt-0.5" />
          <p className="text-amber-700">
            For security reasons, use a dedicated email that isn't linked to sensitive accounts. Passwords are encrypted during transmission and storage.
          </p>
        </div>
      </div>
    </div>
  );
};

// Render the search criteria step
const renderSearchCriteriaStep = () => {
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
              onChange={(e) => setJobExperience(e.target.value)}
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
              onChange={(e) => setMinRating(e.target.value)}
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
              onChange={(e) => setMaxApplications(e.target.value)}
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
};

// Render the AI training step
const renderAITrainingStep = () => {
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
          <p className="text-sm text-muted-foreground">Write in first person as if you're introducing yourself in an interview</p>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={() => {
              if (selfDescription.trim().length === 0) {
                toast.error('Please provide a description about yourself');
                return;
              }
              toast.success('AI training data saved');
            }}
            disabled={loading}
          >
            <Save size={16} className="mr-2" />
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
};

// Render the schedule step with a clean, cohesive design
const renderScheduleStep = () => {
  return (
    <div className="space-y-5 px-1">
      {/* Frequency Selection - styled as pills */}
      <div className="mb-6">
        <h3 className="text-base font-medium mb-3">How often would you like to apply?</h3>
        <div className="inline-flex bg-muted/30 p-1 rounded-lg">
          {[
            { value: 'hourly', label: 'Hourly' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'custom', label: 'Custom' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setApplyFrequency(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                applyFrequency === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
        {applyFrequency === 'hourly' && (
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
              {[1, 2, 3, 4, 6, 8, 12].map(hours => (
                <option key={hours} value={hours}>{hours}</option>
              ))}
            </select>
            <span className="text-muted-foreground">hours</span>
          </div>
        )}

        {/* Day selector for weekly/custom - visual calendar style */}
        {(applyFrequency === 'weekly' || applyFrequency === 'custom') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Apply on</span>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <button
                  key={index}
                  type="button"
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full transition-colors
                    ${applyDays.includes(index) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'border-2 border-muted hover:border-primary/50'}
                  `}
                  onClick={() => {
                    if (applyDays.includes(index)) {
                      setApplyDays(applyDays.filter(d => d !== index));
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

        {/* Time picker for non-hourly options - styled time picker */}
        {applyFrequency !== 'hourly' && (
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
};
// Render the notifications step
const renderNotificationsStep = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">Receive email notifications for application status updates</p>
          </div>
          <Switch 
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <h3 className="font-medium">WhatsApp Notifications</h3>
            <p className="text-sm text-muted-foreground">Receive WhatsApp notifications for application status updates</p>
          </div>
          <Switch
            checked={whatsappNotifications}
            onCheckedChange={setWhatsappNotifications}
          />
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-3">Notify me about:</h3>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Checkbox id="notify-applied" defaultChecked />
              <div className="grid gap-1.5">
                <Label htmlFor="notify-applied" className="font-medium">Successful Applications</Label>
                <p className="text-sm text-muted-foreground">When your profile is successfully submitted to a job</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Checkbox id="notify-interview" defaultChecked />
              <div className="grid gap-1.5">
                <Label htmlFor="notify-interview" className="font-medium">Interview Invitations</Label>
                <p className="text-sm text-muted-foreground">When you receive an interview request</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Checkbox id="notify-errors" defaultChecked />
              <div className="grid gap-1.5">
                <Label htmlFor="notify-errors" className="font-medium">Errors & Issues</Label>
                <p className="text-sm text-muted-foreground">When there are problems with the automation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Render the final review step
const renderReviewStep = () => {
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
            <p className="text-sm text-muted-foreground">When active, the system will automatically apply to jobs based on your schedule</p>
          </div>
          <Switch 
            checked={isActive}
            onCheckedChange={setIsActive}
          />
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
                <span>Naukri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username:</span>
                <span>{username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={credentialsSaved ? "default" : "outline"} className={credentialsSaved ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                  {credentialsSaved ? 'Verified' : 'Not Verified'}
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
              {applyFrequency === 'hourly' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Every:</span>
                  <span>{applyHourlyInterval} hour(s)</span>
                </div>
              )}
              {applyFrequency !== 'hourly' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span>{applyTime}</span>
                </div>
              )}
              {(applyFrequency === 'weekly' || applyFrequency === 'custom') && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days:</span>
                  <span>
                    {applyDays.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
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
            <Save size={16} className="mr-2" />
            {currentConfigId ? 'Update Configuration' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const renderStepContent = () => {
  switch (currentStep) {
    case 1:
      return renderPortalStep();
    case 2:
      return renderSearchCriteriaStep();
    case 3:
      return renderAITrainingStep();
    case 4:
      return renderScheduleStep();
    case 5:
      return renderNotificationsStep();
    case 6:
      return renderReviewStep();
    default:
      return null;
  }
};

return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{steps[currentStep - 1].title}</DialogTitle>
      </DialogHeader>
      
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-6 px-2">
        <div className="w-full flex items-center">
          {steps.map((step) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex flex-col items-center ${step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => goToStep(step.id)}
              >
                <div 
                  className={`rounded-full flex items-center justify-center w-8 h-8 text-sm font-medium
                    ${step.id < currentStep ? 'bg-primary text-primary-foreground' : 
                      step.id === currentStep ? 'bg-primary text-primary-foreground' : 
                      'bg-muted text-muted-foreground'}`}
                >
                  {step.id < currentStep ? <Check size={16} /> : step.id}
                </div>
                <span className={`text-xs mt-1 text-center ${step.id === currentStep ? 'font-medium' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {step.id !== steps.length && (
                <div 
                  className={`flex-1 h-px mx-1 
                    ${step.id < currentStep ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="py-2">
        {renderStepContent()}
      </div>

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
            {currentStep === steps.length - 1 ? 'Review' : 'Continue'}
            <ChevronRight size={16} className="ml-2" />
          </Button>
        ) : (
          <DialogClose asChild>
            <Button variant="outline">
              Close
            </Button>
          </DialogClose>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
};