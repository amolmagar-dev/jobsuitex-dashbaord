// services/jobConfigService.js
import api from "./service";

// API service for job configurations
const jobConfigService = {
  // Get the user's job configuration
  getConfig: async () => {
    try {
      const response = await api.get('/job-config');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get just the status of the job configuration
  getStatus: async () => {
    try {
      const response = await api.get('/job-config/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create or update the job configuration
  saveConfig: async (configData) => {
    try {
      const response = await api.post('/job-config', configData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a specific portal's configuration
  updatePortalConfig: async (portalType, portalData) => {
    try {
      const response = await api.put(`/job-config/portals/${portalType}`, portalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a portal from the job config
  deletePortal: async (portalType) => {
    try {
      const response = await api.delete(`/job-config/portals/${portalType}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Toggle the job config's active status
  toggleActive: async () => {
    try {
      const response = await api.patch('/job-config/toggle');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update schedule settings
  updateSchedule: async (scheduleData) => {
    try {
      const response = await api.put('/job-config/schedule', scheduleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Save AI training data
  saveAITraining: async (trainingData) => {
    try {
      const response = await api.put('/job-config/ai-training', trainingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update notification settings including mobile number
  updateNotifications: async (notificationData) => {
    try {
      // Validate mobile number if WhatsApp is enabled
      if (notificationData.whatsapp && !notificationData.mobileNumber) {
        throw new Error('Mobile number is required for WhatsApp notifications');
      }

      const response = await api.put('/job-config/notifications', notificationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Run job config immediately (optionally for a specific portal)
  runConfig: async (portalType = null) => {
    try {
      const data = portalType ? { portalType } : {};
      const response = await api.post('/job-config/run', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Analyze user profile
  analyzeProfile: async (portal) => {
    try {
      const response = await api.post('/job-config/analyze-profile', { portal });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Export the service
export { jobConfigService };