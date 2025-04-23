import api from "./service";

// API functions for job applications
const jobApplications = {
    // Get all job applications with pagination and filtering
    getAll: (params = {}) => {
        return api.get('/job-applications', { params });
    },

    // Get a specific job application
    getById: (id) => {
        return api.get(`/job-applications/${id}`);
    },

    // Create a new job application
    create: (applicationData) => {
        return api.post('/job-applications', applicationData);
    },

    // Update a job application
    update: (id, updateData) => {
        return api.put(`/job-applications/${id}`, updateData);
    },

    // Update job application status
    updateStatus: (id, status, notes) => {
        return api.patch(`/job-applications/${id}/status`, { status, notes });
    },

    // Delete a job application
    delete: (id) => {
        return api.delete(`/job-applications/${id}`);
    },

    // Get job application statistics
    getStatistics: () => {
        return api.get('/job-applications/stats');
    },

    // Get job application history
    getHistory: (id) => {
        return api.get(`/job-applications/${id}/history`);
    },

    // Bulk update job applications
    bulkUpdate: (applicationIds, status, notes) => {
        return api.post('/job-applications/bulk-update', { applicationIds, status, notes });
    }
};

// Export the API utilities
export default {
    jobApplications
};