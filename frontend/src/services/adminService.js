import api from "./api";

export const adminService = {
    // Analytics
    getAnalytics: async () => {
        const res = await api.get("/admin/analytics/");
        return res.data;
    },

    // User Management
    getUsers: async (params = {}) => {
        const res = await api.get("/admin/users/", { params });
        return res.data;
    },

    suspendUser: async (userId, isSuspended) => {
        const res = await api.put(`/admin/users/${userId}/suspend/`, { is_suspended: isSuspended });
        return res.data;
    },

    deleteUser: async (userId) => {
        const res = await api.delete(`/admin/users/${userId}/`);
        return res.data;
    },

    // Driver Management
    getDrivers: async (params = {}) => {
        const res = await api.get("/admin/drivers/", { params });
        return res.data;
    },

    suspendDriver: async (driverId, isSuspended) => {
        const res = await api.put(`/admin/drivers/${driverId}/suspend/`, { is_suspended: isSuspended });
        return res.data;
    },

    updateDriverKYC: async (driverId, decision, reason = "") => {
        const res = await api.put(`/admin/drivers/${driverId}/kyc/`, { decision, reason });
        return res.data;
    },

    getDriverKYC: async (driverId) => {
        const res = await api.get(`/admin/drivers/${driverId}/kyc/`);
        return res.data;
    },

    getDriverKYCDocument: async (driverId, category, reference) => {
        const res = await api.get(`/admin/drivers/${driverId}/kyc/documents/${category}/`, {
            params: { reference },
            responseType: "blob"
        });
        return res.data;
    },

    deleteDriver: async (driverId) => {
        const res = await api.delete(`/admin/drivers/${driverId}/`);
        return res.data;
    },

    // Bookings
    getBookings: async (params = {}) => {
        const res = await api.get("/admin/bookings/", { params });
        return res.data;
    }
};
