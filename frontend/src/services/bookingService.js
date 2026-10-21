import api from "./api";

export const bookingService = {
    estimateFare: async (payload) => {
        const res = await api.post("/bookings/estimate/", payload);
        return res.data;
    },

    createBooking: async (payload) => {
        const res = await api.post("/bookings/create/", payload);
        return res.data;
    },

    getMyBookings: async () => {
        const res = await api.get("/bookings/my-bookings/");
        return res.data;
    },

    getBookingDetail: async (bookingId) => {
        const res = await api.get(`/bookings/${bookingId}/`);
        return res.data;
    },

    payAdvance: async (bookingId, paymentData = {}) => {
        const res = await api.post(`/bookings/${bookingId}/pay-advance/`, paymentData);
        return res.data;
    },

    payRemaining: async (bookingId, paymentData = {}) => {
        const res = await api.post(`/bookings/${bookingId}/pay-remaining/`, paymentData);
        return res.data;
    },

    submitReview: async (bookingId, reviewData) => {
        const res = await api.post(`/bookings/${bookingId}/review/`, reviewData);
        return res.data;
    },

    getNotifications: async () => {
        const res = await api.get("/bookings/notifications/list/");
        return res.data;
    },

    markNotificationsRead: async () => {
        const res = await api.patch("/bookings/notifications/read-all/");
        return res.data;
    }
};
