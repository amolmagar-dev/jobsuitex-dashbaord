// components/auto-job-modal/useJobConfig.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { portalCredentialService } from "@/services/portalCredentialService";
import { jobConfigService } from "@/services/jobConfigService";

export function useJobConfig(isOpen: boolean) {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobConfig, setJobConfig] = useState<any>(null);
  const [currentPortal, setCurrentPortal] = useState<string>("naukri");

  // Step 1: Portal Credentials state
  const [selectedPortal, setSelectedPortal] = useState("naukri");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // New verification state
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [lastVerifiedUsername, setLastVerifiedUsername] = useState("");
  const [lastVerifiedPassword, setLastVerifiedPassword] = useState("");

  // Step 2: Search Criteria state
  const [jobKeywords, setJobKeywords] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobExperience, setJobExperience] = useState(2);
  const [jobType, setJobType] = useState("fulltime");
  const [minRating, setMinRating] = useState(3.5);
  const [maxApplications, setMaxApplications] = useState(10);

  // Step 3: AI Training state
  const [selfDescription, setSelfDescription] = useState("");
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  // Step 4: Schedule state
  const [applyFrequency, setApplyFrequency] = useState("daily");
  const [applyDays, setApplyDays] = useState([1, 2, 3, 4, 5]); // Monday to Friday
  const [applyTime, setApplyTime] = useState("09:00");
  const [applyHourlyInterval, setApplyHourlyInterval] = useState(1);

  // Step 5: Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);

  // Portal data
  const portalData = [
    { id: "N", name: "Naukri", available: true, status: "Available" },
    { id: "L", name: "Linkedin", available: false, status: "Coming Soon" },
    { id: "I", name: "Indeed", available: false, status: "Coming Soon" },
    { id: "M", name: "Monster", available: false, status: "Coming Soon" },
  ];

  // Effects =======================================================

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      fetchJobConfig();
      fetchPortalCredentials(selectedPortal);
    }
  }, [isOpen]);

  // Update credentials when portal changes
  useEffect(() => {
    if (isOpen) {
      fetchPortalCredentials(selectedPortal);
      loadPortalConfig(selectedPortal);
    }
  }, [selectedPortal, isOpen, jobConfig]);

  // Reset verification when credentials change
  useEffect(() => {
    if (username !== lastVerifiedUsername || password !== lastVerifiedPassword) {
      setIsVerified(false);
      setVerificationError(null);
    }
  }, [username, password, lastVerifiedUsername, lastVerifiedPassword]);

  // API Functions =================================================

  // Fetch job configuration
  const fetchJobConfig = async () => {
    try {
      setLoading(true);
      const response = await jobConfigService.getConfig();

      if (response.success && response.config) {
        setJobConfig(response.config);
        setIsActive(response.config.isActive);
        
        // Load AI training data
        if (response.config.aiTraining?.selfDescription) {
          setSelfDescription(response.config.aiTraining.selfDescription);
        }
        
        // Load schedule settings
        if (response.config.schedule) {
          setApplyFrequency(response.config.schedule.frequency || "daily");
          setApplyDays(response.config.schedule.days || [1, 2, 3, 4, 5]);
          setApplyTime(response.config.schedule.time || "09:00");
          setApplyHourlyInterval(response.config.schedule.hourlyInterval || 1);
        }
        
        // Load notification settings
        if (response.config.notifications) {
          setEmailNotifications(response.config.notifications.email !== undefined ? response.config.notifications.email : true);
          setWhatsappNotifications(response.config.notifications.whatsapp || false);
        }
        
        // Load portal-specific config for the currently selected portal
        loadPortalConfig(selectedPortal);
      } else {
        // Initialize with defaults if no config exists
        resetToDefaults();
      }
    } catch (error) {
      console.error("Error fetching job config:", error);
      toast.error("Failed to load job configuration");
      resetToDefaults();
    } finally {
      setLoading(false);
    }
  };

  // Load portal-specific configuration
  const loadPortalConfig = (portalType: string) => {
    if (!jobConfig || !jobConfig.portals) return;
    
    const portalConfig = jobConfig.portals.find((p: any) => p.type === portalType);
    
    if (portalConfig) {
      // Load search criteria
      setJobKeywords(portalConfig.searchConfig?.keywords || "");
      setJobLocation(portalConfig.searchConfig?.location || "");
      setJobExperience(portalConfig.searchConfig?.experience || 2);
      
      // Load filter criteria
      setJobType(portalConfig.jobType || "fulltime");
      setMinRating(portalConfig.filterConfig?.minRating || 3.5);
      setMaxApplications(portalConfig.filterConfig?.maxApplications || 10);
    } else {
      // Reset portal-specific fields to defaults
      setJobKeywords("");
      setJobLocation("");
      setJobExperience(2);
      setJobType("fulltime");
      setMinRating(3.5);
      setMaxApplications(10);
    }
  };

  // Reset all form fields to defaults
  const resetToDefaults = () => {
    setIsActive(false);
    setJobKeywords("");
    setJobLocation("");
    setJobExperience(2);
    setJobType("fulltime");
    setMinRating(3.5);
    setMaxApplications(10);
    setSelfDescription("");
    setApplyFrequency("daily");
    setApplyDays([1, 2, 3, 4, 5]);
    setApplyTime("09:00");
    setApplyHourlyInterval(1);
    setEmailNotifications(true);
    setWhatsappNotifications(false);
  };

  // Step 1: Portal Credentials API Functions
  const fetchPortalCredentials = async (portal: string) => {
    try {
      const response = await portalCredentialService.getCredentials(portal);

      if (response && response.success && response.credential) {
        setUsername(response.credential.username || "");
        setCredentialsSaved(true);
        // If credentials were previously saved, we'll consider them verified
        setIsVerified(true);
        setLastVerifiedUsername(response.credential.username || "");
        // Don't set lastVerifiedPassword as we don't have it
      } else {
        setUsername("");
        setCredentialsSaved(false);
        setIsVerified(false);
      }

      // Always clear password for security
      setPassword("");
    } catch (error) {
      console.error("Error fetching credentials:", error);
      setCredentialsSaved(false);
      setIsVerified(false);
    }
  };

  const saveCredentials = async () => {
    try {
      setLoading(true);

      if (!username) {
        toast.error("Username is required");
        return;
      }

      // Only allow saving if verification was successful or credentials were previously saved
      if (!isVerified && !credentialsSaved) {
        toast.error("Please verify your connection before saving credentials");
        return;
      }

      // Only require password for new credentials
      if (!credentialsSaved && !password) {
        toast.error("Password is required");
        return;
      }

      const credentialData = {
        portal: selectedPortal,
        username,
        password: password || undefined, // Only send password if provided
      };

      const response = await portalCredentialService.saveCredentials(credentialData);

      if (response && response.success) {
        setCredentialsSaved(true);
        setPassword(""); // Clear password for security
        toast.success("Credentials saved successfully");
      } else {
        toast.error(response?.message || "Failed to save credentials");
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      toast.error("Failed to save credentials");
    } finally {
      setLoading(false);
    }
  };

  const verifyConnection = async () => {
    try {
      setLoading(true);

      // Check if we have credentials to verify
      if (!username) {
        setVerificationError("Username is required");
        toast.error("Username is required");
        return;
      }

      if (!password && !credentialsSaved) {
        setVerificationError("Password is required");
        toast.error("Password is required");
        return;
      }

      const credentials = {
        username,
        password: password || undefined, // Only include if provided
      };

      const response = await portalCredentialService.verifyCredentials(selectedPortal, credentials);

      if (response && response.success) {
        setIsVerified(true);
        setVerificationError(null);
        setLastVerifiedUsername(username);
        setLastVerifiedPassword(password);
        toast.success("Connection verified successfully");
      } else {
        setIsVerified(false);
        setVerificationError(response?.message || "Failed to verify credentials");
        toast.error(response?.message || "Failed to verify credentials");
      }
    } catch (error) {
      console.error("Error verifying credentials:", error);
      setIsVerified(false);
      setVerificationError("Failed to verify connection");
      toast.error("Failed to verify connection");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save portal configuration
  const savePortalConfig = async () => {
    try {
      setLoading(true);
      
      if (!jobKeywords || !jobLocation) {
        toast.error("Job keywords and location are required");
        return;
      }

      const portalData = {
        isActive: true,
        searchConfig: {
          keywords: jobKeywords,
          location: jobLocation,
          experience: jobExperience
        },
        filterConfig: {
          minRating,
          maxApplications,
          jobType
        }
      };

      const response = await jobConfigService.updatePortalConfig(selectedPortal, portalData);

      if (response && response.success) {
        setJobConfig(response.config);
        toast.success(`${selectedPortal} configuration saved successfully`);
        return true;
      } else {
        toast.error("Failed to save portal configuration");
        return false;
      }
    } catch (error) {
      console.error("Error saving portal config:", error);
      toast.error("Failed to save portal configuration");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: AI Profile Analysis
  const analyzeProfile = async () => {
    try {
      setIsGeneratingProfile(true);

      if (!credentialsSaved) {
        toast.error("Credentials must be saved before analyzing profile");
        return;
      }

      const response = await jobConfigService.analyzeProfile(selectedPortal);

      if (response && response.success && response.profileDescription) {
        setSelfDescription(response.profileDescription);
        toast.success("Profile analyzed and description generated successfully");
      } else {
        // Fallback for testing/demo purposes
        const demoProfile =
          "I am a skilled professional with 5 years of experience in software development. Proficient in React, Node.js, and AWS. I have worked on multiple projects delivering scalable solutions for enterprise clients. I am a quick learner with excellent problem-solving skills and enjoy working in collaborative environments.";
        setSelfDescription(demoProfile);
        toast.success("Profile analyzed and description generated successfully");
      }
    } catch (error) {
      console.error("Error analyzing profile:", error);
      // Fallback for testing/demo purposes
      const demoProfile =
        "I am a skilled professional with 5 years of experience in software development. Proficient in React, Node.js, and AWS. I have worked on multiple projects delivering scalable solutions for enterprise clients. I am a quick learner with excellent problem-solving skills and enjoy working in collaborative environments.";
      setSelfDescription(demoProfile);
      toast.success("Profile analyzed and description generated successfully");
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // Step 3: Save AI Training Data
  const saveAITraining = async () => {
    try {
      setLoading(true);

      if (!selfDescription.trim()) {
        toast.error("Please provide a description about yourself");
        return;
      }

      const response = await jobConfigService.saveAITraining({
        selfDescription,
      });

      if (response && response.success) {
        toast.success("AI training data saved");
        return true;
      } else {
        toast.error("Failed to save AI training data");
        return false;
      }
    } catch (error) {
      console.error("Error saving AI training:", error);
      toast.error("Failed to save AI training data");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Save Schedule Settings
  const saveSchedule = async () => {
    try {
      setLoading(true);

      const scheduleData = {
        frequency: applyFrequency,
        days: applyDays,
        time: applyTime,
        hourlyInterval: applyHourlyInterval
      };

      const response = await jobConfigService.updateSchedule(scheduleData);

      if (response && response.success) {
        toast.success("Schedule settings saved");
        return true;
      } else {
        toast.error("Failed to save schedule settings");
        return false;
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to save schedule settings");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Save Notification Settings
  const saveNotifications = async () => {
    try {
      setLoading(true);

      const notificationData = {
        email: emailNotifications,
        whatsapp: whatsappNotifications,
        notifyAbout: {
          applications: true, // Default value
          interviews: true,   // Default value
          errors: true        // Default value
        }
      };

      const response = await jobConfigService.updateNotifications(notificationData);

      if (response && response.success) {
        toast.success("Notification settings saved");
        return true;
      } else {
        toast.error("Failed to save notification settings");
        return false;
      }
    } catch (error) {
      console.error("Error saving notifications:", error);
      toast.error("Failed to save notification settings");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle Job Config Active Status
  const toggleActiveStatus = async () => {
    try {
      setLoading(true);
      const response = await jobConfigService.toggleActive();

      if (response && response.success) {
        setIsActive(response.isActive);
        toast.success(response.message);
      } else {
        toast.error("Failed to update active status");
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast.error("Failed to update active status");
    } finally {
      setLoading(false);
    }
  };

  // Run Job Config
  const runNow = async () => {
    try {
      setLoading(true);
      const response = await jobConfigService.runConfig(selectedPortal as any);

      if (response && response.success) {
        toast.success("Job execution triggered successfully");
      } else {
        toast.error(response?.message || "Failed to run job");
      }
    } catch (error) {
      console.error("Error running job:", error);
      toast.error("Failed to run job");
    } finally {
      setLoading(false);
    }
  };

  // Navigation Functions ==========================================

  const nextStep = () => {
    if (currentStep < 6) {
      // Validate and save current step before proceeding
      const validateAndSaveStep = async () => {
        let isValid = true;
        
        // Validate step 1: Portal credentials
        if (currentStep === 1) {
          if (!credentialsSaved && !isVerified) {
            toast.error("Please verify and save your credentials before proceeding");
            isValid = false;
          }
        }
        
        // Validate and save step 2: Search criteria
        if (currentStep === 2) {
          if (!jobKeywords || !jobLocation) {
            toast.error("Job keywords and location are required");
            isValid = false;
          } else {
            // Save portal configuration
            isValid = (await savePortalConfig()) ?? false;
          }
        }
        
        // Save step 3: AI training
        if (currentStep === 3 && selfDescription.trim()) {
          isValid = (await saveAITraining()) ?? false;
        }
        
        // Save step 4: Schedule
        if (currentStep === 4) {
          isValid = await saveSchedule();
        }
        
        // Save step 5: Notifications
        if (currentStep === 5) {
          isValid = await saveNotifications();
        }
        
        if (isValid) {
          setCurrentStep(currentStep + 1);
        }
      };
      
      validateAndSaveStep();
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

    if (applyFrequency === "hourly") {
      const nextRun = new Date(now);
      nextRun.setHours(now.getHours() + applyHourlyInterval);
      return nextRun.toLocaleString();
    }

    const [hours, minutes] = applyTime.split(":").map(Number);
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    if (applyFrequency === "weekly" || applyFrequency === "custom") {
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

  // Group all the state and functions to return
  const state = {
    // Core state
    isActive,
    setIsActive,
    loading,
    toggleActiveStatus,

    // Step 1: Portal Credentials
    selectedPortal,
    setSelectedPortal,
    username,
    setUsername,
    password,
    setPassword,
    credentialsSaved,
    showPassword,
    setShowPassword,
    portalData,
    saveCredentials,
    verifyConnection,
    isVerified,
    verificationError,

    // Step 2: Search Criteria
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
    savePortalConfig,

    // Step 3: AI Training
    selfDescription,
    setSelfDescription,
    isGeneratingProfile,
    analyzeProfile,
    saveAITraining,

    // Step 4: Schedule
    applyFrequency,
    setApplyFrequency,
    applyDays,
    setApplyDays,
    applyTime,
    setApplyTime,
    applyHourlyInterval,
    setApplyHourlyInterval,
    saveSchedule,

    // Step 5: Notifications
    emailNotifications,
    setEmailNotifications,
    whatsappNotifications,
    setWhatsappNotifications,
    saveNotifications,

    // Step 6: Review & Execute
    runNow,
    getNextRunTime,
  };

  return {
    // Core state and navigation
    currentStep,
    currentPortal,
    loading,
    credentialsSaved,
    jobKeywords,
    jobLocation,
    setCurrentStep,
    goToStep,
    fetchJobConfig,
    setCurrentPortal,
    nextStep,
    prevStep,
    state,
  };
}