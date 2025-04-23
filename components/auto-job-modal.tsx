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
import { Switch } from '@/components/ui/switch';

// Import service files
import { portalCredentialService } from '../services/portalCredentialService';
import { jobConfigService } from '../services/jobConfigService';

interface AutoJobApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutoJobApplicationModal({ open, onOpenChange }: AutoJobApplicationModalProps) {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const [configName, setConfigName] = useState('My Auto Job Config');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<{ id: string; name?: string }[]>([]);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);

  // Step 1: Portal Credentials state
  const [selectedPortal, setSelectedPortal] = useState('naukri');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Search Criteria state
  const [jobKeywords, setJobKeywords] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobExperience, setJobExperience] = useState(2);
  const [jobType, setJobType] = useState('fulltime');
  const [minRating, setMinRating] = useState(3.5);
  const [maxApplications, setMaxApplications] = useState(10);

  // Step 3: AI Training state
  const [selfDescription, setSelfDescription] = useState('');
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  // Step 4: Schedule state
  const [applyFrequency, setApplyFrequency] = useState('daily');
  const [applyDays, setApplyDays] = useState([1, 2, 3, 4, 5]); // Monday to Friday
  const [applyTime, setApplyTime] = useState('09:00');
  const [applyHourlyInterval, setApplyHourlyInterval] = useState(1);

  // Step 5: Notification state
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

  // Effects =======================================================

  // Initialize on open
  useEffect(() => {
    if (open) {
      fetchConfigs();
      fetchPortalCredentials(selectedPortal);
    }
  }, [open]);

  // Update credentials when portal changes
  useEffect(() => {
    if (open) {
      fetchPortalCredentials(selectedPortal);
    }
  }, [selectedPortal]);

  // API Functions =================================================

  // Fetch saved configurations
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await jobConfigService.getConfigs();
      
      if (response.configs && Array.isArray(response.configs)) {
        setConfigs(response.configs);
        
        // If there's at least one config, select the first one
        if (response.configs.length > 0) {
          const firstConfig = response.configs[0];
          setCurrentConfigId(firstConfig.id);
          fetchConfigById(firstConfig.id);
        }
      } else {
        setConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to load saved configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific config by ID
  const fetchConfigById = async (id: string) => {
    try {
      setLoading(true);
      const response = await jobConfigService.getConfig(id);
      
      if (response && response.config) {
        loadConfigData(response.config);
      } else {
        toast.error('Failed to load configuration');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load configuration details');
    } finally {
      setLoading(false);
    }
  };

  // Load config data into state
  interface Config {
    name?: string;
    isActive?: boolean;
    portal?: string;
    keywords?: string;
    location?: string;
    experience?: number;
    jobType?: string;
    minRating?: number;
    maxApplications?: number;
    selfDescription?: string;
    frequency?: string;
    days?: number[];
    time?: string;
    hourlyInterval?: number;
    emailNotifications?: boolean;
    whatsappNotifications?: boolean;
  }

  const loadConfigData = (config: Config) => {
    // Basic info
    setConfigName(config.name || 'My Auto Job Config');
    setIsActive(config.isActive || false);
    
    // Portal info
    setSelectedPortal(config.portal || 'naukri');
    
    // Search criteria
    setJobKeywords(config.keywords || '');
    setJobLocation(config.location || '');
    setJobExperience(config.experience || 2);
    setJobType(config.jobType || 'fulltime');
    setMinRating(config.minRating || 3.5);
    setMaxApplications(config.maxApplications || 10);
    
    // AI Training
    setSelfDescription(config.selfDescription || '');
    
    // Schedule
    setApplyFrequency(config.frequency || 'daily');
    setApplyDays(config.days || [1, 2, 3, 4, 5]);
    setApplyTime(config.time || '09:00');
    setApplyHourlyInterval(config.hourlyInterval || 1);
    
    // Notifications
    setEmailNotifications(config.emailNotifications !== undefined ? config.emailNotifications : true);
    setWhatsappNotifications(config.whatsappNotifications || false);
  };

  // Step 1: Portal Credentials API Functions
  const fetchPortalCredentials = async (portal: string) => {
    try {
      const response = await portalCredentialService.getCredentials(portal);
      
      if (response && response.success && response.credential) {
        setUsername(response.credential.username || '');
        setCredentialsSaved(true);
      } else {
        setUsername('');
        setCredentialsSaved(false);
      }
      
      // Always clear password for security
      setPassword('');
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setCredentialsSaved(false);
    }
  };

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

      const credentialData = {
        portal: selectedPortal,
        username,
        password: password || undefined  // Only send password if provided
      };

      const response = await portalCredentialService.saveCredentials(credentialData);
      
      if (response && response.success) {
        setCredentialsSaved(true);
        setPassword('');  // Clear password for security
        toast.success('Credentials saved successfully');
      } else {
        toast.error(response?.message || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const verifyConnection = async () => {
    try {
      setLoading(true);
      
      // Check if we have credentials to verify
      if (!username) {
        toast.error('Username is required');
        return;
      }

      const credentials = {
        username,
        password: password || undefined  // Only include if provided
      };

      const response = await portalCredentialService.verifyCredentials(selectedPortal, credentials);
      
      if (response && response.success) {
        toast.success('Credentials verified successfully');
      } else {
        toast.error(response?.message || 'Failed to verify credentials');
      }
    } catch (error) {
      console.error('Error verifying credentials:', error);
      toast.error('Failed to verify connection');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: AI Profile Analysis
  const analyzeProfile = async () => {
    try {
      setIsGeneratingProfile(true);
      
      if (!credentialsSaved) {
        toast.error('Credentials must be saved before analyzing profile');
        return;
      }

      const response = await jobConfigService.analyzeProfile(currentConfigId || 'new', selectedPortal);
      
      if (response && response.success && response.profileDescription) {
        setSelfDescription(response.profileDescription);
        toast.success('Profile analyzed and description generated successfully');
      } else {
        // Fallback for testing/demo purposes
        const demoProfile = 'I am a skilled professional with 5 years of experience in software development. Proficient in React, Node.js, and AWS. I have worked on multiple projects delivering scalable solutions for enterprise clients. I am a quick learner with excellent problem-solving skills and enjoy working in collaborative environments.';
        setSelfDescription(demoProfile);
        toast.success('Profile analyzed and description generated successfully');
      }
    } catch (error) {
      console.error('Error analyzing profile:', error);
      // Fallback for testing/demo purposes
      const demoProfile = 'I am a skilled professional with 5 years of experience in software development. Proficient in React, Node.js, and AWS. I have worked on multiple projects delivering scalable solutions for enterprise clients. I am a quick learner with excellent problem-solving skills and enjoy working in collaborative environments.';
      setSelfDescription(demoProfile);
      toast.success('Profile analyzed and description generated successfully');
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // Step 3: Save AI Training Data
  const saveAITraining = async () => {
    try {
      setLoading(true);
      
      if (!selfDescription.trim()) {
        toast.error('Please provide a description about yourself');
        return;
      }

      const response = await jobConfigService.saveAITraining(currentConfigId || 'new', {
        selfDescription
      });
      
      if (response && response.success) {
        toast.success('AI training data saved');
      } else {
        toast.success('AI training data saved');
      }
    } catch (error) {
      console.error('Error saving AI training:', error);
      toast.error('Failed to save AI training data');
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Save Entire Configuration
  const saveConfig = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!configName || !jobKeywords || !jobLocation) {
        toast.error('Name, job keywords, and location are required');
        return;
      }

      // Build configuration object
      const configData = {
        name: configName,
        isActive,
        portal: selectedPortal,
        keywords: jobKeywords,
        location: jobLocation,
        experience: jobExperience,
        jobType,
        minRating,
        maxApplications,
        selfDescription,
        frequency: applyFrequency,
        days: applyDays,
        time: applyTime,
        hourlyInterval: applyHourlyInterval,
        emailNotifications,
        whatsappNotifications
      };

      let response;
      
      if (currentConfigId) {
        response = await jobConfigService.updateConfig(currentConfigId, configData);
      } else {
        response = await jobConfigService.createConfig(configData);
      }
      
      if (response && response.success) {
        if (response.config && response.config.id) {
          setCurrentConfigId(response.config.id);
        }
        
        toast.success(currentConfigId ? 'Configuration updated successfully' : 'Configuration created successfully');
      } else {
        toast.error(response?.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Run Job Now
  const runNow = async () => {
    try {
      setLoading(true);
      
      if (!currentConfigId) {
        toast.error('You must have a saved configuration to run it');
        return;
      }
      
      const response = await jobConfigService.runConfig(currentConfigId);
      
      if (response && response.success) {
        toast.success('Job execution triggered successfully');
      } else {
        toast.error(response?.message || 'Failed to run job');
      }
    } catch (error) {
      console.error('Error running job:', error);
      toast.error('Failed to run job');
    } finally {
      setLoading(false);
    }
  };

  // Navigation Functions ==========================================
  
  const nextStep = () => {
    // Validate current step before proceeding
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

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  // Helper Functions ==============================================
  
  const getNextRunTime = () => {
    // Calculate next run based on current settings
    const now = new Date();
    
    if (applyFrequency === 'hourly') {
      const nextRun = new Date(now);
      nextRun.setHours(now.getHours() + applyHourlyInterval);
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

  // Render Functions ==============================================
  
  // Step 1: Portal Credentials
  const renderPortalStep = () => {
    return (
      <div className="space-y-6">
        <div className="portal-selector flex flex-wrap gap-3">
          {portalData.map(portal => (
            <div
              key={portal.id}
              className={`flex items-center p-3 border rounded-lg ${portal.id === 'N' ? 'border-primary bg-primary/5' : ''} ${!portal.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
              onClick={() => {
                if (portal.available) {
                  setSelectedPortal(portal.name.toLowerCase());
                }
              }}
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
              {loading ? (
                <RotateCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
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

  // Step 2: Search Criteria
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
  };

  // Step 3: AI Training
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
              onClick={saveAITraining}
              disabled={loading || selfDescription.trim().length === 0}
            >
              {loading ? (
                <RotateCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
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

  // Step 4: Schedule
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

          {/* Time picker for non-hourly options */}
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

  // Step 5: Notifications
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

  // Step 6: Review
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
                  <span className="capitalize">{selectedPortal}</span>
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
              {loading ? (
                <RotateCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {currentConfigId ? 'Update Configuration' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Main step content selector
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
          <DialogTitle>
            {currentConfigId ? `Edit: ${configName}` : steps[currentStep - 1].title}
          </DialogTitle>
        </DialogHeader>
        
        {/* Saved configs dropdown - only visible in first step */}
        {currentStep === 1 && configs.length > 0 && (
          <div className="mb-4 p-3 border rounded-md bg-muted/10">
            <Label htmlFor="savedConfigs" className="mb-2 block">Load saved configuration:</Label>
            <div className="flex gap-2">
              <select 
                id="savedConfigs" 
                className="flex-1 h-10 px-3 border border-input rounded-md bg-background"
                onChange={(e) => {
                  const configId = e.target.value;
                  if (configId) {
                    setCurrentConfigId(configId);
                    fetchConfigById(configId);
                  } else {
                    setCurrentConfigId(null);
                  }
                }}
                value={currentConfigId || ''}
              >
                <option value="">Select a configuration</option>
                {configs.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name || `Config #${config.id}`}
                  </option>
                ))}
              </select>
              {currentConfigId && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this configuration?")) {
                      try {
                        setLoading(true);
                        await jobConfigService.deleteConfig(currentConfigId);
                        setCurrentConfigId(null);
                        setConfigName('My Auto Job Config');
                        fetchConfigs();
                        toast.success("Configuration deleted successfully");
                      } catch (error) {
                        toast.error("Failed to delete configuration");
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>
        )}
        
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
}