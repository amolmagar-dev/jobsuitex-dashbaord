import api from "./service";

// API service for job configurations
const jobConfigService = {
  // Get all job configurations
  getConfigs: async () => {
    try {
      const response = await api.get('/job-config');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get a specific job configuration
  getConfig: async (id) => {
    try {
      const response = await api.get(`/job-config/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a new job configuration
  createConfig: async (configData) => {
    try {
      const response = await api.post('/job-config', configData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update an existing job configuration
  updateConfig: async (id, configData) => {
    try {
      const response = await api.put(`/job-config/${id}`, configData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a job configuration
  deleteConfig: async (id) => {
    try {
      const response = await api.delete(`/job-config/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Run a job configuration immediately
  runConfig: async (id) => {
    try {
      const response = await api.post(`/job-config/${id}/run`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Save AI training data
  saveAITraining: async (id, trainingData) => {
    try {
      const response = await api.post(`/job-config/${id}/ai-training`, trainingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Analyze user profile
  analyzeProfile: async (id, portal) => {
    try {
      const response = await api.post(`/job-config/${id}/analyze-profile`, { portal });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};


// Export all services
export { jobConfigService };