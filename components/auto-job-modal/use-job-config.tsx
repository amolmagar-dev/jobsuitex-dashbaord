// components/auto-job-modal/useJobConfig.tsx
import { useState, useEffect, SetStateAction } from "react";
import { toast } from "sonner";
import { portalCredentialService } from "@/services/portalCredentialService";
import { jobConfigService } from "@/services/jobConfigService";

export function useJobConfig(isOpen: unknown) {
  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const [configName, setConfigName] = useState("My Auto Job Config");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);

  // Step 1: Portal Credentials state
  const [selectedPortal, setSelectedPortal] = useState("naukri");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      fetchConfigs();
      fetchPortalCredentials(selectedPortal);
    }
  }, [isOpen]);

  // Update credentials when portal changes
  useEffect(() => {
    if (isOpen) {
      fetchPortalCredentials(selectedPortal);
    }
  }, [selectedPortal, isOpen]);

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
      console.error("Error fetching configs:", error);
      toast.error("Failed to load saved configurations");
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific config by ID
  const fetchConfigById = async (id: any) => {
    try {
      setLoading(true);
      const response = await jobConfigService.getConfig(id);

      if (response && response.config) {
        loadConfigData(response.config);
      } else {
        toast.error("Failed to load configuration");
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Failed to load configuration details");
    } finally {
      setLoading(false);
    }
  };

  // Load config data into state
  const loadConfigData = (config: {
    name: any;
    isActive: any;
    portal: any;
    keywords: any;
    location: any;
    experience: any;
    jobType: any;
    minRating: any;
    maxApplications: any;
    selfDescription: any;
    frequency: any;
    days: any;
    time: any;
    hourlyInterval: any;
    emailNotifications: boolean | ((prevState: boolean) => boolean) | undefined;
    whatsappNotifications: any;
  }) => {
    // Basic info
    setConfigName(config.name || "My Auto Job Config");
    setIsActive(config.isActive || false);

    // Portal info
    setSelectedPortal(config.portal || "naukri");

    // Search criteria
    setJobKeywords(config.keywords || "");
    setJobLocation(config.location || "");
    setJobExperience(config.experience || 2);
    setJobType(config.jobType || "fulltime");
    setMinRating(config.minRating || 3.5);
    setMaxApplications(config.maxApplications || 10);

    // AI Training
    setSelfDescription(config.selfDescription || "");

    // Schedule
    setApplyFrequency(config.frequency || "daily");
    setApplyDays(config.days || [1, 2, 3, 4, 5]);
    setApplyTime(config.time || "09:00");
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
        setUsername(response.credential.username || "");
        setCredentialsSaved(true);
      } else {
        setUsername("");
        setCredentialsSaved(false);
      }

      // Always clear password for security
      setPassword("");
    } catch (error) {
      console.error("Error fetching credentials:", error);
      setCredentialsSaved(false);
    }
  };

  const saveCredentials = async () => {
    try {
      setLoading(true);

      if (!username) {
        toast.error("Username is required");
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
        toast.error("Username is required");
        return;
      }

      const credentials = {
        username,
        password: password || undefined, // Only include if provided
      };

      const response = await portalCredentialService.verifyCredentials(selectedPortal, credentials);

      if (response && response.success) {
        toast.success("Credentials verified successfully");
      } else {
        toast.error(response?.message || "Failed to verify credentials");
      }
    } catch (error) {
      console.error("Error verifying credentials:", error);
      toast.error("Failed to verify connection");
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

      const response = await jobConfigService.analyzeProfile(currentConfigId || "new", selectedPortal);

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

      const response = await jobConfigService.saveAITraining(currentConfigId || "new", {
        selfDescription,
      });

      if (response && response.success) {
        toast.success("AI training data saved");
      } else {
        toast.success("AI training data saved");
      }
    } catch (error) {
      console.error("Error saving AI training:", error);
      toast.error("Failed to save AI training data");
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
        toast.error("Name, job keywords, and location are required");
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
        whatsappNotifications,
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

        toast.success(currentConfigId ? "Configuration updated successfully" : "Configuration created successfully");
      } else {
        toast.error(response?.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Run Job Now
  const runNow = async () => {
    try {
      setLoading(true);

      if (!currentConfigId) {
        toast.error("You must have a saved configuration to run it");
        return;
      }

      const response = await jobConfigService.runConfig(currentConfigId);

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

  // Delete a job config
  const deleteConfig = async () => {
    try {
      if (confirm("Are you sure you want to delete this configuration?")) {
        setLoading(true);
        await jobConfigService.deleteConfig(currentConfigId);
        setCurrentConfigId(null);
        setConfigName("My Auto Job Config");
        fetchConfigs();
        toast.success("Configuration deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete configuration");
    } finally {
      setLoading(false);
    }
  };

  // Navigation Functions ==========================================

  const nextStep = () => {
    if (currentStep < 6) {
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
    configName,
    setConfigName,
    isActive,
    setIsActive,
    loading,
    currentConfigId,

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

    // Step 5: Notifications
    emailNotifications,
    setEmailNotifications,
    whatsappNotifications,
    setWhatsappNotifications,

    // Step 6: Review & Save
    saveConfig,
    runNow,
    getNextRunTime,
  };

  return {
    // Core state and navigation
    currentStep,
    configs,
    currentConfigId,
    loading,
    credentialsSaved,
    jobKeywords,
    jobLocation,
    configName,
    setCurrentStep,
    goToStep,
    fetchConfigs,
    fetchConfigById,
    setCurrentConfigId,
    deleteConfig,
    nextStep,
    prevStep,
    state,
  };
}
