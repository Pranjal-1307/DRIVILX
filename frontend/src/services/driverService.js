import api from "./api";

export const driverService = {
    getProfile: async () => {
        const res = await api.get("/drivers/profile/");
        return res.data;
    },

    updateProfile: async (payload) => {
        const res = await api.put("/drivers/profile/", payload);
        return res.data;
    },

    toggleStatus: async (status) => {
        const res = await api.post("/drivers/toggle-status/", { status });
        return res.data;
    },

    getKYC: async () => {
        const res = await api.get("/drivers/kyc/");
        return res.data;
    },

    submitKYC: async (payload) => {
        const res = await api.post("/drivers/kyc/", payload);
        return res.data;
    },

    getRequests: async (city = "") => {
        const url = city ? `/drivers/requests/?city=${encodeURIComponent(city)}` : "/drivers/requests/";
        const res = await api.get(url);
        return res.data;
    },

    takeActionOnRequest: async (bookingId, action) => {
        const res = await api.post(`/drivers/requests/${bookingId}/action/`, { action });
        return res.data;
    },

    getActiveTrip: async () => {
        const res = await api.get("/drivers/trips/active/");
        return res.data;
    },

    updateTripStatus: async (bookingId, status, otp = "") => {
        const res = await api.post("/drivers/trips/active/", {
            booking_id: bookingId,
            status,
            otp
        });
        return res.data;
    },

    getTripHistory: async () => {
        const res = await api.get("/drivers/trips/history/");
        return res.data;
    },

    getEarnings: async () => {
        const res = await api.get("/drivers/earnings/");
        return res.data;
    },

    requestPayout: async (amount, method = "UPI / Bank Transfer") => {
        const res = await api.post("/drivers/earnings/", { amount, method });
        return res.data;
    }
};

export default driverService;
