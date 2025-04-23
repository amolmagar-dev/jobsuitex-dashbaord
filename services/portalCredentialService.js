import api from "./service";

// API service for portal credentials
const portalCredentialService = {
  // Get credentials for a specific portal
  getCredentials: async (portal) => {
    try {
      const response = await api.get(`/portal-credentials/${portal}`);
      return response.data;
    } catch (error) {
      // Return null if credentials not found (404)
      if (error.response?.status === 404) {
        return { success: false, credential: null };
      }
      throw error;
    }
  },

  // Save credentials for a portal
  saveCredentials: async (credentialData) => {
    try {
      const response = await api.post('/portal-credentials', credentialData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify credentials for a portal
  verifyCredentials: async (portal, credentials) => {
    try {
      const response = await api.post(`/portal-credentials/${portal}/verify`, credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export { portalCredentialService };