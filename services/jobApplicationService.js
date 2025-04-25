import api from "./service";

// API functions for job applications
const jobApplications = {
  // Get all job applications with pagination and filtering
  getAll: (params = {}) => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && { status: params.status }),
      ...(params.company && { company: params.company }),
      ...(params.portal && { portal: params.portal }),
      sortBy: params.sortBy || 'appliedOn',
      sortOrder: params.sortOrder || 'desc'
    };

    return api.get('/job-applications', { params: queryParams });
  },

};

// Export the API utilities
export default {
  jobApplications
};